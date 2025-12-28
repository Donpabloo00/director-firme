/**
 * Script pentru a număra liniile dintr-un fișier CSV
 * Usage: npx tsx src/scripts/count-csv-lines.ts <path-to-csv>
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import * as fs from 'fs';
import * as readline from 'readline';
import * as iconv from 'iconv-lite';

async function countLines(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fișierul nu există: ${filePath}`);
    process.exit(1);
  }

  const stats = fs.statSync(filePath);
  console.log(`📁 Fișier: ${filePath}`);
  console.log(`📊 Dimensiune: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

  const fileStream = fs.createReadStream(filePath);
  const decodedStream = (iconv as any).decodeStream('win1250');
  fileStream.pipe(decodedStream);

  const rl = readline.createInterface({
    input: decodedStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let headerLine = '';
  let sampleLines: string[] = [];

  console.log('📖 Numărătoare linii...\n');

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount === 1) {
      headerLine = line;
      console.log(`📋 Header (linia 1): ${headerLine.substring(0, 100)}...`);
      console.log(`   Coloane: ${line.split('^').length}\n`);
    }
    
    if (lineCount <= 5 && lineCount > 1) {
      sampleLines.push(line);
    }
    
    if (lineCount % 10000 === 0) {
      process.stdout.write(`\r📊 Linii citite: ${lineCount.toLocaleString()}...`);
    }
  }

  console.log(`\n\n✅ Total linii în CSV: ${lineCount.toLocaleString()}`);
  console.log(`   - Header: 1 linie`);
  console.log(`   - Date: ${(lineCount - 1).toLocaleString()} linii\n`);

  if (sampleLines.length > 0) {
    console.log('📝 Primele linii de date:');
    sampleLines.forEach((line, idx) => {
      const values = line.split('^');
      console.log(`   Linia ${idx + 2}: ${values[0]?.substring(0, 50)}... | ${values.length} coloane`);
    });
  }

  console.log('\n✅ Analiză completă!');
}

const csvPath = process.argv[2];

if (!csvPath) {
  console.error('❌ Eroare: Path către fișier CSV este obligatoriu');
  console.log('Usage: npx tsx src/scripts/count-csv-lines.ts <path-to-csv>');
  process.exit(1);
}

countLines(csvPath).catch((error) => {
  console.error('❌ Eroare:', error);
  process.exit(1);
});

