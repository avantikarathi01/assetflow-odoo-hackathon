import { NextRequest, NextResponse } from 'next/server';
import { TransferService } from '@/modules/assets/services/transfer.service';
import { getSession, requireManager } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { transferId: string } }) {
  try {
    const session = getSession(request);
    if (!requireManager(session)) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { transferId } = params;
    
    // We don't read body because only the manager ID is needed to approve
    const transfer = await TransferService.approveTransfer(session!.organizationId, transferId, session!.userId);
    
    return NextResponse.json(transfer, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
