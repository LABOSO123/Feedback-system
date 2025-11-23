const pool = require('../database/db');
require('dotenv').config();

/**
 * Migrate admin_requests table: rename user_id to submitted_by_user_id
 */
async function migrateAdminRequestsColumn() {
  try {
    console.log('\n🔧 Migrating admin_requests table...\n');

    // Check if user_id column exists
    const checkUserId = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admin_requests' 
      AND column_name = 'user_id';
    `);

    // Check if submitted_by_user_id already exists
    const checkSubmittedBy = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admin_requests' 
      AND column_name = 'submitted_by_user_id';
    `);

    if (checkSubmittedBy.rows.length > 0) {
      console.log('✅ Column "submitted_by_user_id" already exists!');
      process.exit(0);
    }

    if (checkUserId.rows.length > 0) {
      console.log('📝 Renaming "user_id" to "submitted_by_user_id"...');
      
      // Rename the column
      await pool.query(`
        ALTER TABLE admin_requests 
        RENAME COLUMN user_id TO submitted_by_user_id;
      `);
      
      console.log('✅ Column renamed successfully!');
    } else {
      console.log('⚠️  Column "user_id" not found. Adding "submitted_by_user_id"...');
      
      // Add the column if it doesn't exist
      await pool.query(`
        ALTER TABLE admin_requests 
        ADD COLUMN submitted_by_user_id INTEGER;
      `);
      
      // Copy data if user_id exists with different name, or set a default
      // For now, we'll just add it and let the user know
      console.log('✅ Column added. You may need to populate it with data.');
    }

    // Add foreign key constraint if missing
    const checkFK = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'admin_requests' 
      AND constraint_name = 'fk_admin_requests_submitted_by';
    `);

    if (checkFK.rows.length === 0) {
      console.log('📝 Adding foreign key constraint...');
      await pool.query(`
        ALTER TABLE admin_requests 
        ADD CONSTRAINT fk_admin_requests_submitted_by 
        FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
      console.log('✅ Foreign key constraint added!');
    }

    // Add missing columns if they don't exist
    const allColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admin_requests';
    `);

    const columnNames = allColumns.rows.map(r => r.column_name);
    const requiredColumns = {
      'dashboard_id': 'INTEGER',
      'subject': 'VARCHAR(255) NOT NULL',
      'description': 'TEXT NOT NULL',
      'admin_response': 'TEXT',
      'resolved_by_admin_id': 'INTEGER',
      'updated_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    };

    for (const [colName, colDef] of Object.entries(requiredColumns)) {
      if (!columnNames.includes(colName)) {
        console.log(`📝 Adding missing column "${colName}"...`);
        await pool.query(`
          ALTER TABLE admin_requests 
          ADD COLUMN ${colName} ${colDef};
        `);
        console.log(`✅ Column "${colName}" added!`);
      }
    }

    console.log('\n✅ Migration complete! admin_requests table is now up to date.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error migrating admin_requests table:');
    console.error(error.message);
    console.error('\n💡 You may need to run this manually in psql:\n');
    console.error('   ALTER TABLE admin_requests RENAME COLUMN user_id TO submitted_by_user_id;\n');
    process.exit(1);
  } finally {
    pool.end();
  }
}

migrateAdminRequestsColumn();

