/**
 * Script pentru import sample (100-100.000 firme) din CSV
 * Usage: npm run import:sample <path-to-csv> [limit]
 * Example: npm run import:sample "C:\path\to\file.csv" 100000
 */

import 'dotenv/config';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../server/db/index';
import { companies, sourceProvenance } from '../server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import * as fs from 'fs';
import * as readline from 'readline';
import * as iconv from 'iconv-lite';
import { randomUUID, createHash } from 'crypto';
import { generateCompanySlug, generateSEOContent } from '../lib/seo-utils';

interface CSVRow {
  DENUMIRE: string;
  CUI: string;
  COD_INMATRICULARE: string;
  DATA_INMATRICULARE: string;
  FORMA_JURIDICA: string;
  ADR_LOCALITATE: string;
  ADR_JUDET: string;
  ADR_DEN_STRADA: string;
  ADR_DEN_NR_STRADA: string;
  ADR_BLOC?: string;
  ADR_SCARA?: string;
  ADR_ETAJ?: string;
  ADR_APARTAMENT?: string;
  ADR_COD_POSTAL?: string;
  ADR_SECTOR?: string;
  COD_CAEN?: string;
}

function normalizeCUI(cui: string): string | null {
  if (!cui || cui === '0' || cui.trim() === '') return null;
  let normalized = cui.trim().replace(/^0+/, '');
  if (normalized === '') return null;
  if (!normalized.startsWith('RO')) {
    normalized = 'RO' + normalized;
  }
  if (!/^RO\d{2,10}$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return null;
}

function buildAddress(row: CSVRow): string {
  const parts: string[] = [];
  if (row.ADR_DEN_STRADA) parts.push(row.ADR_DEN_STRADA);
  if (row.ADR_DEN_NR_STRADA) parts.push(`nr. ${row.ADR_DEN_NR_STRADA}`);
  if (row.ADR_BLOC) parts.push(`Bl. ${row.ADR_BLOC}`);
  if (row.ADR_SCARA) parts.push(`Sc. ${row.ADR_SCARA}`);
  if (row.ADR_ETAJ) parts.push(`Et. ${row.ADR_ETAJ}`);
  if (row.ADR_APARTAMENT) parts.push(`Ap. ${row.ADR_APARTAMENT}`);
  if (row.ADR_COD_POSTAL) parts.push(`Cod poștal: ${row.ADR_COD_POSTAL}`);
  return parts.join(', ');
}

function sanitizeValue(value: string): string {
  if (!value) return '';
  // Elimină BOM și caractere control
  let sanitized = value
    .replace(/^\uFEFF/, '') // BOM
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/<script/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  return sanitized;
}

async function importSample(csvPath: string, limit: number = 100000) {
  if (!db) {
    throw new Error('Database connection not available');
  }

  console.log(`🚀 Import sample: ${limit.toLocaleString()} firme din CSV...\n`);

  // Pentru volume mari, citim fișierul ca stream pentru eficiență
  // Estimează că fiecare linie are ~200-500 bytes în medie
  const estimatedBytesPerLine = 400;
  const estimatedBytesNeeded = limit * estimatedBytesPerLine * 2; // x2 pentru buffer
  const MAX_BYTES = Math.min(estimatedBytesNeeded, 500 * 1024 * 1024); // Max 500MB pentru 100K firme

  console.log(`📖 Citire ~${Math.round(MAX_BYTES / 1024 / 1024)}MB din fișier...\n`);

  const buffer = Buffer.allocUnsafe(MAX_BYTES);
  const fd = fs.openSync(csvPath, 'r');
  const bytesRead = fs.readSync(fd, buffer, 0, MAX_BYTES, 0);
  fs.closeSync(fd);

  const decodedText = (iconv as any).decode(buffer.slice(0, bytesRead), 'win1250');
  const lines = decodedText.split(/\r?\n/).filter((l: string) => l.trim() !== '');

  let headers: string[] = [];
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  const rows: CSVRow[] = [];

  // Procesează header-ul
  if (lines.length > 0) {
    let headerLine = lines[0];
    // Elimină BOM și toate caracterele non-ASCII din prima coloană
    headerLine = headerLine.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    headers = headerLine.split('^').map((h: string, idx: number) => {
      let cleaned = sanitizeValue(h.trim());
      // Pentru prima coloană, elimină toate caracterele non-printabile
      if (idx === 0) {
        cleaned = cleaned.replace(/[^\x20-\x7E\u0100-\u017F]/g, '').trim();
      }
      return cleaned;
    });
    console.log(`✅ Header-uri: ${headers.length} coloane`);
    console.log(`   Primele 5: ${headers.slice(0, 5).map(h => `'${h}'`).join(', ')}...`);
    console.log(`   DENUMIRE index: ${headers.indexOf('DENUMIRE')}`);
    console.log(`   CUI index: ${headers.indexOf('CUI')}\n`);
  }

  // Procesează liniile de date
  let skippedPF = 0;
  let skippedInvalid = 0;
  
  for (let i = 1; i < lines.length && rows.length < limit; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;

    const values = line.split('^');
    if (values.length !== headers.length) {
      if (i <= 10) {
        console.warn(`⚠️  Linia ${i + 1}: Column mismatch (${values.length} vs ${headers.length})`);
      }
      continue;
    }

    // Folosește index-uri directe (DENUMIRE=0, CUI=1) pentru a evita problemele cu BOM
    const denumire = sanitizeValue(values[0] || '').trim();
    const cuiRaw = sanitizeValue(values[1] || '').trim();
    
    // Construiește row pentru compatibilitate
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = sanitizeValue(values[index] || '');
    });
    row.DENUMIRE = denumire; // Asigură-te că există
    row.CUI = cuiRaw;
    
    // Debug primele 10 linii
    if (i <= 10) {
      console.log(`🔍 Linia ${i + 1}: DENUMIRE='${denumire.substring(0, 30)}' CUI='${cuiRaw}'`);
    }
    
    // Skip persoane fizice (CUI='0') sau linii fără denumire
    if (!denumire) {
      skippedInvalid++;
      continue;
    }
    
    if (cuiRaw === '0' || cuiRaw === '') {
      skippedPF++;
      if (i <= 10) {
        console.log(`   ⏭️  Skip PF (CUI=0)`);
      }
      continue;
    }
    
    // Normalizează CUI
    const cui = normalizeCUI(cuiRaw);
    if (!cui) {
      skippedInvalid++;
      if (i <= 10) {
        console.warn(`   ❌ CUI invalid '${cuiRaw}'`);
      }
      continue;
    }
    
    // Debug primele 3 firme valide
    if (rows.length < 3) {
      console.log(`✅ Linia ${i + 1}: ${denumire.substring(0, 40)}... | CUI: ${cui}`);
    }

    rows.push(row as CSVRow);
    
    // Progress indicator optimizat pentru 10K+ firme
    const readProgressInterval = limit > 10000 ? 1000 : limit > 1000 ? 500 : 10;
    if (rows.length % readProgressInterval === 0) {
      console.log(`📖 Citite: ${rows.length}/${limit}...`);
    }
  }
  
  console.log(`\n📊 Statistici:`);
  console.log(`   ✅ Firme valide: ${rows.length}`);
  console.log(`   ⏭️  Persoane fizice skip: ${skippedPF}`);
  console.log(`   ❌ Invalid skip: ${skippedInvalid}`);

  console.log(`\n📊 Procesare ${rows.length} firme în baza de date...\n`);

  // OPTIMIZARE: Procesare în batch-uri de 50 firme pentru viteză maximă
  const BATCH_SIZE = 50;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    try {
      // Verificare bulk existență pentru tot batch-ul
      const cifs = batch.map(row => normalizeCUI(row.CUI)).filter(Boolean) as string[];
      const existingCompanies = await db
        .select({ cif: companies.cif })
        .from(companies)
        .where(inArray(companies.cif, cifs));

      const existingCifs = new Set(existingCompanies.map(c => c.cif));

      const toInsert: any[] = [];
      const toUpdate: any[] = [];

      for (const row of batch) {
        const cui = normalizeCUI(row.CUI);
        if (!cui) continue;

        const companyData = {
          cif: cui,
          name: row.DENUMIRE.trim().substring(0, 500),
          registrationNumber: row.COD_INMATRICULARE || null,
          registrationDate: parseDate(row.DATA_INMATRICULARE),
          legalForm: row.FORMA_JURIDICA || null,
          address: buildAddress(row) || null,
          city: row.ADR_LOCALITATE || null,
          county: row.ADR_JUDET || null,
          mainActivity: row.COD_CAEN ? `CAEN ${row.COD_CAEN}` : null,
          status: 'activ',
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (existingCifs.has(cui)) {
          toUpdate.push({ ...companyData, cif: cui });
        } else {
          const companyId = randomUUID();
          toInsert.push({
            id: companyId,
            ...companyData,
            slug: generateCompanySlug(companyData.name, companyData.cif),
            seoContent: generateSEOContent({
              name: companyData.name,
              cif: companyData.cif,
              city: companyData.city || undefined,
              county: companyData.county || undefined,
              legalForm: companyData.legalForm || undefined,
              mainActivity: companyData.mainActivity || undefined,
              status: companyData.status || 'activ',
            }),
          });
        }
      }

      // Bulk update
      if (toUpdate.length > 0) {
        for (const updateData of toUpdate) {
          const { cif, ...data } = updateData;
          await db.update(companies).set({ ...data, updatedAt: new Date() }).where(eq(companies.cif, cif));
        }
        totalUpdated += toUpdate.length;
      }

      // Bulk insert
      if (toInsert.length > 0) {
        await db.insert(companies).values(toInsert);
        totalInserted += toInsert.length;

        // Insert source provenance pentru noile firme
        const provenanceData = toInsert.map(company => ({
          id: randomUUID(),
          entityType: 'company' as const,
          entityId: company.id,
          fieldName: 'all',
          sourceName: 'ONRC CSV Export',
          sourceUrl: 'https://www.onrc.ro',
          fetchedAt: new Date(),
          hashPayload: createHash('sha256').update(JSON.stringify(company)).digest('hex'),
        }));
        await db.insert(sourceProvenance).values(provenanceData);
      }

      // Progress indicator
      const progress = Math.round(((i + batch.length) / rows.length) * 100);
      console.log(`📈 Progress: ${progress}% (${i + batch.length}/${rows.length}) - Inserate: ${totalInserted}, Actualizate: ${totalUpdated}, Batch ${batchNum}`);

    } catch (error) {
      console.error(`❌ Eroare batch ${batchNum}:`, error);
      totalErrors += batch.length;
    }
  }

  console.log(`\n✅ Import Sample Finalizat!`);
  console.log(`   ✅ Inserate: ${totalInserted}`);
  console.log(`   🔄 Actualizate: ${totalUpdated}`);
  console.log(`   ❌ Erori: ${totalErrors}`);
  console.log(`   📊 Total procesate: ${totalInserted + totalUpdated + totalErrors}`);
}

const csvPath = process.argv[2] || 'C:\\Users\\App Consult Deck\\Downloads\\od_firme.csv';
const limit = parseInt(process.argv[3]) || 100000; // Default 100.000 firme

importSample(csvPath, limit).catch(console.error);

