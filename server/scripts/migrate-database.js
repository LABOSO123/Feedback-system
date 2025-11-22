const fs = require('fs');
const path = require('path');
const pool = require('../database/db');

async function runMigration() {
  const migrationPath = path.join(__dirname, '../database/migrate_existing_db.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('🔄 Starting database migration...\n');

  try {
    // Split the SQL file by semicolons and execute each statement
    // Note: This is a simplified approach. For production, consider using a proper migration tool
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) continue;
      
      try {
        await pool.query(statement);
        successCount++;
      } catch (err) {
        // Some errors are expected (e.g., constraint already exists)
        // Only log unexpected errors
        if (!err.message.includes('already exists') && 
            !err.message.includes('does not exist') &&
            !err.message.includes('duplicate')) {
          console.error(`⚠️  Warning: ${err.message.substring(0, 100)}`);
          errorCount++;
        }
      }
    }

    console.log(`✅ Migration completed!`);
    console.log(`   Successful operations: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   Warnings: ${errorCount}`);
    }
    console.log('\n📊 Verifying database structure...\n');

    // Verify tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const expectedTables = [
      'users', 'teams', 'dashboards', 'charts', 'issues', 
      'comments', 'thread_seconds', 'notifications', 
      'leaderboard_activity', 'password_reset_tokens', 'admin_requests'
    ];

    const existingTables = tablesResult.rows.map(r => r.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    console.log('📋 Existing tables:');
    existingTables.forEach(table => {
      const isExpected = expectedTables.includes(table);
      console.log(`   ${isExpected ? '✅' : '⚠️ '} ${table}`);
    });

    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing tables:');
      missingTables.forEach(table => console.log(`   ❌ ${table}`));
    } else {
      console.log('\n✅ All expected tables are present!');
    }

    // Check for issue_seconds (should be renamed to thread_seconds)
    if (existingTables.includes('issue_seconds')) {
      console.log('\n⚠️  Found "issue_seconds" table. It should be renamed to "thread_seconds".');
      console.log('   Please run the migration script again or manually rename it.');
    }

    // Verify key columns
    console.log('\n🔍 Checking key columns...\n');
    
    const checks = [
      { table: 'users', columns: ['updated_at'] },
      { table: 'teams', columns: ['updated_at'] },
      { table: 'dashboards', columns: ['assigned_team_id', 'updated_at'] },
      { table: 'charts', columns: ['created_at', 'updated_at'] },
      { table: 'issues', columns: ['subject', 'attachment_url'] },
      { table: 'comments', columns: ['attachment_url', 'updated_at'] }
    ];

    for (const check of checks) {
      const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = ANY($2)
      `, [check.table, check.columns]);

      const foundColumns = result.rows.map(r => r.column_name);
      const missing = check.columns.filter(c => !foundColumns.includes(c));

      if (missing.length === 0) {
        console.log(`   ✅ ${check.table}: All columns present`);
      } else {
        console.log(`   ⚠️  ${check.table}: Missing ${missing.join(', ')}`);
      }
    }

    console.log('\n✅ Database migration verification complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test your application');
    console.log('   2. Verify all features work correctly');
    console.log('   3. Check that foreign key relationships are working');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration().catch(console.error);


