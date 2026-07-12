import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { TransferStatus, AssetStatus, AllocationStatus } from '@prisma/client';
import { AssetService } from './asset.service';
import { NotificationService } from '../../notifications/notification.service';

export class TransferService {
  /**
   * Initiates a transfer request. 
   * Can be a Custodian Transfer (targetUserId) or Location Transfer (targetLocationId/targetDepartmentId).
   */
  static async requestTransfer(organizationId: string, requestedById: string, data: { assetId: string, fromUserId?: string, targetUserId?: string, targetDepartmentId?: string, targetLocationId?: string, reason: string }) {
    if (!data.targetUserId && !data.targetDepartmentId && !data.targetLocationId) {
      throw new ValidationError('Transfer must specify at least one target (user, department, or location).');
    }

    const asset = await prisma.asset.findFirst({
      where: { id: data.assetId, organizationId, deletedAt: null },
      include: { activeAllocation: { include: { allocation: true } } }
    });

    if (!asset) throw new NotFoundError('Asset not found');

    if (data.fromUserId) {
      if (!asset.activeAllocation || asset.activeAllocation.allocation.allocatedToUserId !== data.fromUserId) {
        throw new ValidationError('Asset is not currently allocated to the specified user.');
      }
    }

    // Check if there's already a pending transfer
    const existingPending = await prisma.transferRequest.findFirst({
      where: { assetId: data.assetId, organizationId, status: TransferStatus.REQUESTED }
    });

    if (existingPending) {
      throw new ConflictError('A transfer request is already pending for this asset.');
    }

    return prisma.$transaction(async (tx) => {
      const transfer = await tx.transferRequest.create({
        data: {
          organizationId,
          assetId: data.assetId,
          requestedById,
          allocationId: asset.activeAllocation?.allocationId,
          targetUserId: data.targetUserId,
          targetDepartmentId: data.targetDepartmentId,
          targetLocationId: data.targetLocationId,
          reason: data.reason,
          status: TransferStatus.REQUESTED
        }
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: requestedById,
          action: 'REQUESTED',
          entityType: 'TransferRequest',
          entityId: transfer.id,
          reason: data.reason
        }
      });

      return transfer;
    });
  }

  /**
   * Approves a transfer request and executes the actual data mutation.
   */
  static async approveTransfer(organizationId: string, transferId: string, approvedById: string) {
    const transfer = await prisma.transferRequest.findFirst({
      where: { id: transferId, organizationId, status: TransferStatus.REQUESTED },
      include: { asset: { include: { activeAllocation: true } } }
    });

    if (!transfer) throw new NotFoundError('Pending transfer request not found');

    return prisma.$transaction(async (tx) => {
      // 1. Mark transfer as approved
      await tx.transferRequest.update({
        where: { id: transferId },
        data: { status: TransferStatus.COMPLETED, approvedById, approvedAt: new Date(), completedAt: new Date(), version: { increment: 1 } }
      });

      // 2. Execute Asset changes
      const assetUpdateData: any = { version: { increment: 1 } };
      if (transfer.targetDepartmentId) assetUpdateData.departmentId = transfer.targetDepartmentId;
      if (transfer.targetLocationId) assetUpdateData.locationId = transfer.targetLocationId;
      
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: assetUpdateData
      });

      // 3. Execute Custodian Transfer if applicable
      if (transfer.targetUserId) {
        // Return existing allocation if any
        if (transfer.allocationId) {
          await tx.assetAllocation.update({
            where: { id: transfer.allocationId },
            data: { status: AllocationStatus.RETURNED, returnedById: approvedById, returnedAt: new Date(), returnNotes: 'Auto-returned via Transfer Approval' }
          });
          
          await tx.activeAssetAllocation.delete({ where: { allocationId: transfer.allocationId } });
        }

        // Create new allocation
        const newAllocation = await tx.assetAllocation.create({
          data: {
            organizationId,
            assetId: transfer.assetId,
            allocatedToUserId: transfer.targetUserId,
            allocatedById: approvedById,
            status: AllocationStatus.ACTIVE
          }
        });

        await tx.activeAssetAllocation.create({
          data: { assetId: transfer.assetId, allocationId: newAllocation.id }
        });
        
        await AssetService.transitionAssetStatus(
          tx,
          organizationId,
          transfer.assetId,
          AssetStatus.ALLOCATED,
          approvedById,
          `Asset reallocated to ${transfer.targetUserId} via Transfer Approval`
        );
      }

      // 4. Logging
      await tx.assetHistory.create({
        data: {
          organizationId,
          assetId: transfer.assetId,
          actorId: approvedById,
          action: 'TRANSFERRED',
          reason: `Transfer request ${transferId} approved`,
          metadata: { transferId }
        }
      });

      await NotificationService.create(
        organizationId,
        transfer.requestedById,
        'TRANSFER',
        'SUCCESS',
        'Transfer Request Approved',
        `Your transfer request for asset ${transfer.assetId} has been approved.`,
        'TransferRequest',
        transferId
      );

      if (transfer.targetUserId) {
        await NotificationService.create(
          organizationId,
          transfer.targetUserId,
          'TRANSFER',
          'INFO',
          'Asset Transferred to You',
          `Asset ${transfer.assetId} has been transferred and allocated to you.`,
          'TransferRequest',
          transferId
        );
      }

      return { success: true };
    }, { timeout: 25000 });
  }

  /**
   * Rejects a transfer request.
   */
  static async rejectTransfer(organizationId: string, transferId: string, rejectedById: string, reason: string) {
    const transfer = await prisma.transferRequest.findFirst({
      where: { id: transferId, organizationId, status: TransferStatus.REQUESTED }
    });

    if (!transfer) throw new NotFoundError('Pending transfer request not found');

    return prisma.$transaction(async (tx) => {
      const updatedTransfer = await tx.transferRequest.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: reason,
          version: { increment: 1 }
        }
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: rejectedById,
          action: 'REJECTED',
          entityType: 'TransferRequest',
          entityId: transferId,
          reason: `Transfer request rejected: ${reason}`
        }
      });

      await NotificationService.create(
        organizationId,
        transfer.requestedById,
        'TRANSFER',
        'WARNING',
        'Transfer Request Rejected',
        `Your transfer request for asset ${transfer.assetId} was rejected. Reason: ${reason}`,
        'TransferRequest',
        transferId
      );

      return updatedTransfer;
    }, { timeout: 25000 });
  }
}
