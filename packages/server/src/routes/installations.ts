import { Router } from 'express';
import { MOCK_INSTALLATIONS } from '../mock/data.js';

export const installationsRouter = Router();

/** GET /installations — List installations */
installationsRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: MOCK_INSTALLATIONS,
  });
});

/** GET /installations/:id — Get installation detail */
installationsRouter.get('/:id', (req, res) => {
  const found = MOCK_INSTALLATIONS.find((i) => i.installation_id === req.params.id);
  if (!found) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Installation not found' } });
    return;
  }
  res.json({ success: true, data: found });
});

/** POST /installations — Create installation */
installationsRouter.post('/', (req, res) => {
  // Stub: return the body with a generated ID
  res.status(201).json({
    success: true,
    data: { installation_id: 'inst-' + Date.now(), ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  });
});
