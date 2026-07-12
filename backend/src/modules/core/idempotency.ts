import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/db/prisma';
import { IdempotencyStatus } from '@prisma/client';
import crypto from 'crypto';

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string;
  if (!idempotencyKey) {
    return next();
  }

  const organizationId = req.user?.organizationId;
  const userId = req.user?.userId || null;
  if (!organizationId) {
    return next();
  }

  const route = req.path;
  
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { organizationId_key: { organizationId, key: idempotencyKey } }
  });

  if (existingKey) {
    if (existingKey.status === IdempotencyStatus.COMPLETED && existingKey.responseCode && existingKey.responseBody) {
      return res.status(existingKey.responseCode).json(existingKey.responseBody);
    }
    
    if (existingKey.status === IdempotencyStatus.PROCESSING) {
      if (existingKey.lockedUntil && new Date() > existingKey.lockedUntil) {
        // Timeout recovery
      } else {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Request is already processing' } });
      }
    }
  }

  let requestHash = '';
  try {
    if (req.body) {
      requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    }
  } catch (e) {
    // Ignore body hash
  }

  const lockedUntil = new Date(Date.now() + 5 * 60000);
  
  await prisma.idempotencyKey.upsert({
    where: { organizationId_key: { organizationId, key: idempotencyKey } },
    update: { status: IdempotencyStatus.PROCESSING, lockedUntil, requestHash },
    create: {
      organizationId,
      userId,
      key: idempotencyKey,
      route,
      requestHash,
      lockedUntil,
      status: IdempotencyStatus.PROCESSING
    }
  });

  const originalJson = res.json.bind(res);
  
  res.json = (body: any) => {
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;
    
    prisma.idempotencyKey.update({
      where: { organizationId_key: { organizationId, key: idempotencyKey } },
      data: {
        status: isError ? IdempotencyStatus.FAILED : IdempotencyStatus.COMPLETED,
        responseCode: statusCode,
        responseBody: body as any,
        lockedUntil: null
      }
    }).catch(console.error);

    return originalJson(body);
  };

  next();
}
