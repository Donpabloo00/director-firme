/**
 * Script pentru adăugarea coloanelor slug și seo_content în baza de date
 */

import 'dotenv/config';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../server/db/index';
import { sql } from 'drizzle-orm';

async function addColumns() {
  console.log('🔄 Adăugare coloane slug și seo_content...\n');

  try {
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Adaugă coloana slug
    await db.execute(sql`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(550);
    `);
    console.log('✅ Coloana slug adăugată');

    // Adaugă coloana seo_content
    await db.execute(sql`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS seo_content TEXT;
    `);
    console.log('✅ Coloana seo_content adăugată');

    // Creează index pentru slug
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS slug_idx ON companies(slug);
    `);
    console.log('✅ Index slug_idx creat\n');

    console.log('✅ Toate coloanele au fost adăugate cu succes!');
  } catch (error) {
    console.error('❌ Eroare:', error);
    process.exit(1);
  }
}

addColumns().catch(console.error);

