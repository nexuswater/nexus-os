import { Router } from 'express';
import { MOCK_BATCHES } from '../mock/data.js';

export const batchesRouter = Router();

/** GET /batches — List batches for a wallet */
batchesRouter.get('/', (_req, res) => {
  res.json({ success: true, data: MOCK_BATCHES });
});

/** GET /batches/summary — Weighted batch summary */
batchesRouter.get('/summary', (_req, res) => {
  res.json({ success: true, data: [] });
});

/** GET /batches/:id — Get batch detail */
batchesRouter.get('/:id', (req, res) => {
  const found = MOCK_BATCHES.find((b) => b.batch_id === req.params.id);
  if (!found) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } });
    return;
  }
  res.json({ success: true, data: found });
});

/** POST /batches — Create (mint) a new batch */
batchesRouter.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    data: { batch_id: 'batch-' + Date.now(), ...req.body, created_at: new Date().toISOString() },
  });
});
