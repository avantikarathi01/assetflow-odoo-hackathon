import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../lib/db/prisma';

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

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/auth/register' || req.path === '/api/auth/login') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    let roles = payload.roles;
    if (!roles) {
      const userRoles = await prisma.userRole.findMany({
        where: { userId: payload.userId },
        include: { role: true }
      });
      roles = userRoles.map(ur => ur.role.name);
    }
    
    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      roles: roles
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Missing session context' });
    }
    
    const hasRole = req.user.roles?.some(r => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: `Forbidden: Scoped role access required (Allowed: ${allowedRoles.join(', ')})` });
    }
    
    next();
  };
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

export async function requireTransferApprovalAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing session context' });
  }

  if (req.user.roles.includes('ADMIN') || req.user.roles.includes('MANAGER')) {
    return next();
  }

  const transferId = req.params.transferId as string;
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: transferId },
    include: { asset: true }
  });

  if (!transfer) {
    return res.status(404).json({ error: 'Transfer request not found' });
  }

  const department = await prisma.department.findUnique({
    where: { id: transfer.asset.departmentId }
  });

  if (department && department.headUserId === req.user.userId) {
    return next();
  }

  if (transfer.targetDepartmentId) {
    const targetDept = await prisma.department.findUnique({
      where: { id: transfer.targetDepartmentId }
    });
    if (targetDept && targetDept.headUserId === req.user.userId) {
      return next();
    }
  }

  return res.status(403).json({ error: 'Forbidden: You must be an Asset Manager or the Department Head to approve this transfer' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }
  next();
}
