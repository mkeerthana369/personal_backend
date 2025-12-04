// ============================================
// FILE: scripts/setup-database.js
// Database setup automation
// ============================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true
  };
  
  console.log('🔧 Starting database setup...');
  console.log(`📍 Host: ${config.host}:${config.port}`);
  console.log(`👤 User: ${config.user}`);
  
  let connection;
  
  try {
    // Connect without database
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Executing schema.sql...');
    await connection.query(schema);
    
    console.log('✅ Database setup complete!');
    console.log('\n📊 Checking tables...');
    
    // Connect to new database
    await connection.changeUser({ database: process.env.DB_NAME || 'bdm_system_v2' });
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    console.log('\n🎉 Setup successful! You can now run: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check your MySQL credentials in .env');
    console.error('   2. Ensure MySQL server is running');
    console.error('   3. Verify user has CREATE DATABASE permission');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();