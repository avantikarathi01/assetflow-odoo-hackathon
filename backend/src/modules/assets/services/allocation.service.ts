import { prisma } from '../../../lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { AssetStatus, AllocationStatus, TransferStatus } from '@prisma/client';
import { AvailabilityService } from '../../core/availability.service';

export class AllocationService {
  /**
   * Allocates an asset to a user.
   * Enforces atomic constraints: An asset cannot be allocated if it's already active.
   */
  static async allocateAsset(organizationId: string, assetId: string, allocatedById: string, data: { allocatedToUserId: string, expectedReturnAt?: Date }) {
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, organizationId, deletedAt: null }
    });

    if (!asset) throw new NotFoundError('Asset not found');

    const isClaimable = await AvailabilityService.isAssetClaimable(assetId, organizationId, 'allocation');
    if (!isClaimable) {
      throw new ConflictError('Asset is currently claimed by another module, booked, or under maintenance.');
    }

    return prisma.$transaction(async (tx) => {
      // Create allocation record
      const allocation = await tx.assetAllocation.create({
        data: {
          organizationId,
          assetId,
          allocatedToUserId: data.allocatedToUserId,
          allocatedById,
          expectedReturnAt: data.expectedReturnAt,
          status: AllocationStatus.ACTIVE,
        }
      });

      // Attempt to create active lock (this will throw a database unique constraint error if it already exists, enforcing atomicity)
      try {
        await tx.activeAssetAllocation.create({
          data: {
            assetId,
            allocationId: allocation.id
          }
        });
      } catch (err: any) {
        if (err.code === 'P2002') { // Prisma unique constraint violation
          throw new ConflictError('Asset is already allocated concurrently.');
        }
        throw err;
      }

      // Update asset status
      await tx.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.ALLOCATED, version: { increment: 1 } }
      });

      // Logs
      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: allocatedById,
          action: 'ALLOCATED',
          entityType: 'AssetAllocation',
          entityId: allocation.id,
          reason: `Asset allocated to user ${data.allocatedToUserId}`
        }
      });

      await tx.assetHistory.create({
        data: {
          organizationId,
          assetId,
          actorId: allocatedById,
          action: 'ALLOCATED',
          metadata: { allocatedToUserId: data.allocatedToUserId, allocationId: allocation.id },
          reason: 'Standard allocation'
        }
      });

      return allocation;
    });
  }

  /**
   * Returns an allocated asset to the available pool.
   */
  static async returnAsset(organizationId: string, allocationId: string, returnedById: string, data: { returnNotes?: string, condition?: string }) {
    const allocation = await prisma.assetAllocation.findFirst({
      where: { id: allocationId, organizationId, status: AllocationStatus.ACTIVE },
      include: { asset: true }
    });

    if (!allocation) throw new NotFoundError('Active allocation not found');

    return prisma.$transaction(async (tx) => {
      // 1. Mark allocation as returned
      await tx.assetAllocation.update({
        where: { id: allocationId },
        data: {
          status: AllocationStatus.RETURNED,
          returnedById,
          returnedAt: new Date(),
          returnNotes: data.returnNotes
        }
      });

      // 2. Remove atomic lock
      await tx.activeAssetAllocation.delete({
        where: { allocationId }
      });

      // 3. Update asset status and condition
      const updateData: any = { status: AssetStatus.AVAILABLE, version: { increment: 1 } };
      if (data.condition) {
        updateData.condition = data.condition;
      }

      await tx.asset.update({
        where: { id: allocation.assetId },
        data: updateData
      });

      // 4. Logs
      await tx.assetHistory.create({
        data: {
          organizationId,
          assetId: allocation.assetId,
          actorId: returnedById,
          action: 'RETURNED',
          reason: data.returnNotes || 'Asset returned',
          metadata: { conditionCheck: data.condition }
        }
      });

      return { success: true, message: 'Asset successfully returned' };
    });
  }
}
