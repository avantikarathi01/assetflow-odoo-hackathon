import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { AuditCycleStatus, AuditRecordStatus, AssetStatus } from '@prisma/client';

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
    });
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
  static async closeCycle(organizationId: string, cycleId: string, closedById: string) {
    const cycle = await prisma.auditCycle.findFirst({
      where: { id: cycleId, organizationId },
      include: { records: true }
    });

    if (!cycle) throw new NotFoundError('Audit cycle not found');
    if (cycle.status === AuditCycleStatus.CLOSED) throw new ValidationError('Cycle is already closed');

    const pendingRecords = cycle.records.filter(r => r.status === AuditRecordStatus.PENDING);
    if (pendingRecords.length > 0) {
      throw new ValidationError(`Cannot close cycle. ${pendingRecords.length} assets are still pending verification.`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Close cycle
      await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: AuditCycleStatus.CLOSED, closedAt: new Date(), version: { increment: 1 } }
      });

      // 2. Identify missing assets and update their real status
      const missingRecords = cycle.records.filter(r => r.status === AuditRecordStatus.MISSING);
      
      for (const record of missingRecords) {
        await tx.asset.update({
          where: { id: record.assetId },
          data: { status: AssetStatus.LOST, version: { increment: 1 } }
        });

        await tx.assetHistory.create({
          data: {
            organizationId,
            assetId: record.assetId,
            actorId: closedById,
            action: 'STATUS_CHANGED',
            reason: `Asset declared LOST during Audit Cycle closure (${cycleId})`,
            newState: { status: AssetStatus.LOST }
          }
        });
      }

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: closedById,
          action: 'STATUS_CHANGED',
          entityType: 'AuditCycle',
          entityId: cycleId,
          reason: `Audit cycle closed. ${missingRecords.length} assets marked as lost.`
        }
      });

      return { success: true, missingAssetsMarkedLost: missingRecords.length };
    });
  }
}
