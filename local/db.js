import pkg from 'pg';
const { Pool } = pkg;

// Prefer a full connection string from environment (works well on Vercel)
const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || null;

let pool;
if (connectionString) {
    pool = new Pool({
        connectionString,
        // Allow self-signed or managed pgbouncer setups; adjust as needed for security
        ssl: { rejectUnauthorized: false }
    });
} else {
    // fallback to explicit parts (local development)
    pool = new Pool({
        host: 'aws-1-eu-west-1.pooler.supabase.com',
        port: 6543,
        user: 'postgres',
        password: process.env.SUPABASE_PASSWORD,
        database: 'postgres'
    });
}

export default pool;
