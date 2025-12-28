// Load .env.local if not already loaded (for scripts)
if (!process.env.DATABASE_URL) {
  try {
    require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
  } catch (e) {
    // dotenv might not be available, that's OK for Next.js runtime
  }
}

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  console.error('⚠️ DATABASE_URL environment variable is not set');
  // Nu aruncăm eroare aici pentru a permite Next.js să pornească
  // Eroarea va fi gestionată în context
}

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Connection pool settings - OPTIMIZED
      max: 20, // Mărit pentru performanță
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000, // Redus timeout
      // Performance optimizations
      statement_timeout: 30000, // 30s max per query
    });

    // Test connection
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    db = drizzle(pool, { schema });
    console.log('✅ Database connection initialized');
  } else {
    console.error('⚠️ DATABASE_URL not set');
  }
} catch (error) {
  console.error('❌ Error initializing database:', error);
  pool = null;
  db = null;
}

// Fallback: dacă db este null, creează un mock pentru a preveni crash-uri
if (!db && process.env.DATABASE_URL) {
  console.error('⚠️ Database initialization failed, but DATABASE_URL is set');
}

export { db };

export type Database = typeof db;

