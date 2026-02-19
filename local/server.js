import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import pool from './db.js';
import englishToSQL from './ai.js';
import validateSQL from './validatesql.js';
import respond from './respond.js';
import routeMessage from './router.js';
import chatResponse from './chat.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const conversations = new Map();


const app = express();


// simple request logger to help debug routing issues
app.use((req, res, next) => {
    console.log(`REQ ${req.method} ${req.url}`);
    next();
});


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.post('/ask', async (req, res) => {
    try {

        const { question, sessionId } = req.body;

        if (!conversations.has(sessionId))
            conversations.set(sessionId, []);

        const history = conversations.get(sessionId);

        console.log("QUESTION:", question);

        // 🧠 1. Decide if we need the database
        const intent = await routeMessage(question, history);
        console.log("INTENT:", intent);

        // ================= CHAT MODE =================
        if (intent === "CHAT") {

            const answer = await chatResponse(question, history);

            history.push({ role: "user", content: question });
            history.push({ role: "assistant", content: answer });

            return res.json({ answer });
        }

        // ================= QUERY MODE =================

        // 2️⃣ AI generates SQL
        let sql = await englishToSQL(question, history);

        // remove markdown
        sql = sql
            .replace(/```sql/g, '')
            .replace(/```/g, '')
            .trim();

        console.log("RAW SQL:", sql);

        // 3️⃣ validate SQL
        sql = validateSQL(sql, question);
        console.log("VALID SQL:", sql);

        
        // 🧠 LOGIC CONTRADICTION CHECK
        const impossible =
            /owners\.name.*=.*umar ali/i.test(sql) &&
            /owners\.name.*!=.*umar ali/i.test(sql);

        if (impossible) {
            return res.json({
                answer: "That question contradicts itself."
            });
        }


        // 4️⃣ query database
        let result;
        try {
            result = await pool.query(sql);
        } catch (dbErr) {
            console.error("DB ERROR:", dbErr.message);

            const fail = "I couldn't understand that request. Try asking in a different way.";

            history.push({ role: "user", content: question });
            history.push({ role: "assistant", content: fail });

            return res.json({ answer: fail });
        }

        console.log("DB RESULT:", result.rows);

        // 5️⃣ natural language response
        const answer = await respond(question, sql, result.rows, history);

        // 6️⃣ store conversation
        history.push({ role: "user", content: question });
        history.push({ role: "assistant", content: answer });

        res.json({ answer });

    } catch (err) {
        console.error("ERROR IN /ask:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/cars/by-owner/:ownerId', async (req, res) => {
    const { ownerId } = req.params;

    const result = await pool.query(
        `SELECT registration, make, model FROM cars WHERE owner_id = $1 ORDER BY registration`,
        [ownerId]
    );

    res.json(result.rows);
});

app.get('/cars/:reg', async (req, res) => {
    const { reg } = req.params;

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

    res.json(result.rows[0] || {});
});

app.patch('/cars/:reg', async (req, res) => {
    const { reg } = req.params;
    const fields = req.body;

    if (!fields || Object.keys(fields).length === 0)
        return res.json({ success: false });

        const allowed = [
            "make","model",
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
        values.push(fields[key]);
    }

    if (!updates.length)
        return res.json({ success: false });

    values.push(reg);

    try {
        await pool.query(
            `UPDATE cars SET ${updates.join(", ")} WHERE registration = $${i}`,
            values
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

// accept PUT as well as PATCH (re-use the same logic)
app.put('/cars/:reg', async (req, res) => {
  // forward to same logic as PATCH
  const { reg } = req.params;
  const fields = req.body;

  if (!fields || Object.keys(fields).length === 0)
    return res.json({ success: false });

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
    // convert empty string to null so DB gets NULL
    values.push(fields[key] === '' ? null : fields[key]);
  }

  if (!updates.length)
    return res.json({ success: false });

  values.push(reg);

  try {
        const result = await pool.query(
            `UPDATE cars SET ${updates.join(", ")} WHERE registration = $${i}`,
            values
        );
        console.log('PUT /cars update', { reg, updates, values, rowCount: result.rowCount });
        res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});


app.post("/cars", async (req, res) => {
  try {
    const car = req.body || {};

    // helper to coerce '' => null
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

        console.log('POST /cars inserted', { registration: car.registration, owner_id: car.owner_id });

        res.json({ success:true });
  } catch (err) {
    console.error("POST /cars error:", err);
    res.status(500).json({ success:false, error: err.message });
  }
});



export default app;
