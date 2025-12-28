import { db } from '@/server/db/index';
import { companies } from '@/server/db/schema';
import { sql } from 'drizzle-orm';

async function countCompanies() {
  if (!db) {
    console.error('❌ Database connection not available');
    process.exit(1);
  }

  try {
    const result = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(companies);
    
    const total = Number(result[0]?.count || 0);
    
    console.log(`\n📊 TOTAL FIRME ÎN BAZĂ DE DATE: ${total.toLocaleString()}\n`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Eroare:', error.message);
    process.exit(1);
  }
}

countCompanies();
