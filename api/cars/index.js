import pool from '../../local/db.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const car = req.body || {};

      const toNull = v => (v === '' ? null : v);

      await pool.query(`
    INSERT INTO cars (
        registration, owner_id, make, model, mileage, purchase_price,
        asking_price, transport_cost, repair_cost,
        total_cost, sale_price, profit, status,
        purchase_date, sold_date, notes
    )
    VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
    )
`, [
        car.registration,
        car.owner_id,
        toNull(car.make),
        toNull(car.model),
        toNull(car.mileage),
        toNull(car.purchase_price),
        toNull(car.asking_price),
        toNull(car.transport_cost),
        toNull(car.repair_cost),
        toNull(car.total_cost),
        toNull(car.sale_price),
        toNull(car.profit),
        toNull(car.status),
        toNull(car.purchase_date),
        toNull(car.sold_date),
        toNull(car.notes)
      ]);

      console.log('API POST /api/cars inserted', { registration: car.registration, owner_id: car.owner_id });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('API POST /api/cars error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // fallback
  res.status(405).json({ error: 'Method not allowed' });
}
