import pool from '../../local/db.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  const reg = req.query && (req.query.reg || req.query.slug || req.query[0]);
  if (!reg) return res.status(400).json({ error: 'missing registration' });

  try {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const fields = req.body || {};

      const allowed = [
        "mileage","purchase_price","asking_price","transport_cost",
        "repair_cost","total_cost","sale_price","profit",
        "status","purchase_date","sold_date","notes"
      ];

      const updates = [];
      const values = [];
      let i = 1;

      for (const key of Object.keys(fields)) {
        if (!allowed.includes(key)) continue;
        updates.push(`${key} = $${i++}`);
        values.push(fields[key] === '' ? null : fields[key]);
      }

      if (!updates.length) return res.status(400).json({ success: false, error: 'no updatable fields' });

      values.push(reg);

      const result = await pool.query(
        `UPDATE cars SET ${updates.join(', ')} WHERE registration = $${i}`,
        values
      );

      return res.status(200).json({ success: true, rowCount: result.rowCount });
    }

    // Default: GET
    const result = await pool.query(`
        SELECT
            id,
            owner_id,
            registration,
            make,
            model,
            mileage,
            purchase_date::text,
            sold_date::text,
            purchase_price,
            asking_price,
            transport_cost,
            repair_cost,
            total_cost,
            sale_price,
            profit,
            status,
            notes,
            created_at::text
        FROM cars
        WHERE registration = $1
    `, [reg]);

    const row = result.rows[0] || {};
    res.status(200).json(row);
  } catch (err) {
    console.error('/api/cars/[reg] error:', err);
    res.status(500).json({ error: err.message });
  }
}
