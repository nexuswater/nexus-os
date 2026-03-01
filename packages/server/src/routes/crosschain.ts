import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { RouteEngine } from '../settlement/engine/RouteEngine.js';
import { Orchestrator } from '../settlement/engine/Orchestrator.js';
import type { CrossChainIntent, Route } from '@nexus/shared';

export const crosschainRouter = Router();

const routeEngine = new RouteEngine();
const orchestrator = new Orchestrator();

// Store intents and routes in-memory for lookup
const intents = new Map<string, CrossChainIntent>();
const quotedRoutes = new Map<string, Route[]>();

/**
 * POST /api/crosschain/quote
 * Body: { fromChain, toChain, fromToken, toToken, amount, sender?, maxSlippageBps? }
 * Returns: CrossChainQuote with ranked routes
 */
crosschainRouter.post('/quote', async (req, res) => {
  try {
    const { fromChain, toChain, fromToken, toToken, amount, sender, maxSlippageBps } = req.body;

    const intent: CrossChainIntent = {
      id: uuid(),
      fromChain: fromChain ?? 'XRPL',
      toChain: toChain ?? 'BASE',
      fromToken: fromToken ?? 'NXS',
      toToken: toToken ?? 'USDC',
      amount: Number(amount) || 100,
      sender: sender ?? 'rMockSender123',
      maxSlippageBps: maxSlippageBps ?? 50,
      idempotencyKey: uuid(),
      createdAt: new Date().toISOString(),
    };

    intents.set(intent.id, intent);

    const quote = await routeEngine.generateQuote(intent);
    quotedRoutes.set(intent.id, quote.routes);

    res.json({ data: quote });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'Quote generation failed' });
  }
});

/**
 * POST /api/crosschain/execute
 * Body: { intentId, routeId }
 * Returns: initial SagaState
 */
crosschainRouter.post('/execute', async (req, res) => {
  try {
    const { intentId, routeId } = req.body;

    const intent = intents.get(intentId);
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found. Generate a quote first.' });
    }

    const routes = quotedRoutes.get(intentId);
    const route = routes?.find(r => r.id === routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route not found in quoted routes.' });
    }

    const state = await orchestrator.execute(intent, route);
    res.json({ data: state });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'Execution failed' });
  }
});

/**
 * GET /api/crosschain/status/:intentId
 * Returns: current SagaState (poll every 2s)
 */
crosschainRouter.get('/status/:intentId', (req, res) => {
  const state = orchestrator.getStatus(req.params.intentId);
  if (!state) {
    return res.status(404).json({ error: 'No saga found for this intent.' });
  }
  res.json({ data: state });
});

/**
 * GET /api/crosschain/receipt/:intentId
 * Returns: CrossChainReceipt (completed only)
 */
crosschainRouter.get('/receipt/:intentId', (req, res) => {
  const receipt = orchestrator.getReceipt(req.params.intentId);
  if (!receipt) {
    return res.status(404).json({ error: 'No receipt yet. Saga may still be executing.' });
  }
  res.json({ data: receipt });
});
