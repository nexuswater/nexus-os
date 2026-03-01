import { Router } from 'express';
import {
  MOCK_YIELD_MARKETS,
  MOCK_YIELD_POSITIONS,
  MOCK_TOKEN_REGISTRY,
} from '../mock/data.js';

export const yieldRouter = Router();

/** GET /yield/markets — All yield markets */
yieldRouter.get('/markets', (_req, res) => {
  res.json({ success: true, data: MOCK_YIELD_MARKETS });
});

/** GET /yield/positions — User's yield positions */
yieldRouter.get('/positions', (_req, res) => {
  res.json({ success: true, data: MOCK_YIELD_POSITIONS });
});

/** GET /yield/registry — Token registry */
yieldRouter.get('/registry', (_req, res) => {
  res.json({ success: true, data: MOCK_TOKEN_REGISTRY });
});

/** POST /yield/supply — Supply tokens to a market */
yieldRouter.post('/supply', (req, res) => {
  const { token, amount, batch_id } = req.body;
  res.json({
    success: true,
    data: {
      action: 'supply',
      token,
      amount,
      batch_id,
      tx_hash: `tx-yield-supply-${Date.now()}`,
      timestamp: new Date().toISOString(),
    },
  });
});

/** POST /yield/withdraw — Withdraw tokens from a market */
yieldRouter.post('/withdraw', (req, res) => {
  const { token, amount } = req.body;
  res.json({
    success: true,
    data: {
      action: 'withdraw',
      token,
      amount,
      tx_hash: `tx-yield-withdraw-${Date.now()}`,
      timestamp: new Date().toISOString(),
    },
  });
});

/** POST /yield/borrow — Borrow tokens */
yieldRouter.post('/borrow', (req, res) => {
  const { token, amount } = req.body;
  res.json({
    success: true,
    data: {
      action: 'borrow',
      token,
      amount,
      tx_hash: `tx-yield-borrow-${Date.now()}`,
      timestamp: new Date().toISOString(),
    },
  });
});

/** POST /yield/repay — Repay borrowed tokens */
yieldRouter.post('/repay', (req, res) => {
  const { token, amount } = req.body;
  res.json({
    success: true,
    data: {
      action: 'repay',
      token,
      amount,
      tx_hash: `tx-yield-repay-${Date.now()}`,
      timestamp: new Date().toISOString(),
    },
  });
});
