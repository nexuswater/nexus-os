import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@nexus/shared';

/** Role-based access control middleware (stub) */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Look up wallet roles from database
    const userRoles: UserRole[] = (req as any).roles ?? ['user'];

    const hasRequired = roles.some((r) => userRoles.includes(r));
    if (!hasRequired) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Requires one of: ${roles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}
