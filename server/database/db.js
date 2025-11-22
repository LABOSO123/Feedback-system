const { Pool } = require('pg');
require('dotenv').config();

/**
 * Database Connection Pool
 * 
 * Creates and manages a PostgreSQL connection pool with configuration
 * from environment variables. Supports both individual connection parameters
 * and connection strings (for cloud providers).
 * 
 * Configuration options:
 * - DB_HOST: Database host (default: localhost)
 * - DB_PORT: Database port (default: 5433)
 * - DB_NAME: Database name (default: feedback_system)
 * - DB_USER: Database user (default: postgres)
 * - DB_PASSWORD: Database password
 * - DB_SSL: Enable SSL (true/false)
 * - DATABASE_URL: Full connection string (overrides individual settings)
 * - DB_POOL_MAX: Maximum pool size (default: 20)
 * - DB_POOL_IDLE_TIMEOUT: Idle timeout in ms (default: 30000)
 * - DB_POOL_CONNECTION_TIMEOUT: Connection timeout in ms (default: 2000)
 * 
 * @module database/db
 * @type {Pool}
 */

// Build connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'feedback_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

// Add SSL configuration if provided (common for cloud databases like AWS RDS, Heroku, etc.)
if (process.env.DB_SSL === 'true' || process.env.DATABASE_URL) {
  dbConfig.ssl = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' 
    ? { rejectUnauthorized: false }
    : { rejectUnauthorized: true };
}

// Support for connection string (common in cloud providers)
if (process.env.DATABASE_URL) {
  dbConfig.connectionString = process.env.DATABASE_URL;
  // Parse connection string and override individual settings
  const url = new URL(process.env.DATABASE_URL);
  dbConfig.host = url.hostname;
  dbConfig.port = parseInt(url.port) || 5432;
  dbConfig.database = url.pathname.slice(1); // Remove leading '/'
  dbConfig.user = url.username;
  dbConfig.password = url.password;
}

// Connection pool settings
const poolConfig = {
  ...dbConfig,
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 2000, // Return an error after 2 seconds if connection could not be established
};

const pool = new Pool(poolConfig);

pool.on('connect', (client) => {
  console.log('✅ Connected to PostgreSQL database');
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  // Don't exit in production, let the app handle reconnection
  if (process.env.NODE_ENV !== 'production') {
    console.error('Exiting due to database connection error');
    process.exit(-1);
  }
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection test failed:', err.message);
    console.error('   Please check your database configuration in server/.env');
  } else {
    console.log('✅ Database connection test successful');
    console.log(`   Server time: ${res.rows[0].now}`);
  }
});

module.exports = pool;

