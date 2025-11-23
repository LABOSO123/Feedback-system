const pool = require('../database/db');
require('dotenv').config();

/**
 * Update a user's role in the database
 */
async function updateUserRole(email, newRole) {
  try {
    // Validate role
    const validRoles = ['admin', 'business', 'data_science'];
    if (!validRoles.includes(newRole)) {
      console.error(`\n❌ Invalid role. Must be one of: ${validRoles.join(', ')}\n`);
      process.exit(1);
    }

    // Check if user exists
    const checkResult = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length === 0) {
      console.log(`\n❌ No user found with email: ${email}\n`);
      process.exit(1);
    }

    const user = checkResult.rows[0];
    console.log(`\n📋 Current user info:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   New Role: ${newRole}`);

    if (user.role === newRole) {
      console.log(`\n✅ User already has role "${newRole}"!\n`);
      process.exit(0);
    }

    // Update role
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, name, email, role',
      [newRole, email]
    );

    console.log(`\n✅ User role updated successfully!`);
    console.log(`\n📋 Updated user info:`);
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Name: ${result.rows[0].name}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log('\n⚠️  IMPORTANT: You must log out and log back in for the changes to take effect!');
    console.log('   Your current token still has the old role.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating user role:');
    console.error(error.message);
    console.error('\n💡 Make sure your database is running and .env file is configured.\n');
    process.exit(1);
  } finally {
    pool.end();
  }
}

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('\n📝 Usage: node scripts/update-user-role.js <email> <role>');
  console.log('\nExample:');
  console.log('  node scripts/update-user-role.js admin@123.com admin');
  console.log('\nValid roles: admin, business, data_science\n');
  process.exit(1);
}

updateUserRole(args[0], args[1]);

