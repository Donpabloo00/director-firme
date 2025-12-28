/**
 * Script pentru generarea slug-urilor SEO și conținutului programatic
 * Rulează după import CSV pentru a genera slug-uri și conținut SEO pentru toate firmele
 */

import 'dotenv/config';
import { db } from '../server/db';
import { companies } from '../server/db/schema';
import { generateCompanySlug, generateSEOContent } from '../lib/seo-utils';
import { eq } from 'drizzle-orm';

async function generateSEOForAllCompanies() {
  if (!db) {
    throw new Error('Database connection not available');
  }
  console.log('🚀 Generare slug-uri SEO și conținut programatic...\n');

  // Procesează în batch-uri de 1000
  const BATCH_SIZE = 1000;
  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let errors = 0;

  while (true) {
    try {
      const batch = await db
        .select()
        .from(companies)
        .limit(BATCH_SIZE)
        .offset(offset);

      if (batch.length === 0) break;

      console.log(`📦 Procesare batch: ${offset + 1} - ${offset + batch.length}...`);

      for (const company of batch) {
        try {
          // Generează slug dacă nu există
          let slug = company.slug;
          if (!slug) {
            slug = generateCompanySlug(company.name, company.cif);
          }

          // Generează conținut SEO dacă nu există
          let seoContent = company.seoContent;
          if (!seoContent) {
            seoContent = generateSEOContent({
              name: company.name,
              cif: company.cif,
              city: company.city,
              county: company.county,
              legalForm: company.legalForm,
              mainActivity: company.mainActivity,
              registrationDate: company.registrationDate,
              status: company.status,
            });
          }

          // Actualizează doar dacă s-a schimbat ceva
          if (slug !== company.slug || seoContent !== company.seoContent) {
            await db
              .update(companies)
              .set({
                slug,
                seoContent,
                updatedAt: new Date(),
              })
              .where(eq(companies.id, company.id));
            
            totalUpdated++;
          }

          totalProcessed++;
        } catch (error) {
          errors++;
          if (errors <= 10) {
            console.error(`❌ Eroare la compania ${company.cif}:`, error);
          }
        }
      }

      offset += BATCH_SIZE;

      // Progress indicator
      if (totalProcessed % 10000 === 0) {
        console.log(`📈 Progress: ${totalProcessed} procesate, ${totalUpdated} actualizate`);
      }
    } catch (error) {
      console.error(`❌ Eroare la batch ${offset}:`, error);
      break;
    }
  }

  console.log(`\n✅ Finalizat!`);
  console.log(`   Total procesate: ${totalProcessed}`);
  console.log(`   Total actualizate: ${totalUpdated}`);
  console.log(`   Erori: ${errors}`);
}

generateSEOForAllCompanies().catch(console.error);

