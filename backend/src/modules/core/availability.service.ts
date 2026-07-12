import { prisma } from '../../lib/db/prisma';
import { AssetStatus, AllocationStatus, MaintenanceStatus, BookingStatus } from '@prisma/client';

export class AvailabilityService {
  /**
   * Unified availability check. Ensure an asset is not simultaneously claimed across different modules.
   * "treat 'asset is claimed' as one concept regardless of which table claims it."
   */
  static async isAssetClaimable(assetId: string, organizationId: string, excludeType?: 'booking' | 'allocation' | 'maintenance'): Promise<boolean> {
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, organizationId, deletedAt: null },
      include: { activeAllocation: true }
    });

    if (!asset) return false;
    
    // 1. Check physical intrinsic state
    if (asset.status !== AssetStatus.AVAILABLE) return false;

    // 2. Check Allocations
    if (excludeType !== 'allocation' && asset.activeAllocation) {
      return false; // Active lock exists
    }

    // 3. Check Bookings (Is it currently booked, taking buffers into account?)
    if (excludeType !== 'booking') {
      const now = new Date();
      // We must fetch the resource related to this asset first
      const resource = await prisma.resource.findUnique({ where: { assetId } });
      
      if (resource) {
        // A booking is active if NOW is within [startAt - bufferBefore, endAt + bufferAfter]
        const activeBookings = await prisma.resourceBooking.findMany({
          where: {
            resourceId: resource.id,
            status: { in: [BookingStatus.HELD, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] }
          }
        });

        const isCurrentlyBooked = activeBookings.some(b => {
          const paddedStart = new Date(b.startAt.getTime() - resource.bufferBeforeMinutes * 60000);
          const paddedEnd = new Date(b.endAt.getTime() + resource.bufferAfterMinutes * 60000);
          
          // Ignore EXPIRED holds
          if (b.status === BookingStatus.HELD && b.holdExpiresAt && b.holdExpiresAt < now) {
            return false;
          }

          return now >= paddedStart && now <= paddedEnd;
        });

        if (isCurrentlyBooked) return false;
      }
    }

    // 4. Check Pending Maintenance
    if (excludeType !== 'maintenance') {
      const activeMaintenance = await prisma.maintenanceRequest.findFirst({
        where: {
          assetId,
          status: { in: [MaintenanceStatus.PENDING, MaintenanceStatus.APPROVED, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_REPAIR] }
        }
      });

      if (activeMaintenance) return false;
    }

    return true;
  }
}
