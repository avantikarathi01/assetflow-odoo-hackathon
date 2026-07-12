import { NextRequest } from 'next/server';
import { getSession } from '@/modules/auth/utils';
import { withIdempotency } from '@/modules/core/idempotency';
import { AllocationService } from '@/modules/assets/services/allocation.service';
import { successResponse, errorResponse } from '@/modules/core/api-response';

export async function POST(req: NextRequest, { params }: { params: { assetId: string } }) {
  try {
    const session = await getSession(req);
    
    return await withIdempotency(req, session.organizationId, session.userId, async () => {
      const body = await req.json();
      
      const result = await AllocationService.allocateAsset(
        session.organizationId,
        params.assetId,
        session.userId,
        {
          allocatedToUserId: body.allocatedToUserId,
          expectedReturnAt: body.expectedReturnAt ? new Date(body.expectedReturnAt) : undefined
        }
      );
      
      return successResponse(result, 'Asset allocated successfully', 201);
    });
  } catch (error) {
    return errorResponse(error);
  }
}
