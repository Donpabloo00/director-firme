import { db } from '@/server/db';
import { companies } from '@/server/db/schema';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection to cPanel PostgreSQL...\n');
    
    // Test 1: Simple query
    console.log('Test 1: Simple connection test...');
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Connection successful!\n');
    
    // Test 2: Count companies
    console.log('Test 2: Counting companies...');
    const countResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(companies);
    const count = Number(countResult[0]?.count || 0);
    console.log(`✅ Found ${count.toLocaleString()} companies in database\n`);
    
    // Test 3: Fetch one company
    console.log('Test 3: Fetching sample company...');
    const sampleCompany = await db
      .select({
        id: companies.id,
        name: companies.name,
        cif: companies.cif,
        status: companies.status,
      })
      .from(companies)
      .limit(1);
    
    if (sampleCompany.length > 0) {
      console.log('✅ Sample company found:');
      console.log(`   Name: ${sampleCompany[0].name}`);
      console.log(`   CIF: ${sampleCompany[0].cif}`);
      console.log(`   Status: ${sampleCompany[0].status || 'N/A'}\n`);
    } else {
      console.log('⚠️ No companies found (database might be empty)\n');
    }
    
    // Test 4: Check tables
    console.log('Test 4: Checking database tables...');
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const tables = (tablesResult.rows as any[]).map((r: any) => r.table_name);
    console.log(`✅ Found ${tables.length} tables:`, tables.join(', '));
    
    console.log('\n🎉 All tests passed! Database migration successful!');
    console.log('✅ Your cPanel PostgreSQL database is working correctly!');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error details:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check DATABASE_URL in .env.local');
    console.error('  2. Verify database exists in cPanel');
    console.error('  3. Verify user has correct permissions');
    console.error('  4. Check host/port are correct (usually localhost:5432)');
    console.error('  5. Verify password is correct');
    console.error('\n📖 See MIGRARE_SUPABASE_CPANEL.md for detailed instructions');
    
    process.exit(1);
  }
}

testConnection();

