import pool from '../local/db.js';
import englishToSQL from '../local/ai.js';
import validateSQL from '../local/validatesql.js';
import respond from '../local/respond.js';
import routeMessage from '../local/router.js';
import chatResponse from '../local/chat.js';

const conversations = new Map();

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { question, sessionId } = req.body || {};

    if (!sessionId) return res.status(400).json({ error: 'missing sessionId' });

    if (!conversations.has(sessionId)) conversations.set(sessionId, []);
    const history = conversations.get(sessionId);

    console.log('API /ask QUESTION:', question);

    const intent = await routeMessage(question, history);
    console.log('API /ask INTENT:', intent);

    if (intent === 'CHAT') {
      const answer = await chatResponse(question, history);
      history.push({ role: 'user', content: question });
      history.push({ role: 'assistant', content: answer });
      return res.json({ answer });
    }

    // QUERY mode
    let sql = await englishToSQL(question, history);
    sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();
    console.log('API /ask RAW SQL:', sql);

    sql = validateSQL(sql, question);
    console.log('API /ask VALID SQL:', sql);

    const impossible = /owners\.name.*=.*umar ali/i.test(sql) && /owners\.name.*!=.*umar ali/i.test(sql);
    if (impossible) return res.json({ answer: 'That question contradicts itself.' });

    let result;
    try {
      result = await pool.query(sql);
    } catch (dbErr) {
      console.error('API /ask DB ERROR:', dbErr.message);
      const fail = "I couldn't understand that request. Try asking in a different way.";
      history.push({ role: 'user', content: question });
      history.push({ role: 'assistant', content: fail });
      return res.json({ answer: fail });
    }

    console.log('API /ask DB RESULT rows:', result.rows.length);

    const answer = await respond(question, sql, result.rows, history);
    history.push({ role: 'user', content: question });
    history.push({ role: 'assistant', content: answer });

    return res.json({ answer });
  } catch (err) {
    console.error('API /ask ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
}
