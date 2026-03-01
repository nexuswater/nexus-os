import { Router } from 'express';
import { MOCK_PROOFS } from '../mock/data.js';

export const proofsRouter = Router();

/** GET /proofs — List proofs with optional status filter */
proofsRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: MOCK_PROOFS,
  });
});

/** GET /proofs/:id — Get proof detail */
proofsRouter.get('/:id', (req, res) => {
  const found = MOCK_PROOFS.find((p) => p.proof_id === req.params.id);
  if (!found) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Proof not found' } });
    return;
  }
  res.json({ success: true, data: found });
});

/** POST /proofs — Submit proof package */
proofsRouter.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    data: { proof_id: 'proof-' + Date.now(), ...req.body, status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  });
});

/** POST /proofs/:id/review — Approve/reject proof */
proofsRouter.post('/:id/review', (req, res) => {
  res.json({
    success: true,
    data: { proof_id: req.params.id, status: req.body.approved ? 'approved' : 'rejected', updated_at: new Date().toISOString() },
  });
});
