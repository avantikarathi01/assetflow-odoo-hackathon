import { prisma } from '../../../lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { AssetStatus, AllocationStatus, TransferStatus, AssetCondition } from '@prisma/client';
import { AvailabilityService } from '../../core/availability.service';
import { AssetService } from './asset.service';

export class AllocationService {
  /**
   * Allocates an asset to a user.
   * Enforces atomic constraints: An asset cannot be allocated if it's already active.
   */
  static async allocateAsset(organizationId: string, assetId: string, allocatedById: string, data: { allocatedToUserId: string, expectedReturnAt?: Date, issueNotes?: string }) {
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
          issueNotes: data.issueNotes,
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

      // Update asset status using state machine
      await AssetService.transitionAssetStatus(
        tx,
        organizationId,
        assetId,
        AssetStatus.ALLOCATED,
        allocatedById,
        `Asset allocated to user ${data.allocatedToUserId}`
      );

      // Logs specific to the allocation entity
      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: allocatedById,
          action: 'ALLOCATED',
          entityType: 'AssetAllocation',
          entityId: allocation.id,
          reason: `Asset allocation created: ${allocation.id}`
        }
      });

      return allocation;
    }, { timeout: 25000 });
  }

  /**
   * Returns an allocated asset to the available pool.
   */
  static async returnAsset(organizationId: string, allocationId: string, returnedById: string, data: { returnNotes?: string, condition?: AssetCondition }) {
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

      // 3. Update asset status and condition via state machine
      await AssetService.transitionAssetStatus(
        tx,
        organizationId,
        allocation.assetId,
        AssetStatus.AVAILABLE,
        returnedById,
        data.returnNotes || 'Asset returned',
        { conditionCheck: data.condition }
      );

      if (data.condition) {
        await tx.asset.update({
          where: { id: allocation.assetId },
          data: { condition: data.condition }
        });
      }

      return { success: true, message: 'Asset successfully returned' };
    }, { timeout: 25000 });
  }
}
