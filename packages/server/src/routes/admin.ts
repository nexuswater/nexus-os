import { Router } from 'express';
import { MOCK_AUDIT_LOG, MOCK_ALLOWLIST } from '../mock/data.js';

export const adminRouter = Router();

/** GET /admin/audit-log — Get audit log entries */
adminRouter.get('/audit-log', (_req, res) => {
  const sorted = [...MOCK_AUDIT_LOG].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  res.json({
    success: true,
    data: sorted,
  });
});

/** GET /admin/allowlist — Get market allowlist */
adminRouter.get('/allowlist', (_req, res) => {
  res.json({ success: true, data: { participants: MOCK_ALLOWLIST, assets: [] } });
});

/** POST /admin/allowlist/participants — Add participant */
adminRouter.post('/allowlist/participants', (req, res) => {
  res.json({ success: true, data: { wallet: req.body.wallet, added_at: new Date().toISOString() } });
});

/** DELETE /admin/allowlist/participants/:wallet — Remove participant */
adminRouter.delete('/allowlist/participants/:wallet', (req, res) => {
  res.json({ success: true, data: { wallet: req.params.wallet, removed_at: new Date().toISOString() } });
});

/** POST /admin/emergency/pause-minting — Emergency pause minting */
adminRouter.post('/emergency/pause-minting', (_req, res) => {
  res.json({ success: true, data: { action: 'pause_minting', activated: true, timestamp: new Date().toISOString() } });
});

/** POST /admin/emergency/pause-marketplace — Emergency pause marketplace */
adminRouter.post('/emergency/pause-marketplace', (_req, res) => {
  res.json({ success: true, data: { action: 'pause_marketplace', activated: true, timestamp: new Date().toISOString() } });
});

/** POST /admin/emergency/rotate-oracle-keys — Rotate oracle keys */
adminRouter.post('/emergency/rotate-oracle-keys', (_req, res) => {
  res.json({ success: true, data: { action: 'rotate_oracle_keys', activated: true, timestamp: new Date().toISOString() } });
});
