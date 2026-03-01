import express from 'express';
import cors from 'cors';
import { router } from './routes/index.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nexus-api', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`[Nexus API] Server running on http://localhost:${PORT}`);
});

export default app;
