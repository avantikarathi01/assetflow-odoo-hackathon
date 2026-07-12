import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { IdempotencyStatus } from '@prisma/client';
import crypto from 'crypto';
import { errorResponse } from './api-response';

export async function withIdempotency(req: NextRequest, organizationId: string, userId: string | null, handler: () => Promise<NextResponse>) {
  const idempotencyKey = req.headers.get('Idempotency-Key');
  if (!idempotencyKey) {
    // If no key is provided, bypass idempotency (or you could throw an error if strictly required)
    return handler();
  }

  const route = new URL(req.url).pathname;
  
  // Try to find an existing key
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { organizationId_key: { organizationId, key: idempotencyKey } }
  });

  if (existingKey) {
    if (existingKey.status === IdempotencyStatus.COMPLETED && existingKey.responseCode && existingKey.responseBody) {
      return NextResponse.json(existingKey.responseBody, { status: existingKey.responseCode });
    }
    
    if (existingKey.status === IdempotencyStatus.PROCESSING) {
      // Check if lockedUntil has passed (timeout recovery)
      if (existingKey.lockedUntil && new Date() > existingKey.lockedUntil) {
        // Proceed to re-execute, we'll overwrite it
      } else {
        return NextResponse.json({ success: false, error: { code: 'CONFLICT', message: 'Request is already processing' } }, { status: 409 });
      }
    }
  }

  // Calculate body hash (Optional: to ensure same payload)
  let requestHash = '';
  try {
    const clonedReq = req.clone();
    const text = await clonedReq.text();
    requestHash = crypto.createHash('sha256').update(text).digest('hex');
  } catch (e) {
    // Ignore body hash if request has no body
  }

  // Create or update the processing lock
  const lockedUntil = new Date(Date.now() + 5 * 60000); // 5 minute lock
  
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

  try {
    // Execute actual domain logic
    const response = await handler();
    
    // Save successful response
    const responseBody = await response.clone().json();
    await prisma.idempotencyKey.update({
      where: { organizationId_key: { organizationId, key: idempotencyKey } },
      data: {
        status: IdempotencyStatus.COMPLETED,
        responseCode: response.status,
        responseBody,
        lockedUntil: null
      }
    });

    return response;
  } catch (err: any) {
    // Save failed response
    const errRes = errorResponse(err);
    const errBody = await errRes.clone().json();
    
    await prisma.idempotencyKey.update({
      where: { organizationId_key: { organizationId, key: idempotencyKey } },
      data: {
        status: IdempotencyStatus.FAILED,
        responseCode: errRes.status,
        responseBody: errBody,
        lockedUntil: null
      }
    });

    return errRes;
  }
}
