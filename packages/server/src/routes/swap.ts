import { Router } from 'express';
import {
  MOCK_SWAP_PAIRS,
  MOCK_BRIDGE_ROUTES,
  MOCK_MULTI_RAIL_WALLET,
  MOCK_CROSS_RAIL_CONFIG,
} from '../mock/data.js';

export const swapRouter = Router();

/** GET /swap/pairs — Available swap pairs */
swapRouter.get('/pairs', (_req, res) => {
  res.json({ success: true, data: MOCK_SWAP_PAIRS });
});

/** GET /swap/quote — Get a swap quote */
swapRouter.get('/quote', (req, res) => {
  const { from, to, amount } = req.query;
  const pair = MOCK_SWAP_PAIRS.find(
    (p) => p.from === from && p.to === to,
  ) ?? MOCK_SWAP_PAIRS.find(
    (p) => p.from === to && p.to === from,
  );

  if (!pair) {
    res.json({ success: false, error: { code: 'NO_ROUTE', message: 'No swap route available' } });
    return;
  }

  const inputAmount = Number(amount) || 0;
  const isForward = pair.from === from;
  const rate = isForward ? pair.rate : pair.inverse_rate;
  const outputAmount = inputAmount * rate;
  const feeAmount = inputAmount * (pair.fee_bps / 10000);

  res.json({
    success: true,
    data: {
      from_token: from,
      to_token: to,
      input_amount: inputAmount,
      output_amount: outputAmount,
      rate,
      fee_bps: pair.fee_bps,
      fee_amount: feeAmount,
      source: pair.source,
    },
  });
});

/** POST /swap/execute — Execute a swap */
swapRouter.post('/execute', (req, res) => {
  const { from_token, to_token, amount } = req.body;
  res.json({
    success: true,
    data: {
      from_token,
      to_token,
      input_amount: amount,
      tx_hash: `tx-swap-${Date.now()}`,
      timestamp: new Date().toISOString(),
    },
  });
});

/** GET /swap/bridge-routes — Cross-chain bridge routes */
swapRouter.get('/bridge-routes', (_req, res) => {
  res.json({ success: true, data: MOCK_BRIDGE_ROUTES });
});

/** POST /swap/bridge — Execute cross-chain bridge */
swapRouter.post('/bridge', (req, res) => {
  const { route_id, amount } = req.body;
  const route = MOCK_BRIDGE_ROUTES.find((r) => r.id === route_id);
  res.json({
    success: true,
    data: {
      route_id,
      amount,
      from_chain: route?.from_chain,
      to_chain: route?.to_chain,
      estimated_time_seconds: route?.estimated_time_seconds,
      tx_hash: `tx-bridge-${Date.now()}`,
      status: 'pending',
      timestamp: new Date().toISOString(),
    },
  });
});

/** GET /swap/wallet — Multi-rail wallet state */
swapRouter.get('/wallet', (_req, res) => {
  res.json({ success: true, data: MOCK_MULTI_RAIL_WALLET });
});

/** GET /swap/governance-config — Cross-rail governance config */
swapRouter.get('/governance-config', (_req, res) => {
  res.json({ success: true, data: MOCK_CROSS_RAIL_CONFIG });
});
