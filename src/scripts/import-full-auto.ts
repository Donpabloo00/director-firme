/**
 * Script pentru import complet automat al tuturor firmelor din CSV
 * Rulează în background și scrie progresul în fișier JSON
 * 
 * Usage: npx tsx src/scripts/import-full-auto.ts <path-to-csv>
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
import { randomUUID, createHash } from 'crypto';
import * as iconv from 'iconv-lite';
import { generateCompanySlug, generateSEOContent } from '../lib/seo-utils';

interface CSVRow {
  DENUMIRE: string;
  CUI: string;
  COD_INMATRICULARE?: string;
  DATA_INMATRICULARE?: string;
  EUID?: string;
  FORMA_JURIDICA?: string;
  ADR_TARA?: string;
  ADR_LOCALITATE?: string;
  ADR_JUDET?: string;
  ADR_DEN_STRADA?: string;
  ADR_DEN_NR_STRADA?: string;
  ADR_BLOC?: string;
  ADR_SCARA?: string;
  ADR_ETAJ?: string;
  ADR_APARTAMENT?: string;
  ADR_COD_POSTAL?: string;
  ADR_SECTOR?: string;
  ADR_COMPLETARE?: string;
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

function buildAddress(row: CSVRow): string {
  const parts: string[] = [];
  if (row.ADR_DEN_STRADA) {
    let street = row.ADR_DEN_STRADA;
    if (row.ADR_DEN_NR_STRADA) {
      street += ` nr. ${row.ADR_DEN_NR_STRADA}`;
    }
    if (row.ADR_BLOC) {
      street += `, bl. ${row.ADR_BLOC}`;
    }
    if (row.ADR_SCARA) {
      street += `, sc. ${row.ADR_SCARA}`;
    }
    if (row.ADR_ETAJ) {
      street += `, et. ${row.ADR_ETAJ}`;
    }
    if (row.ADR_APARTAMENT) {
      street += `, ap. ${row.ADR_APARTAMENT}`;
    }
    parts.push(street);
  }
  if (row.ADR_LOCALITATE) {
    parts.push(row.ADR_LOCALITATE);
  }
  if (row.ADR_JUDET) {
    parts.push(`jud. ${row.ADR_JUDET}`);
  }
  if (row.ADR_COD_POSTAL) {
    parts.push(`CP ${row.ADR_COD_POSTAL}`);
  }
  return parts.join(', ');
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    try {
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } catch {
      return null;
    }
  }
  return null;
}

function sanitizeValue(value: string): string {
  if (!value) return '';
  let sanitized = value.trim();
  sanitized = sanitized.replace(/[<>]/g, '');
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  return sanitized;
}

function writeProgress(importId: string, progress: {
  status: 'running' | 'completed' | 'error';
  totalRows: number;
  processedRows: number;
  inserted: number;
  updated: number;
  errors: number;
  percentage: number;
  currentBatch?: number;
  totalBatches?: number;
  error?: string;
  startTime: string;
  lastUpdate: string;
}) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const progressFile = path.join(tmpDir, `import-${importId}.json`);
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
}

async function importBatch(rows: CSVRow[], batchNum: number): Promise<{ inserted: number; updated: number; errors: number }> {
  if (!db) {
    throw new Error('Database connection not available');
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  const cifs = rows.map(row => normalizeCUI(row.CUI)).filter((cif): cif is string => cif !== null);
  if (cifs.length === 0) {
    return { inserted: 0, updated: 0, errors: rows.length };
  }

  const existing = await db
    .select({ cif: companies.cif })
    .from(companies)
    .where(inArray(companies.cif, cifs));

  const existingCifs = new Set(existing.map(c => c.cif));

  for (const row of rows) {
    try {
      const cui = normalizeCUI(row.CUI);
      if (!cui) {
        errors++;
        continue;
      }

      const companyData = {
        cif: cui,
        name: row.DENUMIRE.trim().substring(0, 500),
        registrationNumber: row.COD_INMATRICULARE || null,
        registrationDate: parseDate(row.DATA_INMATRICULARE || ''),
        legalForm: row.FORMA_JURIDICA || null,
        address: buildAddress(row) || null,
        city: row.ADR_LOCALITATE || null,
        county: row.ADR_JUDET || null,
        mainActivity: row.COD_CAEN ? `CAEN ${row.COD_CAEN}` : null,
        status: 'activ',
        slug: generateCompanySlug(row.DENUMIRE, cui),
        seoContent: generateSEOContent({
          name: row.DENUMIRE,
          cif: cui,
          city: row.ADR_LOCALITATE,
          county: row.ADR_JUDET,
          legalForm: row.FORMA_JURIDICA,
          mainActivity: row.COD_CAEN ? `CAEN ${row.COD_CAEN}` : null,
          registrationDate: parseDate(row.DATA_INMATRICULARE || ''),
          status: 'activ',
        }),
        lastUpdated: new Date(),
        updatedAt: new Date(),
      };

      if (existingCifs.has(cui)) {
        await db
          .update(companies)
          .set({ ...companyData, updatedAt: new Date() })
          .where(eq(companies.cif, cui));
        updated++;
      } else {
        const companyId = randomUUID();
        await db.insert(companies).values({
          id: companyId,
          ...companyData,
          createdAt: new Date(),
        });

        const hashVal = createHash('sha256').update(JSON.stringify(companyData)).digest('hex');
        await db.insert(sourceProvenance).values({
          id: randomUUID(),
          entityType: 'company',
          entityId: companyId,
          fieldName: 'all',
          sourceName: 'ONRC CSV Export',
          sourceUrl: 'https://www.onrc.ro',
          fetchedAt: new Date(),
          hashPayload: hashVal,
        });
        inserted++;
      }
    } catch (error) {
      console.error(`Error importing row: ${row.CUI}`, error);
      errors++;
    }
  }

  return { inserted, updated, errors };
}

async function processCSVStreaming(
  filePath: string,
  importId: string,
  startTime: string
): Promise<void> {
  const BATCH_SIZE = 100;
  let batch: CSVRow[] = [];
  let batchNum = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let totalRowsProcessed = 0;
  let totalRowsInFile = 0;
  let headers: string[] = [];

  console.log('📝 Folosind Windows-1250 (CP1250) pentru diacritice românești...');
  
  const fileStream = fs.createReadStream(filePath);
  const decodedStream = (iconv as any).decodeStream('win1250');
  fileStream.pipe(decodedStream);

  const rl = readline.createInterface({
    input: decodedStream,
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  let skippedLines = 0;
  const MAX_LINES = 5000000;
  let lastProgressLog = 0;

  const stats = fs.statSync(filePath);
  const estimatedBytesPerLine = 300;
  totalRowsInFile = Math.floor(stats.size / estimatedBytesPerLine);
  console.log(`📊 Dimensiune fișier: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📊 Rânduri estimate: ~${totalRowsInFile.toLocaleString()}\n`);

  writeProgress(importId, {
    status: 'running',
    totalRows: totalRowsInFile,
    processedRows: 0,
    inserted: 0,
    updated: 0,
    errors: 0,
    percentage: 0,
    currentBatch: 0,
    totalBatches: Math.ceil(totalRowsInFile / BATCH_SIZE),
    startTime,
    lastUpdate: new Date().toISOString(),
  });

  const processBatch = async () => {
    if (batch.length === 0) return;

    batchNum++;
    try {
      const result = await importBatch(batch, batchNum);
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalErrors += result.errors;
    } catch (batchError) {
      console.error(`❌ Eroare la batch ${batchNum}:`, batchError);
      totalErrors += batch.length;
    }

    totalRowsProcessed += batch.length;
    const percentage = totalRowsInFile > 0 
      ? Math.round((totalRowsProcessed / totalRowsInFile) * 100)
      : 0;

    if (lineNum > 1000 && totalRowsProcessed > 0) {
      const avgBytesPerRow = stats.size / lineNum;
      totalRowsInFile = Math.floor(stats.size / avgBytesPerRow);
    }

    writeProgress(importId, {
      status: 'running',
      totalRows: totalRowsInFile,
      processedRows: totalRowsProcessed,
      inserted: totalInserted,
      updated: totalUpdated,
      errors: totalErrors,
      percentage: Math.min(percentage, 99),
      currentBatch: batchNum,
      totalBatches: Math.ceil(totalRowsInFile / BATCH_SIZE),
      startTime,
      lastUpdate: new Date().toISOString(),
    });

    if (batchNum % 10 === 0) {
      console.log(`📈 Progress: ${percentage}% (${totalRowsProcessed.toLocaleString()}/${totalRowsInFile.toLocaleString()} rows) - Inserted: ${totalInserted.toLocaleString()}, Updated: ${totalUpdated.toLocaleString()}, Errors: ${totalErrors.toLocaleString()}`);
    }

    if (batchNum % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    batch = [];
  };

  for await (const line of rl) {
    lineNum++;

    if (lineNum > MAX_LINES) {
      console.warn(`⚠️  Limita de ${MAX_LINES} linii atinsă. Oprire import.`);
      break;
    }

    if (line.length > 10000) {
      skippedLines++;
      continue;
    }

    if (lineNum === 1) {
      headers = line.split('^').map(h => {
        let cleaned = h.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        return sanitizeValue(cleaned);
      });
      console.log(`✅ Header-uri validate: ${headers.length} coloane\n`);
      continue;
    }

    const values = line.split('^');
    if (values.length !== headers.length) {
      skippedLines++;
      continue;
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = sanitizeValue(values[index] || '');
    });

    if (!row.DENUMIRE || !row.CUI || row.CUI === '0') {
      skippedLines++;
      continue;
    }

    batch.push(row as CSVRow);

    if (batch.length >= BATCH_SIZE) {
      await processBatch();
    }

    if (lineNum - lastProgressLog >= 10000) {
      console.log(`📖 Procesate ${lineNum.toLocaleString()} linii... (batch-uri: ${batchNum})`);
      lastProgressLog = lineNum;
    }
  }

  if (batch.length > 0) {
    await processBatch();
  }

  totalRowsInFile = lineNum - 1;

  writeProgress(importId, {
    status: 'completed',
    totalRows: totalRowsInFile,
    processedRows: totalRowsProcessed,
    inserted: totalInserted,
    updated: totalUpdated,
    errors: totalErrors,
    percentage: 100,
    currentBatch: batchNum,
    totalBatches: batchNum,
    startTime,
    lastUpdate: new Date().toISOString(),
  });

  console.log('\n=== ✅ Import Complete ===');
  console.log(`✅ Total Inserted: ${totalInserted.toLocaleString()}`);
  console.log(`🔄 Total Updated: ${totalUpdated.toLocaleString()}`);
  console.log(`❌ Total Errors: ${totalErrors.toLocaleString()}`);
  console.log(`📊 Total Processed: ${(totalInserted + totalUpdated + totalErrors).toLocaleString()}`);
  console.log(`📈 Total Rows in File: ${totalRowsInFile.toLocaleString()}`);
  console.log(`⏭️  Skipped Lines: ${skippedLines.toLocaleString()}`);
  console.log(`\n🔒 Import securizat finalizat cu succes!`);
}

async function main() {
  if (!db) {
    throw new Error('Database connection not available');
  }

  const csvPath = process.argv[2];
  const importId = process.argv[3] || randomUUID();

  if (!csvPath) {
    console.error('❌ Eroare: Path către fișier CSV este obligatoriu');
    console.log('Usage: npx tsx src/scripts/import-full-auto.ts <path-to-csv> [import-id]');
    process.exit(1);
  }

  const startTime = new Date().toISOString();

  console.log('🔒 Verificări de securitate...');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Fișierul nu există: ${csvPath}`);
    process.exit(1);
  }

  if (!csvPath.toLowerCase().endsWith('.csv')) {
    console.error('❌ Doar fișiere .csv sunt permise');
    process.exit(1);
  }

  console.log('✅ Fișier validat\n');
  
  console.log(`📂 Starting FULL CSV import from: ${csvPath}`);
  console.log(`🆔 Import ID: ${importId}`);
  console.log('⏳ This will process ALL rows in the file...\n');

  try {
    await processCSVStreaming(csvPath, importId, startTime);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Import failed:', error);
    
    writeProgress(importId, {
      status: 'error',
      totalRows: 0,
      processedRows: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      percentage: 0,
      error: errorMessage,
      startTime,
      lastUpdate: new Date().toISOString(),
    });
    
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

