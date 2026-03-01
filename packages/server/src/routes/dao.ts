import { Router } from 'express';
import { MOCK_PROPOSALS, MOCK_GOVERNANCE_CONFIG } from '../mock/data.js';

export const daoRouter = Router();

/** GET /dao/proposals — List proposals */
daoRouter.get('/proposals', (_req, res) => {
  res.json({
    success: true,
    data: MOCK_PROPOSALS,
  });
});

/** GET /dao/proposals/:id — Get proposal detail */
daoRouter.get('/proposals/:id', (req, res) => {
  const found = MOCK_PROPOSALS.find((p) => p.proposal_id === req.params.id);
  if (!found) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Proposal not found' } });
    return;
  }
  res.json({ success: true, data: found });
});

/** POST /dao/proposals — Create proposal */
daoRouter.post('/proposals', (req, res) => {
  res.status(201).json({
    success: true,
    data: { proposal_id: 'prop-' + Date.now(), ...req.body, status: 'draft', created_at: new Date().toISOString() },
  });
});

/** POST /dao/proposals/:id/vote — Cast vote */
daoRouter.post('/proposals/:id/vote', (req, res) => {
  res.json({
    success: true,
    data: {
      vote_id: 'vote-' + Date.now(),
      proposal_id: req.params.id,
      voter_wallet: req.body.wallet,
      choice: req.body.choice,
      voting_power: 0,
      breakdown: {
        nxs_balance: 0,
        nxs_power: 0,
        wtr_active: 0,
        wtr_power: 0,
        eng_active: 0,
        eng_power: 0,
        nft_multiplier: 1,
        nft_multiplier_mode: 'highest_tier',
        total_voting_power: 0,
      },
      cast_at: new Date().toISOString(),
    },
  });
});

/** GET /dao/voting-power — Get voting power breakdown */
daoRouter.get('/voting-power', (_req, res) => {
  res.json({
    success: true,
    data: {
      nxs_balance: 0,
      nxs_power: 0,
      wtr_active: 0,
      wtr_power: 0,
      eng_active: 0,
      eng_power: 0,
      nft_multiplier: 1,
      nft_multiplier_mode: 'highest_tier',
      total_voting_power: 0,
    },
  });
});

/** GET /dao/config — Get governance config */
daoRouter.get('/config', (_req, res) => {
  res.json({ success: true, data: MOCK_GOVERNANCE_CONFIG });
});
