import { prisma } from '@/lib/db/prisma';
import { AssetStatus, AllocationStatus, MaintenanceStatus, BookingStatus, TransferStatus, AuditCycleStatus } from '@prisma/client';

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

  static async getUpcomingEvents(organizationId: string) {
    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 30);

    const [bookings, maintenance, returns, transfers, audits] = await Promise.all([
      prisma.resourceBooking.findMany({
        where: {
          organizationId,
          status: { in: [BookingStatus.HELD, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          startAt: { gte: now, lte: windowEnd },
        },
        include: { resource: true },
        orderBy: { startAt: 'asc' },
        take: 12,
      }),
      prisma.maintenanceRequest.findMany({
        where: {
          organizationId,
          status: { in: [MaintenanceStatus.PENDING, MaintenanceStatus.APPROVED, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_REPAIR] },
          createdAt: { gte: now, lte: windowEnd },
        },
        include: { asset: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
      prisma.assetAllocation.findMany({
        where: {
          organizationId,
          status: AllocationStatus.ACTIVE,
          expectedReturnAt: { gte: now, lte: windowEnd },
        },
        include: { asset: true, allocatedTo: true },
        orderBy: { expectedReturnAt: 'asc' },
        take: 10,
      }),
      prisma.transferRequest.findMany({
        where: {
          organizationId,
          status: TransferStatus.REQUESTED,
          requestedAt: { gte: now, lte: windowEnd },
        },
        include: { asset: true },
        orderBy: { requestedAt: 'asc' },
        take: 10,
      }),
      prisma.auditCycle.findMany({
        where: {
          organizationId,
          status: { in: [AuditCycleStatus.OPEN, AuditCycleStatus.IN_PROGRESS] },
          plannedStartAt: { gte: now, lte: windowEnd },
        },
        orderBy: { plannedStartAt: 'asc' },
        take: 10,
      }),
    ]);

    return [
      ...bookings.map((booking) => ({
        id: `booking-${booking.id}`,
        type: 'Booking',
        title: booking.resource.name,
        detail: booking.purpose || booking.status,
        date: booking.startAt,
      })),
      ...maintenance.map((request) => ({
        id: `maintenance-${request.id}`,
        type: 'Maintenance',
        title: request.asset.name,
        detail: `${request.priority} priority`,
        date: request.createdAt,
      })),
      ...returns.map((allocation) => ({
        id: `return-${allocation.id}`,
        type: 'Return',
        title: allocation.asset.name,
        detail: `${allocation.allocatedTo.firstName} ${allocation.allocatedTo.lastName}`,
        date: allocation.expectedReturnAt,
      })),
      ...transfers.map((transfer) => ({
        id: `transfer-${transfer.id}`,
        type: 'Transfer',
        title: transfer.asset.name,
        detail: transfer.reason,
        date: transfer.requestedAt,
      })),
      ...audits.map((audit) => ({
        id: `audit-${audit.id}`,
        type: 'Audit',
        title: audit.title,
        detail: audit.status,
        date: audit.plannedStartAt,
      })),
    ]
      .filter((event) => event.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 24);
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
