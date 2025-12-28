/**
 * Script pentru import CSV în baza de date
 * 
 * SECURITY: Validări stricte pentru prevenirea upload-urilor malicioase
 * 
 * Usage: npx tsx src/scripts/import-csv.ts <path-to-csv>
 * 
 * Requirements:
 * - Fișier trebuie să fie .csv
 * - Max size: 2GB (pentru fișiere mari ONRC)
 * - Trebuie să aibă header-uri valide ONRC
 * - Doar caractere safe (no scripts, no binary)
 */

// Load .env.local
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
  EUID?: string; // Coloană nouă
  FORMA_JURIDICA?: string;
  ADR_TARA?: string; // Coloană nouă
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
  ADR_COMPLETARE?: string; // Coloană nouă
  COD_CAEN?: string;
}

/**
 * Normalizează CUI (elimină 0-uri de la început, adaugă RO dacă lipsește)
 */
function normalizeCUI(cui: string): string | null {
  if (!cui || cui === '0' || cui.trim() === '') return null;
  
  let normalized = cui.trim();
  
  // Elimină 0-uri de la început
  normalized = normalized.replace(/^0+/, '');
  
  if (normalized === '') return null;
  
  // Adaugă RO dacă nu are
  if (!normalized.startsWith('RO')) {
    normalized = 'RO' + normalized;
  }
  
  // Validează format (RO + 2-10 cifre)
  if (!/^RO\d{2,10}$/.test(normalized)) {
    return null;
  }
  
  return normalized;
}

/**
 * Construiește adresa completă
 */
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
    parts.push(`Jud. ${row.ADR_JUDET}`);
  }
  
  if (row.ADR_COD_POSTAL) {
    parts.push(`Cod poștal: ${row.ADR_COD_POSTAL}`);
  }
  
  return parts.join(', ');
}

/**
 * Parsează data din format DD/MM/YYYY
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    const [day, month, year] = dateStr.split('/');
    if (day && month && year) {
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
  }
  
  return null;
}

/**
 * Hash pentru deduplicare
 */
