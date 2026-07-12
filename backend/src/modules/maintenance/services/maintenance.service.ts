import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { MaintenanceStatus, AssetStatus, MaintenancePriority } from '@prisma/client';
import { AvailabilityService } from '../../core/availability.service';

export class MaintenanceService {
  /**
   * Raises a maintenance request for an asset.
   */
  static async raiseRequest(organizationId: string, requestedById: string, data: { assetId: string, issue: string, priority?: MaintenancePriority }) {
    const asset = await prisma.asset.findFirst({
      where: { id: data.assetId, organizationId, deletedAt: null }
    });

    if (!asset) throw new NotFoundError('Asset not found');

    return prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.create({
        data: {
          organizationId,
          assetId: data.assetId,
          requestedById,
          issue: data.issue,
          priority: data.priority || MaintenancePriority.MEDIUM,
          status: MaintenanceStatus.PENDING,
        }
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: requestedById,
          action: 'CREATED',
          entityType: 'MaintenanceRequest',
          entityId: request.id,
          reason: `Maintenance requested: ${data.issue}`
        }
      });

      return request;
    });
  }

  /**
   * Approves a maintenance request and puts the physical asset into the UNDER_MAINTENANCE state.
   */
  static async approveRequest(organizationId: string, requestId: string, approvedById: string, data: { assignedTechnicianId?: string }) {
    const request = await prisma.maintenanceRequest.findFirst({
      where: { id: requestId, organizationId, status: MaintenanceStatus.PENDING }
    });

    if (!request) throw new NotFoundError('Pending maintenance request not found');

    const isClaimable = await AvailabilityService.isAssetClaimable(request.assetId, organizationId, 'maintenance');
    if (!isClaimable) {
      throw new ConflictError('Cannot approve maintenance. Asset is currently allocated or booked by a user.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Approve request
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status: MaintenanceStatus.APPROVED,
          approvedById,
          approvedAt: new Date(),
          assignedTechnicianId: data.assignedTechnicianId,
          assignedAt: data.assignedTechnicianId ? new Date() : null,
          version: { increment: 1 }
        }
      });

      // 2. Change Asset state to UNDER_MAINTENANCE
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: AssetStatus.UNDER_MAINTENANCE, version: { increment: 1 } }
      });

      // 3. Log History
      await tx.assetHistory.create({
        data: {
          organizationId,
          assetId: request.assetId,
          actorId: approvedById,
          action: 'STATUS_CHANGED',
          reason: `Asset moved to maintenance for request ${requestId}`,
          newState: { status: AssetStatus.UNDER_MAINTENANCE }
        }
      });

      return updatedRequest;
    });
  }

  /**
   * Resolves a maintenance request and returns the asset to the AVAILABLE state.
   */
  static async resolveRequest(organizationId: string, requestId: string, resolvedById: string, data: { resolutionNotes: string, cost?: number, currency?: string }) {
    const request = await prisma.maintenanceRequest.findFirst({
      where: { id: requestId, organizationId },
      include: { asset: true }
    });

    if (!request) throw new NotFoundError('Maintenance request not found');
    if (request.status === MaintenanceStatus.RESOLVED || request.status === MaintenanceStatus.CANCELLED) {
      throw new ValidationError(`Request is already ${request.status}`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Resolve request
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status: MaintenanceStatus.RESOLVED,
          resolvedAt: new Date(),
          resolutionNotes: data.resolutionNotes,
          cost: data.cost,
          currency: data.currency || request.currency,
          version: { increment: 1 }
        }
      });

      // 2. Return Asset to AVAILABLE (if it was under maintenance)
      if (request.asset.status === AssetStatus.UNDER_MAINTENANCE) {
        await tx.asset.update({
          where: { id: request.assetId },
          data: { status: AssetStatus.AVAILABLE, version: { increment: 1 } }
        });

        await tx.assetHistory.create({
          data: {
            organizationId,
            assetId: request.assetId,
            actorId: resolvedById,
            action: 'STATUS_CHANGED',
            reason: `Maintenance completed for request ${requestId}`,
            newState: { status: AssetStatus.AVAILABLE }
          }
        });
      }

      return updatedRequest;
    });
  }
}
