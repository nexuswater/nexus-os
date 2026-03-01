import { Router } from 'express';
import { MOCK_LISTINGS, MOCK_MARKET_POLICY } from '../mock/data.js';

export const marketplaceRouter = Router();

/** GET /marketplace/listings — List marketplace listings */
marketplaceRouter.get('/listings', (_req, res) => {
  res.json({
    success: true,
    data: MOCK_LISTINGS,
  });
});

/** GET /marketplace/listings/:id — Get listing detail */
marketplaceRouter.get('/listings/:id', (req, res) => {
  const found = MOCK_LISTINGS.find((l) => l.listing_id === req.params.id);
  if (!found) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } });
    return;
  }
  res.json({ success: true, data: found });
});

/** POST /marketplace/listings — Create listing */
marketplaceRouter.post('/listings', (req, res) => {
  res.status(201).json({
    success: true,
    data: { listing_id: 'listing-' + Date.now(), ...req.body, status: 'active', created_at: new Date().toISOString() },
  });
});

/** GET /marketplace/listings/:id/preview — Trade preview */
marketplaceRouter.get('/listings/:id/preview', (req, res) => {
  res.json({
    success: true,
    data: {
      listing: null,
      you_pay: { amount: 0, currency: 'XRP' },
      you_receive: { type: 'nft' },
      fees: [],
      policy_checks: [],
      settlement_path: 'direct',
    },
  });
});

/** GET /marketplace/policy — Get market policy config */
marketplaceRouter.get('/policy', (_req, res) => {
  res.json({ success: true, data: MOCK_MARKET_POLICY });
});
