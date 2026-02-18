import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    host: 'aws-1-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.qlzhnqbsscnxhgjpfaxx',
    password: process.env.SUPABASE_PASSWORD,
    database: 'postgres'
});

export default pool;
