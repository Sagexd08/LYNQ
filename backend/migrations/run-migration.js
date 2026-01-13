require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const executeMigration = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    const sqlFilePath = path.join(__dirname, 'add-missing-schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 Executing migration: add-missing-schema.sql');
    console.log('   - Adding reputation, reputation_events, repayments tables');
    console.log('   - Adding phone, status fields to users');
    console.log('   - Adding partialExtensionUsed, lateDays, riskLevel to loans');
    console.log('');
    
    await client.query(sql);
    console.log('✅ Migration executed successfully!\n');
    
    // Verify new tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('reputation', 'reputation_events', 'repayments')
      ORDER BY table_name;
    `);
    
    console.log('📊 New tables verified:');
    tablesResult.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    
    // Verify new columns on users
    const userColumnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('phone', 'status')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 New user fields:');
    userColumnsResult.rows.forEach(row => console.log(`  ✓ ${row.column_name} (${row.data_type})`));
    
    // Verify new columns on loans
    const loanColumnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'loans'
      AND column_name IN ('partialExtensionUsed', 'lateDays', 'riskLevel')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 New loan fields:');
    loanColumnsResult.rows.forEach(row => console.log(`  ✓ ${row.column_name} (${row.data_type})`));
    
    console.log('\n🎉 All migrations applied successfully!');
    console.log('📌 Next steps:');
    console.log('   1. Run: npx prisma db pull');
    console.log('   2. Run: npx prisma generate');
    console.log('   3. Restart your application\n');
    
    await client.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

executeMigration();
