import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/modules/reports/services/dashboard.service';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const kpis = await DashboardService.getKPIs(session.organizationId);
    
    return NextResponse.json(kpis, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
