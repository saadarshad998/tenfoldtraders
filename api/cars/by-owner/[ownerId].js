import pool from '../../../local/db.js';

export default async function handler(req, res) {
  const { ownerId } = req.query || {};

  if (!ownerId) return res.status(400).json({ error: 'missing ownerId' });

  try {
    const result = await pool.query(
      `SELECT registration, make, model FROM cars WHERE owner_id = $1 ORDER BY registration`,
      [ownerId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('API /cars/by-owner error:', err);
    res.status(500).json({ error: err.message });
  }
}
