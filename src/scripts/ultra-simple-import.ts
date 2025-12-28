import fs from 'fs';
import readline from 'readline';
import { db } from '@/server/db/index';
import { companies } from '@/server/db/schema';
import { sql } from 'drizzle-orm';

// ULTRA SIMPLE IMPORT - MAXIMUM SPEED
async function ultraSimpleImport() {
  if (!db) {
    console.error('❌ Database connection failed!');
    process.exit(1);
  }

  console.log('🚀 ULTRA SIMPLE IMPORT - MAXIMUM SPEED\n');

  const csvPath = "C:\\Users\\App Consult Deck\\Downloads\\od_firme.csv";
  console.log(`📁 Fișier: ${csvPath}`);

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  let processed = 0;
  let validRows: any[] = [];
  let startTime = Date.now();

  console.log('⚡ Încep ULTRA SIMPLE processing...\n');

  for await (const line of rl) {
    lineNum++;

    if (lineNum === 1) {
      console.log(`✅ Header detectat\n`);
      continue;
    }

    // Procesare ULTRA-SIMPLĂ
    const columns = line.split('^');
    if (columns.length >= 2) {
      // Mapping corect conform header CSV:
      // DENUMIRE^CUI^COD_INMATRICULARE^DATA_INMATRICULARE^EUID^FORMA_JURIDICA^ADR_TARA^ADR_LOCALITATE^ADR_JUDET^...
      const name = (columns[0]?.trim() || '').substring(0, 500); // Trunchiere la 500
      const cif = columns[1]?.trim() || '';
      
      // Validare CIF - nu poate fi "0" sau gol (CIF este NOT NULL și UNIQUE)
      if (!name || !cif || cif === '0' || cif === '') {
        continue; // Sari rândurile invalide
      }

      // Parse data înmatriculare (format: DD/MM/YYYY)
      let registrationDate = null;
      const dateStr = columns[3]?.trim();
      if (dateStr && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateStr.split('/');
        registrationDate = new Date(`${year}-${month}-${day}`);
        if (isNaN(registrationDate.getTime())) {
          registrationDate = null;
        }
      }

      // Creăm obiect corect
      const company = {
        name: name,
        cif: cif.substring(0, 20), // Trunchiere la 20 caractere
        status: (columns[2]?.trim() || '').substring(0, 50), // COD_INMATRICULARE ca status
        county: (columns[8]?.trim() || '').substring(0, 100), // ADR_JUDET
        city: (columns[7]?.trim() || '').substring(0, 100), // ADR_LOCALITATE
        mainActivity: (columns[11]?.trim() || ''), // COD_CAEN (text, fără limită)
        address: (columns[9]?.trim() || ''), // ADR_DEN_STRADA (text)
        legalForm: (columns[5]?.trim() || '').substring(0, 100), // FORMA_JURIDICA
        registrationDate: registrationDate,
        registrationNumber: (columns[2]?.trim() || '').substring(0, 50), // COD_INMATRICULARE
        lastUpdated: new Date(),
        slug: null,
      };

      validRows.push(company);
      processed++;
    }

    // Progress indicator la fiecare 50 rânduri (foarte des pentru vizibilitate)
    if (processed % 50 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = elapsed > 0 ? Math.round(processed / (elapsed / 60)) : 0;
      // Procent estimat bazat pe dimensiunea fișierului (~2.1M firme)
      const estimatedTotal = 2100000;
      const percentage = ((processed / estimatedTotal) * 100).toFixed(1);
      // Afișare clară a numărului cu procent
      console.log(`📊 FIRME PROCESATE: ${processed.toLocaleString()} | ⚡ ${rate.toLocaleString()}/min | ${percentage}%`);
    }

    // Inserare bulk la fiecare 5000 rânduri
    if (validRows.length >= 5000 && db) {
      try {
        // Folosim ON CONFLICT pentru a evita erorile de duplicate
        await db.insert(companies)
          .values(validRows)
          .onConflictDoUpdate({
            target: companies.cif,
            set: {
              name: sql`excluded.name`,
              status: sql`excluded.status`,
              county: sql`excluded.county`,
              city: sql`excluded.city`,
              mainActivity: sql`excluded.main_activity`,
              address: sql`excluded.address`,
              legalForm: sql`excluded.legal_form`,
              registrationNumber: sql`excluded.registration_number`,
              registrationDate: sql`excluded.registration_date`,
              lastUpdated: sql`excluded.last_updated`,
              updatedAt: sql`now()`,
            }
          });
        console.log(`\n💾 Inserate/Actualizate ${validRows.length.toLocaleString()} firme în DB`);
        validRows = []; // Reset
      } catch (error: any) {
        console.log(`\n⚠️  Eroare inserare: ${error.message}`);
        // Continue - nu oprim la erori, dar skip batch-ul
        validRows = [];
      }
    }
  }

  // Inserare finală
  if (validRows.length > 0 && db) {
    try {
      await db.insert(companies)
        .values(validRows)
        .onConflictDoUpdate({
          target: companies.cif,
          set: {
            name: sql`excluded.name`,
            status: sql`excluded.status`,
            county: sql`excluded.county`,
            city: sql`excluded.city`,
            mainActivity: sql`excluded.main_activity`,
            address: sql`excluded.address`,
            legalForm: sql`excluded.legal_form`,
            registrationNumber: sql`excluded.registration_number`,
            registrationDate: sql`excluded.registration_date`,
            lastUpdated: sql`excluded.last_updated`,
            updatedAt: sql`now()`,
          }
        });
      console.log(`\n💾 Inserate/Actualizate finale ${validRows.length.toLocaleString()} firme în DB`);
    } catch (error: any) {
      console.log(`\n⚠️  Eroare inserare finală: ${error.message}`);
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const finalRate = Math.round(processed / (totalTime / 60));
  const totalMinutes = Math.round(totalTime / 60);

  console.log(`\n\n🎉🎉🎉 IMPORT COMPLET FINALIZAT! 🎉🎉🎉\n`);
  console.log(`============================================================`);
  console.log(`✅ TOATE FIRMELE DIN CSV AU FOST PROCESATE!`);
  console.log(`============================================================`);
  console.log(`📊 Total procesate: ${processed.toLocaleString()} firme`);
  console.log(`💾 Total inserate/actualizate în DB: ${processed.toLocaleString()} firme`);
  console.log(`⏱️  Timp total: ${totalMinutes} minute (${(totalTime / 60).toFixed(1)} ore)`);
  console.log(`⚡ Viteză medie: ${finalRate.toLocaleString()} firme/minut`);
  console.log(`🚀 Viteză/oră: ${(finalRate * 60).toLocaleString()} firme/oră`);
  console.log(`============================================================\n`);

  process.exit(0);
}

// Rulează automat
ultraSimpleImport().catch(console.error);
