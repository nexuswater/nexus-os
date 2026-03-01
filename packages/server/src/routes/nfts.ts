import { Router } from 'express';
import { MOCK_NFTS } from '../mock/data.js';

export const nftsRouter = Router();

/** GET /nfts — List NFTs for a wallet */
nftsRouter.get('/', (_req, res) => {
  res.json({ success: true, data: MOCK_NFTS });
});

/** GET /nfts/:id — Get NFT detail */
nftsRouter.get('/:id', (req, res) => {
  const found = MOCK_NFTS.find((n) => n.nft_id === req.params.id);
  if (!found) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'NFT not found' } });
    return;
  }
  res.json({ success: true, data: found });
});
