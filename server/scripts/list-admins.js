const pool = require('../database/db');
require('dotenv').config();

/**
 * List all admin users in the database
 */
async function listAdmins() {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['admin']
    );

    if (result.rows.length === 0) {
      console.log('\n❌ No admin users found in the database.');
      console.log('\n💡 To create an admin user, run:');
      console.log('   node scripts/create-admin.js "Admin Name" admin@example.com Admin123!\n');
      process.exit(0);
    }

    console.log('\n✅ Found admin user(s):\n');
    result.rows.forEach((admin, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Created: ${admin.created_at}`);
      console.log('');
    });

    console.log('🌐 Login at: http://localhost:3000/login');
    console.log('   Use the email above with the password you set when creating the admin.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error querying database:');
    console.error(error.message);
    console.error('\n💡 Make sure your database is running and .env file is configured correctly.\n');
    process.exit(1);
  } finally {
    pool.end();
  }
}

listAdmins();

