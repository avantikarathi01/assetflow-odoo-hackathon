import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { AuditCycleStatus, AuditRecordStatus, AssetStatus, MaintenancePriority } from '@prisma/client';
import { AssetService } from '../../assets/services/asset.service';
import { NotificationService } from '../../notifications/notification.service';

export class AuditService {
  /**
   * Creates an audit cycle and seeds it with all relevant assets.
   */
  static async createCycle(organizationId: string, createdById: string, data: { title: string, description?: string, departmentId?: string, plannedStartAt: string, plannedEndAt: string, assignedAuditorId?: string }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Cycle
      const cycle = await tx.auditCycle.create({
        data: {
          organizationId,
          title: data.title,
          description: data.description,
          departmentId: data.departmentId,
          plannedStartAt: new Date(data.plannedStartAt),
          plannedEndAt: new Date(data.plannedEndAt),
          createdById,
          assignedAuditorId: data.assignedAuditorId,
          status: AuditCycleStatus.OPEN
        }
      });

      // 2. Find all assets matching criteria (e.g., specific department)
      const assetFilter: any = { organizationId, deletedAt: null, status: { not: AssetStatus.RETIRED } };
      if (data.departmentId) {
        assetFilter.departmentId = data.departmentId;
      }

      const assets = await tx.asset.findMany({ where: assetFilter, select: { id: true } });

      // 3. Auto-generate pending audit records
      if (assets.length > 0) {
        const records = assets.map(a => ({
          auditCycleId: cycle.id,
          assetId: a.id,
          auditorId: data.assignedAuditorId || createdById,
          status: AuditRecordStatus.PENDING,
        }));
        
        await tx.auditRecord.createMany({ data: records });
      }

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: createdById,
          action: 'CREATED',
          entityType: 'AuditCycle',
          entityId: cycle.id,
          reason: `Audit cycle created with ${assets.length} targeted assets`
        }
      });

      return cycle;
    }, { timeout: 25000 });
  }

  /**
   * Logs a verification record for an asset during an audit cycle.
   */
  static async verifyAsset(organizationId: string, recordId: string, auditorId: string, data: { status: AuditRecordStatus, observedCondition?: any, observedLocation?: string, remarks?: string }) {
    const record = await prisma.auditRecord.findFirst({
      where: { id: recordId, auditorId },
      include: { auditCycle: true }
    });

    if (!record) throw new NotFoundError('Audit record not found or not assigned to you');
    if (record.auditCycle.organizationId !== organizationId) throw new NotFoundError('Audit record not found');
    if (record.auditCycle.status === AuditCycleStatus.CLOSED) {
      throw new ValidationError('Cannot modify a record in a closed audit cycle');
    }

    // Change status to IN_PROGRESS if this is the first verification
    if (record.auditCycle.status === AuditCycleStatus.OPEN) {
      await prisma.auditCycle.update({
        where: { id: record.auditCycleId },
        data: { status: AuditCycleStatus.IN_PROGRESS, startedAt: new Date() }
      });
    }

    return prisma.auditRecord.update({
      where: { id: recordId },
      data: {
        status: data.status,
        observedCondition: data.observedCondition,
        observedLocation: data.observedLocation,
        remarks: data.remarks,
        verifiedAt: new Date()
      }
    });
  }

  /**
   * Closes the cycle and structurally enforces the consequences (e.g. marking missing assets as LOST).
   */
  static async closeCycle(organizationId: string, cycleId: string, closedById: string, forceClose = false) {
    const cycle = await prisma.auditCycle.findFirst({
      where: { id: cycleId, organizationId },
      include: {
        records: {
          include: { asset: true }
        }
      }
    });

    if (!cycle) throw new NotFoundError('Audit cycle not found');
    if (cycle.status === AuditCycleStatus.CLOSED) throw new ValidationError('Cycle is already closed');

    const pendingRecords = cycle.records.filter(r => r.status === AuditRecordStatus.PENDING);
    if (pendingRecords.length > 0 && !forceClose) {
      const pendingAssetTags = pendingRecords.map(r => r.asset.assetTag).join(', ');
      throw new ValidationError(`Cannot close cycle. The following assets are still pending verification: ${pendingAssetTags}. Use forceClose=true to bypass.`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Close cycle
      await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: AuditCycleStatus.CLOSED, closedAt: new Date(), version: { increment: 1 } }
      });

      // 2. Process records
      for (const record of cycle.records) {
        if (record.status === AuditRecordStatus.MISSING) {
          await AssetService.transitionAssetStatus(
            tx,
            organizationId,
            record.assetId,
            AssetStatus.LOST,
            closedById,
            `Asset declared LOST during Audit Cycle closure (${cycleId})`
          );
        } else if (record.status === AuditRecordStatus.DAMAGED) {
          try {
            await AssetService.transitionAssetStatus(
              tx,
              organizationId,
              record.assetId,
              AssetStatus.UNDER_MAINTENANCE,
              closedById,
              `Asset declared DAMAGED during Audit Cycle closure (${cycleId})`
            );
          } catch (e) {
            // Ignore transitions that are disallowed due to other active allocations
          }

          // Create maintenance request
          await tx.maintenanceRequest.create({
            data: {
              organizationId,
              assetId: record.assetId,
              requestedById: closedById,
              issue: `Auto-created from Audit Cycle closure (${cycleId}). Condition observed: DAMAGED. Remarks: ${record.remarks || 'None'}`,
              priority: MaintenancePriority.HIGH,
              status: 'PENDING',
            }
          });
        }
      }

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: closedById,
          action: 'STATUS_CHANGED',
          entityType: 'AuditCycle',
          entityId: cycleId,
          reason: `Audit cycle closed. Force closed: ${forceClose}`
        }
      });

      // 3. Generate discrepancy report
      const discrepancies = cycle.records.filter(r => r.status !== AuditRecordStatus.VERIFIED);
      
      const report = [];
      for (const disc of discrepancies) {
        const logs = await tx.activityLog.findMany({
          where: { organizationId, entityType: 'Asset', entityId: disc.assetId },
          orderBy: { createdAt: 'desc' },
          take: 3
        });
        report.push({
          assetId: disc.assetId,
          assetTag: disc.asset.assetTag,
          assetName: disc.asset.name,
          observedStatus: disc.status,
          remarks: disc.remarks,
          verifiedAt: disc.verifiedAt,
          recentActivity: logs.map((l: any) => ({
            action: l.action,
            actorId: l.actorId,
            reason: l.reason,
            createdAt: l.createdAt
          }))
        });
      }

      if (discrepancies.length > 0) {
        await NotificationService.create(
          organizationId,
          closedById,
          'SYSTEM',
          'WARNING',
          'Audit Discrepancies Flagged',
          `Audit cycle ${cycleId} has been closed with ${discrepancies.length} discrepancies (missing or damaged assets).`,
          'AuditCycle',
          cycleId
        );
      }

      return {
        success: true,
        message: 'Audit Cycle closed successfully',
        discrepancyReport: report
      };
    }, { timeout: 25000 });
  }
}
