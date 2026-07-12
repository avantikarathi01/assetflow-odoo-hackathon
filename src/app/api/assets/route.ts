import { NextRequest, NextResponse } from 'next/server';
import { AssetService } from '@/modules/assets/services/asset.service';
import { getSession, requireManager } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    // Admins and Managers can create assets
    if (!requireManager(session)) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const data = await request.json();
    const asset = await AssetService.registerAsset(session!.organizationId, {
      ...data,
      createdById: session!.userId
    });
    
    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
