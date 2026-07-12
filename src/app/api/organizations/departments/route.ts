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
    const department = await LocationService.createDepartment(session!.organizationId, {
      name: data.name,
      code: data.code,
      locationId: data.locationId,
      managerId: data.managerId
    });
    
    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
