const pool = require('../database/db');
require('dotenv').config();

/**
 * Fix admin_requests table - check and add missing column if needed
 */
async function fixAdminRequestsTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_requests'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ admin_requests table does not exist. Please run the schema.sql file first.');
      process.exit(1);
    }

    // Check current columns
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admin_requests'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Current admin_requests table columns:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // Check if submitted_by_user_id exists
    const hasSubmittedBy = columns.rows.some(col => col.column_name === 'submitted_by_user_id');
    
    if (!hasSubmittedBy) {
      console.log('\n⚠️  Column "submitted_by_user_id" is missing!');
      
      // Check if it might be named differently
      const possibleNames = ['user_id', 'submitted_by', 'created_by_user_id'];
      const foundAlternative = columns.rows.find(col => possibleNames.includes(col.column_name));
      
      if (foundAlternative) {
        console.log(`\n💡 Found alternative column: "${foundAlternative.column_name}"`);
        console.log('   You may need to rename it or add the missing column.');
        console.log('\n   To fix, run this SQL:');
        console.log(`   ALTER TABLE admin_requests RENAME COLUMN ${foundAlternative.column_name} TO submitted_by_user_id;`);
      } else {
        console.log('\n✅ Adding missing column "submitted_by_user_id"...');
        await pool.query(`
          ALTER TABLE admin_requests 
          ADD COLUMN submitted_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;
        `);
        console.log('✅ Column added successfully!');
      }
    } else {
      console.log('\n✅ Column "submitted_by_user_id" exists!');
    }

    // Verify the fix
    const finalCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admin_requests' 
      AND column_name = 'submitted_by_user_id';
    `);

    if (finalCheck.rows.length > 0) {
      console.log('\n✅ admin_requests table is now correct!');
    } else {
      console.log('\n❌ Column still missing. Please check manually.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing admin_requests table:');
    console.error(error.message);
    console.error('\n💡 You may need to run the schema.sql file to recreate the table correctly.');
    process.exit(1);
  } finally {
    pool.end();
  }
}

fixAdminRequestsTable();

