const pool = require('../database/db');
require('dotenv').config();

/**
 * Check a user's role in the database
 */
async function checkUserRole(email) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, team_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`\n❌ No user found with email: ${email}\n`);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('\n✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Team ID: ${user.team_id || 'None'}`);
    
    if (user.role !== 'admin') {
      console.log(`\n⚠️  WARNING: This user's role is "${user.role}", not "admin"!`);
      console.log('   You need to update the role to "admin" to access admin features.');
      console.log('\n💡 To fix this, run:');
      console.log(`   node scripts/update-user-role.js "${email}" admin\n`);
    } else {
      console.log('\n✅ User has admin role!');
      console.log('   If you\'re still getting "insufficient permissions", try:');
      console.log('   1. Log out and log back in (to refresh your token)');
      console.log('   2. Clear your browser cache/localStorage\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error checking user role:');
    console.error(error.message);
    console.error('\n💡 Make sure your database is running and .env file is configured.\n');
    process.exit(1);
  } finally {
    pool.end();
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('\n📝 Usage: node scripts/check-user-role.js <email>');
  console.log('\nExample:');
  console.log('  node scripts/check-user-role.js admin@123.com\n');
  process.exit(1);
}

checkUserRole(args[0]);

