import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../core/errors';
import { AssetStatus, AssetCondition, AssetCriticality, DepreciationMethod } from '@prisma/client';

export class AssetService {
  static async registerAsset(organizationId: string, createdById: string, data: any) {
    // Validate uniqueness of assetTag and serialNumber
    const existingAssetTag = await prisma.asset.findFirst({
      where: { organizationId, assetTag: data.assetTag, deletedAt: null }
    });
    if (existingAssetTag) throw new ConflictError('Asset tag is already in use');

    const existingSerial = await prisma.asset.findFirst({
      where: { organizationId, serialNumber: data.serialNumber, deletedAt: null }
    });
    if (existingSerial) throw new ConflictError('Serial number is already in use');

    return prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          organizationId,
          createdById,
          assetTag: data.assetTag,
          serialNumber: data.serialNumber,
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          departmentId: data.departmentId,
          locationId: data.locationId,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          purchaseCost: data.purchaseCost,
          salvageValue: data.salvageValue,
          currency: data.currency || 'USD',
          depreciationMethod: data.depreciationMethod || DepreciationMethod.STRAIGHT_LINE,
          warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
          condition: data.condition || AssetCondition.NEW,
          criticality: data.criticality || AssetCriticality.MEDIUM,
          status: AssetStatus.AVAILABLE,
          isAllocatable: true,
        }
      });

      // Log creation
      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: createdById,
          action: 'CREATED',
          entityType: 'Asset',
          entityId: asset.id,
          newState: asset as any,
          reason: 'Initial asset registration',
        }
      });

      await tx.assetHistory.create({
        data: {
          organizationId,
          assetId: asset.id,
          actorId: createdById,
          action: 'CREATED',
          newState: asset as any,
          reason: 'Asset registered',
        }
      });

      return asset;
    });
  }

  static async getAssetDetails(organizationId: string, assetId: string) {
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, organizationId, deletedAt: null },
      include: {
        category: true,
        department: true,
        location: true,
        files: { where: { deletedAt: null } },
        activeAllocation: {
          include: { allocation: { include: { allocatedTo: true } } }
        }
      }
    });

    if (!asset) throw new NotFoundError('Asset not found');
    return asset;
  }

  static async updateAsset(organizationId: string, assetId: string, updatedById: string, data: any) {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, organizationId, deletedAt: null } });
    if (!asset) throw new NotFoundError('Asset not found');

    // Optimistic concurrency control
    if (data.version && data.version !== asset.version) {
      throw new ConflictError('Asset has been modified by another user. Please refresh and try again.');
    }

    return prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: {
          name: data.name,
          description: data.description,
          condition: data.condition,
          criticality: data.criticality,
          locationId: data.locationId,
          departmentId: data.departmentId,
          version: { increment: 1 }
        }
      });

      await tx.assetHistory.create({
        data: {
          organizationId,
          assetId,
          actorId: updatedById,
          action: 'UPDATED',
          previousState: asset as any,
          newState: updatedAsset as any,
          reason: data.updateReason || 'Standard update',
        }
      });

      return updatedAsset;
    });
  }

  static async softDeleteAsset(organizationId: string, assetId: string, deletedById: string, reason: string) {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, organizationId, deletedAt: null } });
    if (!asset) throw new NotFoundError('Asset not found');

    if (asset.status === AssetStatus.ALLOCATED) {
      throw new ValidationError('Cannot delete an allocated asset. Return it first.');
    }

    return prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: assetId },
        data: { deletedAt: new Date(), status: AssetStatus.RETIRED }
      });

      await tx.assetHistory.create({
        data: {
          organizationId,
          assetId,
          actorId: deletedById,
          action: 'DELETED',
          reason,
        }
      });
    });
  }
}
