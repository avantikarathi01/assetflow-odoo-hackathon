import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';

export interface UserSession {
  userId: string;
  organizationId: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Public routes
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserSession;
    req.user = payload;

    // RBAC: Example protecting /api/admin paths
    if (req.path.startsWith('/api/admin/')) {
      if (!req.user.roles?.includes('ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.roles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

export function requireManager(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('MANAGER'))) {
    return res.status(403).json({ error: 'Forbidden: Manager access required' });
  }
  next();
}
