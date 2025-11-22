const pool = require('../database/db');

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...\n');

    // Check for key columns
    const keyColumns = [
      { table: 'users', columns: ['updated_at'] },
      { table: 'teams', columns: ['updated_at'] },
      { table: 'dashboards', columns: ['assigned_team_id', 'updated_at'] },
      { table: 'charts', columns: ['created_at', 'updated_at'] },
      { table: 'issues', columns: ['subject', 'attachment_url'] },
      { table: 'comments', columns: ['attachment_url', 'updated_at'] }
    ];

    console.log('📋 Checking key columns:\n');
    
    for (const check of keyColumns) {
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

    // Check for all tables
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

    console.log('\n📊 Tables status:');
    if (missingTables.length === 0) {
      console.log('   ✅ All 11 expected tables are present!');
    } else {
      console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}`);
    }

    // Check for issue_seconds (should not exist, should be thread_seconds)
    if (existingTables.includes('issue_seconds')) {
      console.log('\n   ⚠️  Found "issue_seconds" - should be renamed to "thread_seconds"');
    } else {
      console.log('\n   ✅ Table name is correct (thread_seconds, not issue_seconds)');
    }

    console.log('\n✅ Schema verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifySchema();


