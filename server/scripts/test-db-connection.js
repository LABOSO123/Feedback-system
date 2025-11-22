/**
 * Database Connection Test Script
 * Run this to verify your database configuration
 * 
 * Usage: node scripts/test-db-connection.js
 */

require('dotenv').config();
const pool = require('../database/db');

async function testConnection() {
  console.log('\n🔍 Testing Database Connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || 5432}`);
  console.log(`  Database: ${process.env.DB_NAME || 'feedback_system'}`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`  SSL: ${process.env.DB_SSL || 'false'}`);
  console.log(`  Connection String: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}\n`);

  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!\n');
    console.log('Database Info:');
    console.log(`  Current Time: ${result.rows[0].current_time}`);
    console.log(`  PostgreSQL Version: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}\n`);

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`📊 Tables Found: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      console.log('  Tables:');
      tablesResult.rows.forEach(row => {
        console.log(`    - ${row.table_name}`);
      });
    } else {
      console.log('  ⚠️  No tables found. Run the schema.sql file to create tables.');
    }

    console.log('\n✅ All tests passed! Your database is ready.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your .env file in the server/ directory');
    console.error('2. Verify PostgreSQL is running');
    console.error('3. Check database credentials');
    console.error('4. Ensure the database exists');
    console.error('5. Check firewall/network settings\n');
    process.exit(1);
  }
}

testConnection();



