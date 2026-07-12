import { NextRequest } from 'next/server';
import { getSession } from '@/modules/auth/utils';
import { withIdempotency } from '@/modules/core/idempotency';
import { BookingService } from '@/modules/bookings/services/booking.service';
import { successResponse, errorResponse } from '@/modules/core/api-response';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    
    return await withIdempotency(req, session.organizationId, session.userId, async () => {
      const body = await req.json();
      
      const result = await BookingService.createBooking(
        session.organizationId,
        session.userId,
        {
          resourceId: body.resourceId,
          startAt: body.startAt,
          endAt: body.endAt,
          purpose: body.purpose
        }
      );
      
      return successResponse(result, 'Resource booked (Soft Hold) successfully', 201);
    });
  } catch (error) {
    return errorResponse(error);
  }
}
