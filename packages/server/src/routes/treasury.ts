import { Router } from 'express';
import { MOCK_TREASURY } from '../mock/data.js';

export const treasuryRouter = Router();

/** GET /treasury — Get treasury overview */
treasuryRouter.get('/', (_req, res) => {
  res.json({ success: true, data: MOCK_TREASURY });
});

/** GET /treasury/actions — List treasury actions */
treasuryRouter.get('/actions', (_req, res) => {
  res.json({
    success: true,
    data: { data: [], total: 0, page: 1, per_page: 20, has_more: false },
  });
});
