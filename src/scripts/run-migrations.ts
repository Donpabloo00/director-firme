/**
 * Script pentru a rula migrațiile direct în Supabase
 * 
 * Usage: npx tsx src/scripts/run-migrations.ts
 */

// Load .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Pool } from 'pg';
import * as fs from 'fs';

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL nu este setat în .env.local');
    process.exit(1);
  }

  console.log('🔧 Running migrations...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Read migration file
    const migrationFile = path.resolve(process.cwd(), 'drizzle/0000_cloudy_gravity.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      console.log('💡 Run: npm run db:generate first');
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    // Split by statement-breakpoint and execute each statement
    const statements = sql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === '') continue;

      try {
        await pool.query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error: any) {
        // Ignore "already exists" errors (idempotent)
        if (error.code === '42P07' || error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1}: Already exists (skipping)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n✅ Migrations completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();

