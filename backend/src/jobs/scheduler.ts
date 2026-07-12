import { prisma } from '../lib/db/prisma';
import { BookingStatus, AllocationStatus, AssetStatus } from '@prisma/client';
import { NotificationService } from '../modules/notifications/notification.service';
import { AssetService } from '../modules/assets/services/asset.service';

export function startScheduler() {
  console.log('⏰ Background Scheduler Initialized...');

  // Run every 5 minutes
  setInterval(async () => {
    try {
      await runScheduledJobs();
    } catch (err) {
      console.error('Error running scheduled jobs:', err);
    }
  }, 5 * 60000);
}

export async function runScheduledJobs() {
  const now = new Date();

  // 1. Expire stale HELD bookings past holdExpiresAt
  const expiredBookings = await prisma.resourceBooking.findMany({
    where: {
      status: BookingStatus.HELD,
      holdExpiresAt: { lt: now }
    },
    include: { resource: true }
  });

  for (const booking of expiredBookings) {
    await prisma.$transaction(async (tx) => {
      await tx.resourceBooking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EXPIRED }
      });
      
      if (booking.resource.assetId) {
        await AssetService.transitionAssetStatus(
          tx,
          booking.organizationId,
          booking.resource.assetId,
          AssetStatus.AVAILABLE,
          booking.bookedById,
          'Booking hold expired (Cron)'
        );
      }
    });
  }

  // 2. Flag AssetAllocations past expectedReturnDate as overdue, trigger Notification
  const overdueAllocations = await prisma.assetAllocation.findMany({
    where: {
      status: AllocationStatus.ACTIVE,
      expectedReturnAt: { lt: now }
    }
  });

  for (const alloc of overdueAllocations) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60000);
    const existingNotification = await prisma.notification.findFirst({
      where: {
        organizationId: alloc.organizationId,
        userId: alloc.allocatedToUserId,
        type: 'RETURN',
        entityType: 'AssetAllocation',
        entityId: alloc.id,
        createdAt: { gt: oneDayAgo }
      }
    });

    if (!existingNotification) {
      await NotificationService.create(
        alloc.organizationId,
        alloc.allocatedToUserId,
        'RETURN',
        'WARNING',
        'Overdue Asset Return',
        `Your allocated asset ${alloc.assetId} is past its expected return date of ${alloc.expectedReturnAt?.toLocaleDateString()}. Please return it as soon as possible.`,
        'AssetAllocation',
        alloc.id
      );
    }
  }

  // 3. Flag ResourceBookings starting within the next 30 min, trigger reminder Notification
  const thirtyMinsFromNow = new Date(Date.now() + 30 * 60000);
  const upcomingBookings = await prisma.resourceBooking.findMany({
    where: {
      status: BookingStatus.CONFIRMED,
      startAt: { gt: now, lte: thirtyMinsFromNow }
    }
  });

  for (const booking of upcomingBookings) {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        organizationId: booking.organizationId,
        userId: booking.bookedById,
        type: 'BOOKING',
        entityType: 'ResourceBooking',
        entityId: booking.id,
        title: 'Upcoming Booking Reminder'
      }
    });

    if (!existingNotification) {
      await NotificationService.create(
        booking.organizationId,
        booking.bookedById,
        'BOOKING',
        'INFO',
        'Upcoming Booking Reminder',
        `Your booking for resource ${booking.resourceId} starts in less than 30 minutes at ${booking.startAt.toLocaleTimeString()}.`,
        'ResourceBooking',
        booking.id
      );
    }
  }

  // 4. Update ResourceBooking status Checked In -> Completed if endAt has passed
  const bookingsToEnd = await prisma.resourceBooking.findMany({
    where: {
      status: BookingStatus.CHECKED_IN,
      endAt: { lt: now }
    },
    include: { resource: true }
  });

  for (const booking of bookingsToEnd) {
    await prisma.$transaction(async (tx) => {
      await tx.resourceBooking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.COMPLETED, completedAt: now }
      });

      if (booking.resource.assetId) {
        await AssetService.transitionAssetStatus(
          tx,
          booking.organizationId,
          booking.resource.assetId,
          AssetStatus.AVAILABLE,
          booking.bookedById,
          'Booking time ended (Auto-completed)'
        );
      }
    });
  }
}
