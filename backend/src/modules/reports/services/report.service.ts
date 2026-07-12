import { prisma } from '../../../lib/db/prisma';

export class ReportService {
  /**
   * Utilization statistics (counts, duration in hours)
   */
  static async getUtilizationReport(organizationId: string) {
    const assets = await prisma.asset.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        allocations: true
      }
    });

    const utilization = assets.map(asset => {
      let totalDurationMs = 0;
      asset.allocations.forEach(a => {
        const start = new Date(a.allocatedAt).getTime();
        const end = a.returnedAt ? new Date(a.returnedAt).getTime() : Date.now();
        totalDurationMs += (end - start);
      });

      return {
        id: asset.id,
        name: asset.name,
        assetTag: asset.assetTag,
        allocationCount: asset.allocations.length,
        totalDurationHours: Math.round(totalDurationMs / (1000 * 60 * 60))
      };
    });

    const sorted = [...utilization].sort((a, b) => b.allocationCount - a.allocationCount);

    return {
      mostUsed: sorted.slice(0, 5),
      leastUsed: [...sorted].reverse().slice(0, 5)
    };
  }

  /**
   * Maintenance frequency & costs by asset category
   */
  static async getMaintenanceFrequencyReport(organizationId: string) {
    const requests = await prisma.maintenanceRequest.findMany({
      where: { organizationId },
      include: {
        asset: {
          include: {
            category: true
          }
        }
      }
    });

    const frequencyMap: Record<string, { count: number, totalCost: number }> = {};

    requests.forEach(r => {
      const categoryName = r.asset.category.name;
      if (!frequencyMap[categoryName]) {
        frequencyMap[categoryName] = { count: 0, totalCost: 0 };
      }
      frequencyMap[categoryName].count++;
      if (r.cost) {
        frequencyMap[categoryName].totalCost += Number(r.cost);
      }
    });

    return Object.entries(frequencyMap).map(([category, data]) => ({
      category,
      count: data.count,
      totalCost: data.totalCost
    }));
  }

  /**
   * Allocation count & asset summary per department
   */
  static async getDepartmentSummaryReport(organizationId: string) {
    const departments = await prisma.department.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        assets: {
          include: {
            allocations: true
          }
        }
      }
    });

    return departments.map(d => {
      const allocationCount = d.assets.reduce((sum, asset) => sum + asset.allocations.length, 0);
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        assetCount: d.assets.length,
        allocationCount
      };
    });
  }

  /**
   * Weekly/hourly booking heatmap
   */
  static async getBookingHeatmap(organizationId: string) {
    const bookings = await prisma.resourceBooking.findMany({
      where: {
        organizationId,
        status: { not: 'CANCELLED' }
      },
      select: {
        startAt: true
      }
    });

    const heatmap: Record<string, number> = {};

    // Seed 7 days x 24 hours
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmap[`${day}-${hour}`] = 0;
      }
    }

    bookings.forEach(b => {
      const date = new Date(b.startAt);
      const day = date.getDay(); // 0 is Sunday, 6 is Saturday
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    return Object.entries(heatmap).map(([key, count]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, count };
    });
  }
}
