import { Router } from 'express';
import { MOCK_DELEGATIONS, MOCK_DELEGATE_PROFILES, MOCK_WALLET } from '../mock/data.js';

export const delegationRouter = Router();

/** GET /delegation — Get delegations for an address */
delegationRouter.get('/', (req, res) => {
  const address = req.query.address as string || MOCK_WALLET.wallet_address;
  const delegations = MOCK_DELEGATIONS.filter(d => d.delegatorAddress === address);
  res.json({ success: true, data: delegations });
});

/** GET /delegation/incoming — Get delegations TO an address */
delegationRouter.get('/incoming', (req, res) => {
  const address = req.query.address as string || MOCK_WALLET.wallet_address;
  const delegations = MOCK_DELEGATIONS.filter(d => d.delegateAddress === address);
  res.json({ success: true, data: delegations });
});

/** GET /delegation/operators — Get operator profiles */
delegationRouter.get('/operators', (_req, res) => {
  res.json({ success: true, data: MOCK_DELEGATE_PROFILES });
});

/** POST /delegation/create — Create a new delegation */
delegationRouter.post('/create', (req, res) => {
  res.json({
    success: true,
    data: {
      tx_hash: `tx-delegate-${Date.now()}`,
      success: true,
      delegation_id: `del-${Date.now()}`,
    },
  });
});

/** POST /delegation/:id/revoke — Revoke a delegation */
delegationRouter.post('/:id/revoke', (req, res) => {
  res.json({
    success: true,
    data: {
      tx_hash: `tx-revoke-${Date.now()}`,
      success: true,
      delegation_id: req.params.id,
    },
  });
});
