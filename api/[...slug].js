import serverless from 'serverless-http';
import app from '../local/server.js';

const handler = serverless(app);

export default async function(req, res) {
  // remove the /api prefix so Express routes (e.g. /cars) match
  if (req.url && req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
    // also normalize path if present
    if (req.path && req.path.startsWith('/api')) req.path = req.path.replace(/^\/api/, '') || '/';
  }

  return handler(req, res);
}
