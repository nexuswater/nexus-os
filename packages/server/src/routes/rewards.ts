/**
 * Rewards API stubs — GET /rewards/summary, POST /rewards/redeem, GET /rewards/receipts/:id
 */
import { Router } from 'express';

export const rewardsRouter = Router();

/** Rewards summary */
rewardsRouter.get('/summary', (_req, res) => {
  res.json({
    success: true,
    data: {
      totalCredits: 847,
      pendingVerification: 62,
      redeemableNow: 785,
      lifetimeRedeemed: 1240,
    },
  });
});

/** Redeem credits */
rewardsRouter.post('/redeem', (req, res) => {
  const { amount, destination_type } = req.body || {};

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_AMOUNT', message: 'Amount must be positive' },
    });
  }

  const receiptId = `REC-${Date.now().toString(36).toUpperCase()}`;

  res.json({
    success: true,
    data: {
      receiptId,
      amount,
      destination_type: destination_type || 'nexus-wallet',
      dollarValue: (amount * 0.15).toFixed(2),
      status: 'completed',
      timestamp: new Date().toISOString(),
    },
  });
});

/** Get specific receipt */
rewardsRouter.get('/receipts/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      receiptId: req.params.id,
      amount: 200,
      destination_type: 'nexus-wallet',
      dollarValue: '30.00',
      status: 'completed',
      timestamp: '2026-02-18T14:30:00Z',
      verifiedBy: 'Nexus Protocol',
    },
  });
});
