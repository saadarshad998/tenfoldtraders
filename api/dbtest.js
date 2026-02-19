import pool from '../local/db.js';

function mask(s) {
  if (!s) return null;
  try {
    // hide password
    return s.replace(/:(.*?)@/, ':***@');
  } catch (e) {
    return '***';
  }
}

export default async function handler(req, res) {
  const envInfo = {
    SUPABASE_DB_URL_present: !!process.env.SUPABASE_DB_URL,
    DATABASE_URL_present: !!process.env.DATABASE_URL,
    SUPABASE_DB_URL: mask(process.env.SUPABASE_DB_URL),
    DATABASE_URL: mask(process.env.DATABASE_URL)
  };

  try {
    const result = await pool.query('SELECT 1 AS ok');
    res.status(200).json({ ok: true, rows: result.rows, env: envInfo });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, stack: err.stack, env: envInfo });
  }
}
