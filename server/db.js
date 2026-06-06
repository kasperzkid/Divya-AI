const { Pool } = require('pg');

// Safe configuration logging for easy deployment troubleshooting on Render
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  console.log(`[DB-INIT] Detected DATABASE_URL environment variable (length: ${url.length}). Attempting pool connection...`);
  if (url.includes('[YOUR-PASSWORD]') || url.includes('<YOUR-PASSWORD>') || url.includes('[password]') || url.includes('<password>') || url.includes('YOUR_DATABASE_PASSWORD') || url.includes('YOUR-PASSWORD')) {
    console.error('⚠️ [DB-INIT] ERROR: Your DATABASE_URL contains a placeholder (like "[YOUR-PASSWORD]" or "YOUR-PASSWORD"). Please replace it with your actual Supabase database password in Render Environment Variables!');
  }
} else {
  console.log('[DB-INIT] DATABASE_URL not found. Falling back to individual parameters:');
  console.log(`  - Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  - User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`  - Database: ${process.env.DB_NAME || 'postgres'}`);
  console.log(`  - Port: ${process.env.DB_PORT || 5432}`);
  console.log(`  - SSL: ${process.env.DB_SSL === 'true'}`);
}

const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      port: parseInt(process.env.DB_PORT) || 5432,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(config);

async function initDb() {
  let client;
  try {
    client = await pool.connect();
    console.log('[DB-INIT] Successfully connected to PostgreSQL/Supabase database!');
    
    // Create the schema to match backend queries
    await client.query('CREATE SCHEMA IF NOT EXISTS health_ai');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS health_ai.users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        name VARCHAR(255),
        picture TEXT,
        age INTEGER,
        weight REAL,
        height INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure password column exists for backward compatibility
    try {
      await client.query('ALTER TABLE health_ai.users ADD COLUMN password VARCHAR(255)');
    } catch (_) {}

    // 2. OTPs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS health_ai.otps (
        email VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    // 3. Sessions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS health_ai.sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        title VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES health_ai.users(id) ON DELETE CASCADE
      )
    `);

    // 4. Messages Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS health_ai.messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'ai', 'system')),
        text TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_messages_session FOREIGN KEY (session_id) REFERENCES health_ai.sessions(id) ON DELETE CASCADE
      )
    `);

    // 5. Alarms Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS health_ai.alarms (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        time VARCHAR(255) NOT NULL,
        days VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_alarms_user FOREIGN KEY (user_id) REFERENCES health_ai.users(id) ON DELETE CASCADE
      )
    `);

    // 6. Custom Tasks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS health_ai.custom_tasks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(255) NOT NULL,
        time VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_custom_tasks_user FOREIGN KEY (user_id) REFERENCES health_ai.users(id) ON DELETE CASCADE
      )
    `);

    console.log('PostgreSQL database and tables initialized successfully');
  } catch (err) {
    console.error('❌ [DB-INIT] Error initializing PostgreSQL database:', err.message);
    console.error('👉 Troubleshooting Tips:');
    console.error('   1. Check if your DATABASE_URL in Render is correct and has the correct password (no brackets like []).');
    console.error('   2. If you are using Supabase, make sure you use the transaction-pooled URL on port 6543 (which is IPv4 compatible).');
    console.error('   3. Make sure SSL connections are allowed or add ?sslmode=require to your connection string.');
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = { pool, initDb };
