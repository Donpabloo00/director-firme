/**
 * Script pentru verificare status baza de date
 * Usage: npm run db:check
 */

import 'dotenv/config';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../server/db/index';
import { companies } from '../server/db/schema';
import { sql, count, desc } from 'drizzle-orm';

async function checkDatabase() {
  if (!db) {
    throw new Error('Database connection not available');
  }
  console.log('🔍 Verificare status baza de date...\n');

  try {
    // Total firme
    const totalResult = await db
      .select({ count: count() })
      .from(companies);
    const total = totalResult[0]?.count || 0;

    console.log(`📊 TOTAL FIRME: ${total.toLocaleString()}\n`);

    if (total === 0) {
      console.log('⚠️  Baza de date este goală. Rulează import-ul!');
      return;
    }

    // Firme pe status
    const statusResult = await db
      .select({
        status: companies.status,
        count: count(),
      })
      .from(companies)
      .groupBy(companies.status);
    
    console.log('📈 FIRME PE STATUS:');
    statusResult.forEach((row) => {
      console.log(`   ${row.status || 'N/A'}: ${row.count.toLocaleString()}`);
    });
    console.log('');

    // Top 10 județe
    const countiesResult = await db
      .select({
        county: companies.county,
        count: count(),
      })
      .from(companies)
      .where(sql`${companies.county} IS NOT NULL`)
      .groupBy(companies.county)
      .orderBy(desc(count()))
      .limit(10);

    console.log('🏙️  TOP 10 JUDEȚE:');
    countiesResult.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.county || 'N/A'}: ${row.count.toLocaleString()} firme`);
    });
    console.log('');

    // Top 10 forme juridice
    const legalFormsResult = await db
      .select({
        legalForm: companies.legalForm,
        count: count(),
      })
      .from(companies)
      .where(sql`${companies.legalForm} IS NOT NULL`)
      .groupBy(companies.legalForm)
      .orderBy(desc(count()))
      .limit(10);

    console.log('⚖️  TOP 10 FORME JURIDICE:');
    legalFormsResult.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.legalForm || 'N/A'}: ${row.count.toLocaleString()} firme`);
    });
    console.log('');

    // Firme cu slug
    const withSlugResult = await db
      .select({ count: count() })
      .from(companies)
      .where(sql`${companies.slug} IS NOT NULL`);
    const withSlug = withSlugResult[0]?.count || 0;

    // Firme cu seo_content
    const withSeoResult = await db
      .select({ count: count() })
      .from(companies)
      .where(sql`${companies.seoContent} IS NOT NULL`);
    const withSeo = withSeoResult[0]?.count || 0;

    console.log('🔧 OPTIMIZĂRI SEO:');
    console.log(`   Firme cu slug: ${withSlug.toLocaleString()} (${((withSlug / total) * 100).toFixed(1)}%)`);
    console.log(`   Firme cu SEO content: ${withSeo.toLocaleString()} (${((withSeo / total) * 100).toFixed(1)}%)`);
    console.log('');

    // Ultimele 5 firme adăugate
    const recentResult = await db
      .select({
        name: companies.name,
        cif: companies.cif,
        city: companies.city,
        county: companies.county,
        createdAt: companies.createdAt,
      })
      .from(companies)
      .orderBy(desc(companies.createdAt))
      .limit(5);

    console.log('🆕 ULTIMELE 5 FIRME ADĂUGATE:');
    recentResult.forEach((row, index) => {
      const date = row.createdAt ? new Date(row.createdAt).toLocaleString('ro-RO') : 'N/A';
      console.log(`   ${index + 1}. ${row.name?.substring(0, 40)}...`);
      console.log(`      CIF: ${row.cif} | ${row.city || ''}${row.county ? `, ${row.county}` : ''}`);
      console.log(`      Adăugat: ${date}`);
    });
    console.log('');

    // Statistici generale
    const withAddressResult = await db
      .select({ count: count() })
      .from(companies)
      .where(sql`${companies.address} IS NOT NULL`);
    const withAddress = withAddressResult[0]?.count || 0;

    const withCityResult = await db
      .select({ count: count() })
      .from(companies)
      .where(sql`${companies.city} IS NOT NULL`);
    const withCity = withCityResult[0]?.count || 0;

    const withCountyResult = await db
      .select({ count: count() })
      .from(companies)
      .where(sql`${companies.county} IS NOT NULL`);
    const withCounty = withCountyResult[0]?.count || 0;

    const withPhoneResult = await db
      .select({ count: count() })
      .from(companies)
      .where(sql`${companies.phone} IS NOT NULL`);
    const withPhone = withPhoneResult[0]?.count || 0;

    const withEmailResult = await db
      .select({ count: count() })
      .from(companies)
      .where(sql`${companies.email} IS NOT NULL`);
    const withEmail = withEmailResult[0]?.count || 0;

    const withWebsiteResult = await db
      .select({ count: count() })
      .from(companies)
      .where(sql`${companies.website} IS NOT NULL`);
    const withWebsite = withWebsiteResult[0]?.count || 0;

    console.log('📋 COMPLETITUDE DATE:');
    console.log(`   Cu adresă: ${withAddress.toLocaleString()} (${((withAddress / total) * 100).toFixed(1)}%)`);
    console.log(`   Cu oraș: ${withCity.toLocaleString()} (${((withCity / total) * 100).toFixed(1)}%)`);
    console.log(`   Cu județ: ${withCounty.toLocaleString()} (${((withCounty / total) * 100).toFixed(1)}%)`);
    console.log(`   Cu telefon: ${withPhone.toLocaleString()} (${((withPhone / total) * 100).toFixed(1)}%)`);
    console.log(`   Cu email: ${withEmail.toLocaleString()} (${((withEmail / total) * 100).toFixed(1)}%)`);
    console.log(`   Cu website: ${withWebsite.toLocaleString()} (${((withWebsite / total) * 100).toFixed(1)}%)`);
    console.log('');

    console.log('✅ Verificare completă!');
  } catch (error) {
    console.error('❌ Eroare:', error);
    process.exit(1);
  }
}

checkDatabase().catch(console.error);

