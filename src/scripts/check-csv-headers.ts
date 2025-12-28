import 'dotenv/config';
import * as fs from 'fs';
import * as readline from 'readline';

async function checkCSVHeaders(filePath: string) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) {
      const headers = line.split('^');
      console.log(`\n📋 Total coloane: ${headers.length}\n`);
      console.log('📝 Header-uri CSV:');
      headers.forEach((h, i) => {
        console.log(`  ${i + 1}. ${h.trim()}`);
      });
      
      // Verifică dacă există coloane pentru acționari
      const actionariHeaders = headers.filter(h => 
        h.toLowerCase().includes('actionar') || 
        h.toLowerCase().includes('asociat') ||
        h.toLowerCase().includes('shareholder')
      );
      
      if (actionariHeaders.length > 0) {
        console.log(`\n✅ Coloane acționari găsite: ${actionariHeaders.join(', ')}`);
      } else {
        console.log(`\n⚠️  Nu s-au găsit coloane specifice pentru acționari`);
      }
      
      // Verifică date de contact
      const contactHeaders = headers.filter(h => {
        const lower = h.toLowerCase();
        return lower.includes('telefon') || 
               lower.includes('phone') || 
               lower.includes('email') || 
               lower.includes('website') ||
               lower.includes('fax');
      });
      
      if (contactHeaders.length > 0) {
        console.log(`\n✅ Coloane contact găsite: ${contactHeaders.join(', ')}`);
      } else {
        console.log(`\n⚠️  Nu s-au găsit coloane specifice pentru contact`);
      }
      
      // Arată primele 3 linii de date pentru referință
      console.log(`\n📄 Primele 3 linii de date (prima 200 caractere):`);
      break;
    }
  }
  
  // Citește primele 3 linii de date
  let dataLineNum = 0;
  const fileStream2 = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl2 = readline.createInterface({
    input: fileStream2,
    crlfDelay: Infinity,
  });
  
  for await (const line of rl2) {
    dataLineNum++;
    if (dataLineNum > 1 && dataLineNum <= 4) {
      const preview = line.substring(0, 200);
      console.log(`\nLinia ${dataLineNum}: ${preview}...`);
    }
    if (dataLineNum >= 4) break;
  }
}

const csvPath = process.argv[2] || 'C:\\Users\\App Consult Deck\\Downloads\\od_firme.csv';
checkCSVHeaders(csvPath).catch(console.error);