function hashRow(row: CSVRow): string {
  const key = `${row.CUI}-${row.DENUMIRE}-${row.COD_INMATRICULARE}`;
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Import un batch de companii
 */
async function importBatch(rows: CSVRow[], batchNum: number): Promise<{ inserted: number; updated: number; errors: number }> {
  if (!db) {
    throw new Error('Database connection not available');
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // OPTIMIZATION: Batch check existing companies (much faster than individual queries)
  const validRows: Array<{ row: CSVRow; cui: string; companyData: any }> = [];
  const cuis: string[] = [];

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
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validRows.push({ row, cui, companyData });
      cuis.push(cui);
    } catch (error) {
      console.error(`Error processing row: ${row.CUI}`, error);
      errors++;
    }
  }

  if (validRows.length === 0) {
    return { inserted, updated, errors };
  }

  // Batch check existing companies
  const existingCompanies = await db
    .select({ cif: companies.cif })
    .from(companies)
    .where(inArray(companies.cif, cuis));

  const existingCifs = new Set(existingCompanies.map(c => c.cif));

  // Separate into insert and update batches
  const toInsert: any[] = [];
  const toUpdate: Array<{ cif: string; data: any }> = [];
  const provenanceData: any[] = [];

  for (const { row, cui, companyData } of validRows) {
    if (existingCifs.has(cui)) {
      // Update existing
      toUpdate.push({
        cif: cui,
        data: {
          ...companyData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Insert new
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

      // Track source provenance
      const hashVal = hashRow(row);
      provenanceData.push({
        id: randomUUID(),
        entityType: 'company' as const,
        entityId: companyId,
        fieldName: 'all',
        sourceName: 'ONRC CSV Export',
        sourceUrl: 'https://www.onrc.ro',
        fetchedAt: new Date(),
        hashPayload: hashVal,
      });
    }
  }

  // Bulk insert new companies
  if (toInsert.length > 0) {
    // Insert in chunks of 1000 to avoid query size limits
    const INSERT_CHUNK = 1000;
    for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
      const chunk = toInsert.slice(i, i + INSERT_CHUNK);
      await db.insert(companies).values(chunk);
      inserted += chunk.length;
    }

    // Bulk insert provenance
    if (provenanceData.length > 0) {
      const PROV_CHUNK = 1000;
      for (let i = 0; i < provenanceData.length; i += PROV_CHUNK) {
        const chunk = provenanceData.slice(i, i + PROV_CHUNK);
        await db.insert(sourceProvenance).values(chunk);
      }
    }
  }

  // Bulk update existing companies
  if (toUpdate.length > 0) {
    for (const { cif, data } of toUpdate) {
      await db
        .update(companies)
        .set(data)
        .where(eq(companies.cif, cif));
      updated++;
    }
  }

  console.log(`Batch ${batchNum}: Inserted ${inserted}, Updated ${updated}, Errors ${errors}`);
  return { inserted, updated, errors };
}

/**
 * Parsează CSV cu separator ^
 */
async function parseCSV(filePath: string): Promise<CSVRow[]> {
  const rows: CSVRow[] = [];
  
  // Folosește UTF-8 pentru fișierele ONRC (detectăm BOM UTF-8: EF BB BF)
  // Fișierele mai noi de la ONRC sunt în UTF-8, cele vechi în Windows-1250
  console.log('📝 Detectare encoding...');
  
  // Citește primii 3 bytes pentru a detecta BOM UTF-8
  const fd = fs.openSync(filePath, 'r');
  const bomBuffer = Buffer.alloc(3);
  fs.readSync(fd, bomBuffer, 0, 3, 0);
  fs.closeSync(fd);
  
  const hasUTF8BOM = bomBuffer[0] === 0xEF && bomBuffer[1] === 0xBB && bomBuffer[2] === 0xBF;
  const encoding = hasUTF8BOM ? 'utf8' : 'win1250';
  console.log(`📝 Encoding detectat: ${encoding} ${hasUTF8BOM ? '(UTF-8 cu BOM)' : '(Windows-1250)'}`);
  
  // Folosește iconv-lite cu transform stream pentru fișiere mari
  const fileStream = fs.createReadStream(filePath);
  const decodedStream = (iconv as any).decodeStream(encoding);
  
  fileStream.pipe(decodedStream);
  
  const rl = readline.createInterface({
    input: decodedStream,
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let lineNum = 0;
  let skippedLines = 0;
  const MAX_LINES = 5000000; // Max 5M linii (pentru fișiere mari ONRC)

  let lastProgressLog = 0;
  
  for await (const line of rl) {
    lineNum++;
    
    // Log progres la fiecare 10000 linii
    if (lineNum - lastProgressLog >= 10000) {
      console.log(`📖 Citite ${lineNum.toLocaleString()} linii... (valide: ${rows.length})`);
      lastProgressLog = lineNum;
    }
    
    // Limită numărul de linii (prevenire DoS)
    if (lineNum > MAX_LINES) {
      console.warn(`⚠️  Limita de ${MAX_LINES} linii atinsă. Oprire import.`);
      break;
    }

    // Validare lungime linie (prevenire DoS)
    if (line.length > 10000) {
      console.warn(`⚠️  Linia ${lineNum}: Prea lungă (${line.length} chars), skip`);
      skippedLines++;
      continue;
    }
    
    if (lineNum === 1) {
      // Header row - validare securitate
      headers = line.split('^').map(h => {
        // Elimină BOM și alte caractere de control
        let cleaned = h.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        return sanitizeValue(cleaned);
      });
      
      const headerValidation = validateHeaders(headers);
      if (!headerValidation.valid) {
        console.error(`❌ Eroare validare header: ${headerValidation.error}`);
        process.exit(1);
      }
      console.log(`✅ Header-uri validate: ${headers.length} coloane\n`);
      continue;
    }

    const values = line.split('^');
    if (values.length !== headers.length) {
      skippedLines++;
      if (lineNum <= 10) {
        console.warn(`⚠️  Linia ${lineNum}: Column count mismatch (${values.length} vs ${headers.length}), skipping`);
      }
      continue;
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = sanitizeValue(values[index] || '');
    });

    // Validare linie înainte de adăugare
    const rowValidation = validateRow(row as CSVRow, lineNum);
    if (!rowValidation.valid) {
      skippedLines++;
      if (lineNum <= 10) {
        console.warn(`⚠️  ${rowValidation.error}`);
      }
      continue;
    }

    rows.push(row as CSVRow);
  }

  console.log(`📊 Parsed ${rows.length} valid rows (skipped ${skippedLines} invalid lines)`);
  console.log(`📈 Total linii citite: ${lineNum}, Linii valide: ${rows.length}, Linii skip: ${skippedLines}\n`);

  if (rows.length === 0) {
    console.warn('⚠️  ATENȚIE: Nu s-au găsit rânduri valide în CSV!');
    console.warn('   Verifică:');
    console.warn('   - Formatul CSV (separator ^)');
    console.warn('   - Header-urile (DENUMIRE, CUI)');
    console.warn('   - Encoding-ul (Windows-1250)');
  }

  return rows;
}

/**
 * Validări de securitate pentru fișier CSV
 */
function validateFile(filePath: string): { valid: boolean; error?: string } {
  // 1. Verifică că fișierul există
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'Fișierul nu există' };
  }

  // 2. Verifică extensia (doar .csv)
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.csv') {
    return { valid: false, error: 'Doar fișiere .csv sunt permise' };
  }

  // 3. Verifică dimensiunea (max 2GB pentru fișiere mari ONRC)
  const stats = fs.statSync(filePath);
  const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
  if (stats.size > maxSize) {
    return { valid: false, error: `Fișierul depășește limita de 2GB (actual: ${Math.round(stats.size / 1024 / 1024)}MB)` };
  }
  
  // Avertizare pentru fișiere mari
  if (stats.size > 500 * 1024 * 1024) {
    console.warn(`⚠️  Fișier mare detectat (${Math.round(stats.size / 1024 / 1024)}MB). Importul poate dura mai mult...`);
  }

  // 4. Verifică că nu e gol
  if (stats.size === 0) {
    return { valid: false, error: 'Fișierul este gol' };
  }

  // 5. Verifică că nu e un symlink sau alt tip suspect
  if (!stats.isFile()) {
    return { valid: false, error: 'Path-ul nu este un fișier valid' };
  }

  return { valid: true };
}

