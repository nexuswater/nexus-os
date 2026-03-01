import { Router } from 'express';
import { MOCK_IMPACT } from '../mock/data.js';

export const impactRouter = Router();

/** GET /impact/totals — Get impact totals */
impactRouter.get('/totals', (_req, res) => {
  res.json({ success: true, data: MOCK_IMPACT });
});

/** GET /impact/breakdown — Get impact breakdown by region/tech/installer */
impactRouter.get('/breakdown', (_req, res) => {
  res.json({
    success: true,
    data: {
      by_region: [],
      by_technology: [],
      by_installer: [],
    },
  });
});
