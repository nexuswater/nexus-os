import type { Request, Response, NextFunction } from 'express';

/** Wallet-based session authentication middleware (stub) */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    return;
  }

  // TODO: Verify session token against database
  // For now, accept any token and inject a stub wallet address
  (req as any).wallet_address = 'rStubWalletAddress123';
  (req as any).session_token = token;

  next();
}
