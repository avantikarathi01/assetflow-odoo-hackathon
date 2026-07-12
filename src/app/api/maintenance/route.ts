import { NextRequest } from 'next/server';
import { getSession } from '@/modules/auth/utils';
import { withIdempotency } from '@/modules/core/idempotency';
import { MaintenanceService } from '@/modules/maintenance/services/maintenance.service';
import { successResponse, errorResponse } from '@/modules/core/api-response';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    
    return await withIdempotency(req, session.organizationId, session.userId, async () => {
      const body = await req.json();
      
      const result = await MaintenanceService.raiseRequest(
        session.organizationId,
        session.userId,
        {
          assetId: body.assetId,
          issue: body.issue,
          priority: body.priority
        }
      );
      
      return successResponse(result, 'Maintenance request submitted successfully', 201);
    });
  } catch (error) {
    return errorResponse(error);
  }
}
