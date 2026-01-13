const result = require('dotenv').config({ path: '.env.local' });
if (result.error) {
    console.log('Error loading .env.local:', result.error);
}
console.log('DEBUG: DATABASE_URL is', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function setupDatabase() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL environment variable is not set.');
        console.error('Please create a .env.local file with your Render connection string:');
        console.error('DATABASE_URL=postgres://user:password@host/dbname?sslmode=require');
        process.exit(1);
    }

    console.log('🔌 Connecting to database...');

    try {
        // Enable UUID extension
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

        console.log('📦 Creating tasks table...');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo',
        priority_score INTEGER DEFAULT 0,
        due_date TIMESTAMP WITH TIME ZONE,
        eisenhower_category TEXT,
        created_by TEXT,
        manual_priority TEXT,
        project_id UUID,
        assigned_to UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('✅ Database setup complete! "tasks" table is ready.');
    } catch (error) {
        console.error('❌ Database setup failed:', error);
    } finally {
        await pool.end();
    }
}

setupDatabase();
