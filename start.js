import 'dotenv/config';
import app from './local/server.js';

const port = process.env.PORT || 3001;
app.listen(port, () => {
	console.log(`AI server running: http://localhost:${port}`);
});
