import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/modules/organizations/location.service';
import { getSession, requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const data = await request.json();
    const location = await LocationService.createLocation(session!.organizationId, {
      name: data.name,
      type: data.type || 'OFFICE',
      address: data.address
    });
    
    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
