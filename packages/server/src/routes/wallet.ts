import { Router } from 'express';
import { MOCK_WALLET } from '../mock/data.js';

export const walletRouter = Router();

/** POST /wallet/nonce — Create auth nonce for signing */
walletRouter.post('/nonce', (_req, res) => {
  res.json({
    success: true,
    data: {
      nonce: 'stub-nonce-' + Date.now(),
      payload_uuid: 'stub-uuid-' + Date.now(),
    },
  });
});

/** POST /wallet/verify — Verify signed nonce */
walletRouter.post('/verify', (_req, res) => {
  res.json({
    success: true,
    data: {
      wallet: MOCK_WALLET,
      connected_via: 'xaman',
      session_token: 'stub-session-' + Date.now(),
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    },
  });
});

/** GET /wallet/:address — Get wallet profile */
walletRouter.get('/:address', (req, res) => {
  res.json({
    success: true,
    data: { ...MOCK_WALLET, wallet_address: req.params.address },
  });
});
