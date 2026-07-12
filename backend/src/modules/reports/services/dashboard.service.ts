import { prisma } from '@/lib/db/prisma';
import { AssetStatus, AllocationStatus, MaintenanceStatus, BookingStatus } from '@prisma/client';

export class DashboardService {
  /**
   * Generates real-time aggregate KPIs for the dashboard.
   */
  static async getKPIs(organizationId: string) {
    const now = new Date();

    const [
      totalAssets,
      availableAssets,
      allocatedAssets,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      overdueReturns
    ] = await Promise.all([
      // 1. Total active assets
      prisma.asset.count({ where: { organizationId, deletedAt: null } }),
      
      // 2. Available
      prisma.asset.count({ where: { organizationId, status: AssetStatus.AVAILABLE, deletedAt: null } }),
      
      // 3. Allocated
      prisma.asset.count({ where: { organizationId, status: AssetStatus.ALLOCATED, deletedAt: null } }),
      
      // 4. Maintenance Today (Currently Under Maintenance or pending today)
      prisma.maintenanceRequest.count({
        where: {
          organizationId,
          status: { in: [MaintenanceStatus.PENDING, MaintenanceStatus.APPROVED, MaintenanceStatus.IN_REPAIR, MaintenanceStatus.ASSIGNED] }
        }
      }),

      // 5. Active Bookings right now
      prisma.resourceBooking.count({
        where: {
          organizationId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          startAt: { lte: now },
          endAt: { gte: now }
        }
      }),

      // 6. Pending Transfers
      prisma.transferRequest.count({
        where: { organizationId, status: 'REQUESTED' }
      }),

      // 7. Overdue Returns
      prisma.assetAllocation.count({
        where: {
          organizationId,
          status: AllocationStatus.ACTIVE,
          expectedReturnAt: { lt: now }
        }
      })
    ]);

    return {
      totalAssets,
      availableAssets,
      allocatedAssets,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      overdueReturns
    };
  }

  /**
   * Asset Utilization Report
   */
  static async getUtilizationReport(organizationId: string) {
    // Group allocations by asset to see most used
    const allocations = await prisma.assetAllocation.groupBy({
      by: ['assetId'],
      where: { organizationId },
      _count: { assetId: true },
      orderBy: { _count: { assetId: 'desc' } },
      take: 10
    });

    // We fetch the asset details for these top 10
    const assetIds = allocations.map(a => a.assetId);
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, name: true, assetTag: true }
    });

    const mostUsed = allocations.map(a => {
      const asset = assets.find(as => as.id === a.assetId);
      return {
        assetId: a.assetId,
        name: asset?.name,
        tag: asset?.assetTag,
        allocationCount: a._count.assetId
      };
    });

    return { mostUsed };
  }
}