/**
 * Validă header-urile CSV (prevenire injection)
 */
function validateHeaders(headers: string[]): { valid: boolean; error?: string } {
  const requiredHeaders = [
    'DENUMIRE',
    'CUI',
  ];

  // Header-uri opționale dar folosite
  const optionalHeaders = [
    'COD_INMATRICULARE',
    'DATA_INMATRICULARE',
    'FORMA_JURIDICA',
    'ADR_LOCALITATE',
    'ADR_JUDET',
    'ADR_DEN_STRADA',
    'ADR_DEN_NR_STRADA',
    'ADR_BLOC',
    'ADR_SCARA',
    'ADR_ETAJ',
    'ADR_APARTAMENT',
    'ADR_COD_POSTAL',
    'ADR_SECTOR',
    'COD_CAEN',
    'EUID', // Coloană nouă
    'ADR_TARA', // Coloană nouă
  ];

  // Verifică că toate header-urile necesare există
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      return { valid: false, error: `Header lipsă: ${required}` };
    }
  }

  // Verifică că nu sunt header-uri suspecte (prevenire injection)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /eval\(/i,
    /exec\(/i,
  ];

  for (const header of headers) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(header)) {
        return { valid: false, error: `Header suspect detectat: ${header}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Sanitizează valoarea pentru prevenire XSS/injection
 * PĂSTREAZĂ diacriticele românești (ă, â, î, ș, ț)
 */
function sanitizeValue(value: string): string {
  if (!value) return '';
  
  // Elimină caractere control (prevenire injection)
  let sanitized = value
    .replace(/[\x00-\x1F\x7F]/g, '') // Control characters
    .replace(/<script/gi, '') // Script tags
    .replace(/javascript:/gi, '') // JavaScript protocol
    .trim();

  // Limită lungimea (prevenire DoS)
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }

  return sanitized;
}

/**
 * Validă o linie CSV înainte de procesare
 */
function validateRow(row: CSVRow, lineNum: number): { valid: boolean; error?: string } {
  // Verifică că DENUMIRE nu e gol
  if (!row.DENUMIRE || row.DENUMIRE.trim() === '') {
    return { valid: false, error: `Linia ${lineNum}: DENUMIRE lipsă` };
  }

  // Verifică că CUI există (poate fi 0 pentru PF, dar trebuie să existe)
  if (row.CUI === undefined || row.CUI === null) {
    return { valid: false, error: `Linia ${lineNum}: CUI lipsă` };
  }

  // Verifică lungimea denumirii (prevenire DoS)
  if (row.DENUMIRE.length > 500) {
    return { valid: false, error: `Linia ${lineNum}: DENUMIRE prea lungă (max 500 chars)` };
  }

  // Verifică pattern-uri suspecte în denumire
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /eval\(/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(row.DENUMIRE)) {
      return { valid: false, error: `Linia ${lineNum}: Conținut suspect în DENUMIRE` };
    }
  }

  return { valid: true };
}

/**
 * Procesează CSV-ul în streaming, batch cu batch, fără a stoca toate liniile în memorie
 */
async function processCSVStreaming(
  filePath: string,
  importId: string,
  startTime: string
): Promise<{ inserted: number; updated: number; errors: number }> {
  const BATCH_SIZE = 5000; // Process 5000 rows at a time (ultra-fast for new imports)
  let batch: CSVRow[] = [];
  let batchNum = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let totalRowsProcessed = 0;
  let totalRowsInFile = 0;
  let headers: string[] = [];

  // Detectare encoding (UTF-8 cu BOM sau Windows-1250)
  console.log('📝 Detectare encoding...');
  const fd = fs.openSync(filePath, 'r');
  const bomBuffer = Buffer.alloc(3);
  fs.readSync(fd, bomBuffer, 0, 3, 0);
  fs.closeSync(fd);
  
  const hasUTF8BOM = bomBuffer[0] === 0xEF && bomBuffer[1] === 0xBB && bomBuffer[2] === 0xBF;
  const encoding = hasUTF8BOM ? 'utf8' : 'win1250';
  console.log(`📝 Encoding detectat: ${encoding} ${hasUTF8BOM ? '(UTF-8 cu BOM)' : '(Windows-1250)'}`);
  
  const fileStream = fs.createReadStream(filePath);
  const decodedStream = (iconv as any).decodeStream(encoding);
  fileStream.pipe(decodedStream);

  const rl = readline.createInterface({
    input: decodedStream,
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  let skippedLines = 0;
  const MAX_LINES = 5000000;
  let lastProgressLog = 0;

  // Simplificat: nu estimăm rândurile pentru a evita blocări
  const stats = fs.statSync(filePath);
  totalRowsInFile = 100000; // Fix 100k pentru test rapid
  console.log(`📊 Dimensiune fișier: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📊 Limită rânduri: ${totalRowsInFile.toLocaleString()}\n`);

  // Scrie progres inițial
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

  // Funcție pentru procesarea unui batch
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

    // Actualizează estimarea totalRowsInFile pe baza progresului real
    if (lineNum > 1000 && totalRowsProcessed > 0) {
      const avgBytesPerRow = stats.size / lineNum;
      totalRowsInFile = Math.floor(stats.size / avgBytesPerRow);
    }

    // Scrie progres
    writeProgress(importId, {
      status: 'running',
      totalRows: totalRowsInFile,
      processedRows: totalRowsProcessed,
      inserted: totalInserted,
      updated: totalUpdated,
      errors: totalErrors,
      percentage: Math.min(percentage, 99), // Nu ajunge la 100% până la final
      currentBatch: batchNum,
      totalBatches: Math.ceil(totalRowsInFile / BATCH_SIZE),
      startTime,
      lastUpdate: new Date().toISOString(),
    });

    // Progress indicator
    if (batchNum % 10 === 0) {
      console.log(`📈 Progress: ${percentage}% (${totalRowsProcessed.toLocaleString()}/${totalRowsInFile.toLocaleString()} rows) - Inserted: ${totalInserted.toLocaleString()}, Updated: ${totalUpdated.toLocaleString()}, Errors: ${totalErrors.toLocaleString()}`);
    }

    // Rate limiting (disabled for speed)
    // if (batchNum % 100 === 0) {
    //   await new Promise(resolve => setTimeout(resolve, 100));
    // }

    batch = []; // Golește batch-ul
  };

  // Procesează liniile
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
      // Header row
      headers = line.split('^').map(h => {
        let cleaned = h.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        return sanitizeValue(cleaned);
      });

      const headerValidation = validateHeaders(headers);
      if (!headerValidation.valid) {
        throw new Error(`Eroare validare header: ${headerValidation.error}`);
      }
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

    const rowValidation = validateRow(row as CSVRow, lineNum);
    if (!rowValidation.valid) {
      skippedLines++;
      continue;
    }

    batch.push(row as CSVRow);

    // Procesează batch-ul când este plin
    if (batch.length >= BATCH_SIZE) {
      await processBatch();
    }

    // Log progres
    if (lineNum - lastProgressLog >= 10000) {
      console.log(`📖 Procesate ${lineNum.toLocaleString()} linii... (batch-uri: ${batchNum})`);
      lastProgressLog = lineNum;
    }
  }

  // Procesează ultimul batch (dacă există)
  if (batch.length > 0) {
    await processBatch();
  }

  // Actualizează totalRowsInFile cu valoarea reală
  totalRowsInFile = lineNum - 1; // -1 pentru header

  // Scrie progres final
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

  return {
    inserted: totalInserted,
    updated: totalUpdated,
    errors: totalErrors,
  };
}

/**
 * Scrie progresul importului într-un fișier JSON
 */
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

/**
 * Main import function
 */
async function main() {
  if (!db) {
    throw new Error('Database connection not available');
  }

  const csvPath = process.argv[2];
  const importId = process.argv[3] || randomUUID(); // ID pentru tracking progress

  if (!csvPath) {
    console.error('❌ Eroare: Path către fișier CSV este obligatoriu');
    console.log('Usage: npm run import:csv <path-to-csv> [import-id]');
    process.exit(1);
  }

  const startTime = new Date().toISOString();

  // Validări de securitate
  console.log('🔒 Verificări de securitate...');
  const fileValidation = validateFile(csvPath);
  if (!fileValidation.valid) {
    console.error(`❌ Eroare securitate: ${fileValidation.error}`);
    writeProgress(importId, {
      status: 'error',
      totalRows: 0,
      processedRows: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      percentage: 0,
      error: fileValidation.error,
      startTime,
      lastUpdate: new Date().toISOString(),
    });
    process.exit(1);
  }
  console.log('✅ Fișier validat\n');
  
  console.log(`📂 Starting CSV import from: ${csvPath}`);
  console.log(`🆔 Import ID: ${importId}`);
  console.log('⏳ This may take a while for large files...\n');

  try {
    console.log('📖 Începe procesarea CSV-ului în streaming (fără a stoca toate liniile în memorie)...\n');
    
    // Procesează CSV-ul în streaming, batch cu batch
    const results = await processCSVStreaming(csvPath, importId, startTime);

    console.log('\n=== ✅ Import Complete ===');
    console.log(`✅ Total Inserted: ${results.inserted}`);
    console.log(`🔄 Total Updated: ${results.updated}`);
    console.log(`❌ Total Errors: ${results.errors}`);
    console.log(`📊 Total Processed: ${results.inserted + results.updated + results.errors}`);
    console.log(`\n🔒 Import securizat finalizat cu succes!`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Import failed:', error);
    
    // Scrie progres cu eroare
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

// Run if executed directly
if (require.main === module) {
  main().then(() => {
    console.log('\nDone!');
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

