const bcrypt = require('bcryptjs');
const pool = require('../database/db');
require('dotenv').config();

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('\n📝 Usage: node scripts/create-admin.js <name> <email> <password>');
    console.log('\nExample:');
    console.log('  node scripts/create-admin.js "Admin User" admin@kra.go.ke Admin123!');
    console.log('\n⚠️  Password requirements:');
    console.log('  - At least 8 characters');
    console.log('  - Uppercase letter');
    console.log('  - Lowercase letter');
    console.log('  - Number');
    console.log('  - Special character\n');
    process.exit(1);
  }

  const [name, email, password] = args;

  // Validate password strength
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    console.error('\n❌ Password does not meet requirements:');
    console.error('  - At least 8 characters');
    console.error('  - Uppercase letter');
    console.error('  - Lowercase letter');
    console.error('  - Number');
    console.error('  - Special character\n');
    process.exit(1);
  }

  try {
    // Check if user exists
    const existing = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`\n⚠️  User with email "${email}" already exists:`);
      console.log(`   Role: ${existing.rows[0].role}`);
      console.log(`   ID: ${existing.rows[0].id}`);
      
      if (existing.rows[0].role === 'admin') {
        console.log('\n✅ This user is already an admin!');
        process.exit(0);
      } else {
        console.log('\n❌ This user exists but is not an admin.');
        console.log('   You can update the role in the database or use a different email.\n');
        process.exit(1);
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, 'admin']
    );

    const admin = result.rows[0];

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n🌐 You can now login at: http://localhost:3000/login');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: [the password you provided]\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error.message);
    if (error.code === '23505') {
      console.error('\n   Email already exists in database.');
    }
    console.error('');
    process.exit(1);
  }
}

createAdmin();


