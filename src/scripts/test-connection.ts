/**
 * Script de test pentru conexiunea la database
 * 
 * Usage: npx tsx src/scripts/test-connection.ts
 */

// Load .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../server/db/index';
import { companies } from '../server/db/schema';

async function testConnection() {
  if (!db) {
    throw new Error('Database connection not available');
  }
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Verifică variabile de mediu
    console.log('1️⃣ Checking environment variables...');
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL nu este setat în .env.local');
      process.exit(1);
    }
    console.log('✅ DATABASE_URL found');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL nu este setat');
    } else {
      console.log('✅ NEXT_PUBLIC_SUPABASE_URL found');
    }

    // Test 2: Conectare la database
    console.log('\n2️⃣ Testing database connection...');
    const result = await db.select({ count: companies.id }).from(companies).limit(1);
    console.log('✅ Database connection successful!');

    // Test 3: Verifică dacă tabelul companies există și are date
    console.log('\n3️⃣ Checking companies table...');
    const countResult = await db
      .select({ count: companies.id })
      .from(companies)
      .limit(1);
    
    const totalCompanies = await db
      .select()
      .from(companies)
      .limit(1);

    console.log(`✅ Companies table exists`);
    console.log(`📊 Total companies in DB: ${totalCompanies.length > 0 ? 'Has data' : 'Empty (ready for import)'}`);

    console.log('\n✅ All tests passed! Ready for import.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        console.error('\n💡 Tip: Verifică că DATABASE_URL este corect în .env.local');
        console.error('   Găsești connection string în Supabase Dashboard → Settings → Database');
      }
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('\n💡 Tip: Rulează migrațiile: npm run db:generate && npm run db:migrate');
      }
    }
    
    process.exit(1);
  }
}

testConnection();

