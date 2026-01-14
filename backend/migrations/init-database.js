require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const executeSQLFile = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');
    
    const sqlFilePath = path.join(__dirname, 'init-schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL schema...');
    await client.query(sql);
    console.log('✅ Schema created successfully!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tables created:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

executeSQLFile();
