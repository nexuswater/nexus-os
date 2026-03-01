import { Router } from 'express';
import { MOCK_NOTIFICATIONS } from '../mock/data.js';

export const notificationsRouter = Router();

/** GET /notifications — List notifications */
notificationsRouter.get('/', (_req, res) => {
  res.json({ success: true, data: MOCK_NOTIFICATIONS });
});

/** POST /notifications/:id/read — Mark as read */
notificationsRouter.post('/:id/read', (_req, res) => {
  res.json({ success: true });
});
