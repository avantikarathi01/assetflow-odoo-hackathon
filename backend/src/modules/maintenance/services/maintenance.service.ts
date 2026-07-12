import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { MaintenanceStatus, AssetStatus, MaintenancePriority } from '@prisma/client';
import { AvailabilityService } from '../../core/availability.service';
import { AssetService } from '../../assets/services/asset.service';
import { NotificationService } from '../../notifications/notification.service';

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
    }, { timeout: 25000 });
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

      await AssetService.transitionAssetStatus(
        tx,
        organizationId,
        request.assetId,
        AssetStatus.UNDER_MAINTENANCE,
        approvedById,
        `Asset moved to maintenance for request ${requestId}`
      );

      await NotificationService.create(
        organizationId,
        request.requestedById,
        'MAINTENANCE',
        'SUCCESS',
        'Maintenance Request Approved',
        `Your maintenance request for asset ${request.assetId} has been approved.`,
        'MaintenanceRequest',
        requestId
      );

      return updatedRequest;
    }, { timeout: 25000 });
  }

  /**
   * Rejects a maintenance request.
   */
  static async rejectRequest(organizationId: string, requestId: string, actorId: string, data: { reason: string }) {
    const request = await prisma.maintenanceRequest.findFirst({
      where: { id: requestId, organizationId, status: MaintenanceStatus.PENDING }
    });

    if (!request) throw new NotFoundError('Pending maintenance request not found');

    return prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status: MaintenanceStatus.REJECTED,
          rejectedAt: new Date(),
          resolutionNotes: data.reason,
          version: { increment: 1 }
        }
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: 'REJECTED',
          entityType: 'MaintenanceRequest',
          entityId: requestId,
          reason: `Maintenance request rejected: ${data.reason}`
        }
      });

      await NotificationService.create(
        organizationId,
        request.requestedById,
        'MAINTENANCE',
        'WARNING',
        'Maintenance Request Rejected',
        `Your maintenance request for asset ${request.assetId} was rejected. Reason: ${data.reason}`,
        'MaintenanceRequest',
        requestId
      );

      return updatedRequest;
    }, { timeout: 25000 });
  }

  /**
   * Assigns a technician to the maintenance request.
   */
  static async assignTechnician(organizationId: string, requestId: string, technicianId: string, actorId: string) {
    const request = await prisma.maintenanceRequest.findFirst({
      where: { id: requestId, organizationId }
    });

    if (!request) throw new NotFoundError('Maintenance request not found');

    return prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status: MaintenanceStatus.ASSIGNED,
          assignedTechnicianId: technicianId,
          assignedAt: new Date(),
          version: { increment: 1 }
        }
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: 'UPDATED',
          entityType: 'MaintenanceRequest',
          entityId: requestId,
          reason: `Assigned technician ${technicianId}`
        }
      });

      return updatedRequest;
    }, { timeout: 25000 });
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

      if (request.asset.status === AssetStatus.UNDER_MAINTENANCE) {
        await AssetService.transitionAssetStatus(
          tx,
          organizationId,
          request.assetId,
          AssetStatus.AVAILABLE,
          resolvedById,
          `Maintenance completed for request ${requestId}`
        );
      }

      return updatedRequest;
    }, { timeout: 25000 });
  }
}
