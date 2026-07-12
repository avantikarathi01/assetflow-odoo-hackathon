import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { BookingStatus, ResourceStatus, AssetStatus } from '@prisma/client';
import { AvailabilityService } from '../../core/availability.service';
import { AssetService } from '../../assets/services/asset.service';
import { NotificationService } from '../../notifications/notification.service';

export class BookingService {
  /**
   * Performs lazy cleanup of expired holds
   */
  static async cleanupExpiredHolds(organizationId: string) {
    const expiredBookings = await prisma.resourceBooking.findMany({
      where: {
        organizationId,
        status: BookingStatus.HELD,
        holdExpiresAt: { lt: new Date() }
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
            organizationId,
            booking.resource.assetId,
            AssetStatus.AVAILABLE,
            booking.bookedById,
            'Booking hold expired'
          );
        }
      }, { timeout: 25000 });
    }
  }

  /**
   * Creates a resource booking (Starts as a Soft-Hold).
   * Leverages the Postgres EXCLUDE constraint to ensure mathematically 0 overlaps.
   */
  static async createBooking(organizationId: string, bookedById: string, data: { resourceId: string, startAt: string, endAt: string, purpose?: string }) {
    await this.cleanupExpiredHolds(organizationId);

    const resource = await prisma.resource.findFirst({
      where: { id: data.resourceId, organizationId, deletedAt: null }
    });

    if (!resource) throw new NotFoundError('Resource not found');
    if (resource.status !== ResourceStatus.ACTIVE) {
      throw new ValidationError(`Cannot book a resource that is ${resource.status}`);
    }

    if (resource.assetId) {
      const isClaimable = await AvailabilityService.isAssetClaimable(resource.assetId, organizationId, 'booking');
      if (!isClaimable) {
        throw new ConflictError('This resource/asset is currently claimed or under maintenance.');
      }
    }

    const requestedStart = new Date(data.startAt);
    const requestedEnd = new Date(data.endAt);

    if (requestedStart >= requestedEnd) {
      throw new ValidationError('End time must be after start time');
    }

    const durationMinutes = (requestedEnd.getTime() - requestedStart.getTime()) / 60000;
    if (durationMinutes < resource.minBookingMinutes) {
      throw new ValidationError(`Booking must be at least ${resource.minBookingMinutes} minutes long`);
    }
    if (resource.maxBookingMinutes && durationMinutes > resource.maxBookingMinutes) {
      throw new ValidationError(`Booking cannot exceed ${resource.maxBookingMinutes} minutes`);
    }

    const paddedStart = new Date(requestedStart.getTime() - resource.bufferBeforeMinutes * 60000);
    const paddedEnd = new Date(requestedEnd.getTime() + resource.bufferAfterMinutes * 60000);

    const conflictingBookings = await prisma.resourceBooking.findMany({
      where: {
        resourceId: resource.id,
        status: { in: [BookingStatus.HELD, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        OR: [
          { startAt: { lt: paddedEnd }, endAt: { gt: paddedStart } }
        ]
      }
    });

    if (conflictingBookings.length > 0) {
      throw new ConflictError('This resource is already booked for the requested time slot (including buffer times).');
    }

    try {
      const holdExpiresAt = new Date(Date.now() + resource.holdMinutes * 60000);
      
      return await prisma.$transaction(async (tx) => {
        const booking = await tx.resourceBooking.create({
          data: {
            organizationId,
            resourceId: data.resourceId,
            bookedById,
            startAt: requestedStart,
            endAt: requestedEnd,
            purpose: data.purpose,
            holdExpiresAt,
            status: BookingStatus.HELD, 
          }
        });

        if (resource.assetId) {
          await AssetService.transitionAssetStatus(
            tx,
            organizationId,
            resource.assetId,
            AssetStatus.RESERVED,
            bookedById,
            'Asset reserved via booking hold'
          );
        }

        await NotificationService.create(
          organizationId,
          bookedById,
          'BOOKING',
          'INFO',
          'Booking Hold Created',
          `Your booking hold for resource ${data.resourceId} has been created. It will expire in ${resource.holdMinutes} minutes.`,
          'ResourceBooking',
          booking.id
        );

        return booking;
      }, { timeout: 25000 });
    } catch (err: any) {
      if (err.message && err.message.includes('no_overlapping_bookings')) {
        throw new ConflictError('This resource is already booked for the requested time slot.');
      }
      throw err;
    }
  }

  /**
   * Confirms a held booking.
   */
  static async confirmBooking(organizationId: string, bookingId: string, confirmedById: string) {
    const booking = await prisma.resourceBooking.findFirst({
      where: { id: bookingId, organizationId, status: BookingStatus.HELD }
    });

    if (!booking) throw new NotFoundError('Pending hold not found');
    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      await prisma.resourceBooking.update({ where: { id: bookingId }, data: { status: BookingStatus.EXPIRED } });
      throw new ValidationError('Booking hold has expired. Please try booking again.');
    }

    const updatedBooking = await prisma.resourceBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        holdExpiresAt: null,
        version: { increment: 1 }
      }
    });

    await NotificationService.create(
      organizationId,
      updatedBooking.bookedById,
      'BOOKING',
      'SUCCESS',
      'Booking Confirmed',
      `Your booking for resource ${updatedBooking.resourceId} has been confirmed.`,
      'ResourceBooking',
      bookingId
    );

    return updatedBooking;
  }

  static async cancelBooking(organizationId: string, bookingId: string, cancelledById: string, reason?: string) {
    const booking = await prisma.resourceBooking.findFirst({
      where: { id: bookingId, organizationId }
    });

    if (!booking) throw new NotFoundError('Booking not found');
    
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.EXPIRED) {
      throw new ValidationError(`Booking is already ${booking.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.resourceBooking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
          version: { increment: 1 }
        },
        include: { resource: true }
      });

      if (updatedBooking.resource.assetId) {
        await AssetService.transitionAssetStatus(
          tx,
          organizationId,
          updatedBooking.resource.assetId,
          AssetStatus.AVAILABLE,
          cancelledById,
          reason || 'Booking cancelled'
        );
      }

      await NotificationService.create(
        organizationId,
        updatedBooking.bookedById,
        'BOOKING',
        'WARNING',
        'Booking Cancelled',
        `Your booking for resource ${updatedBooking.resourceId} has been cancelled.`,
        'ResourceBooking',
        bookingId
      );

      return updatedBooking;
    }, { timeout: 25000 });
  }

  static async checkIn(organizationId: string, bookingId: string) {
    const booking = await prisma.resourceBooking.findFirst({
      where: { id: bookingId, organizationId, status: BookingStatus.CONFIRMED }
    });

    if (!booking) throw new NotFoundError('Confirmed booking not found');

    const now = new Date();
    const allowedCheckInTime = new Date(booking.startAt.getTime() - 15 * 60000);
    if (now < allowedCheckInTime) {
      throw new ValidationError('Too early to check in');
    }

    return prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.resourceBooking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CHECKED_IN,
          checkedInAt: now,
          version: { increment: 1 }
        },
        include: { resource: true }
      });

      if (updatedBooking.resource.assetId) {
        await AssetService.transitionAssetStatus(
          tx,
          organizationId,
          updatedBooking.resource.assetId,
          AssetStatus.ALLOCATED,
          updatedBooking.bookedById,
          'Asset checked-in and allocated via booking'
        );
      }

      return updatedBooking;
    }, { timeout: 25000 });
  }

  static async completeBooking(organizationId: string, bookingId: string, actorId: string) {
    const booking = await prisma.resourceBooking.findFirst({
      where: { id: bookingId, organizationId, status: BookingStatus.CHECKED_IN },
      include: { resource: true }
    });

    if (!booking) throw new NotFoundError('Checked-in booking not found');

    return prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.resourceBooking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
          version: { increment: 1 }
        }
      });

      if (booking.resource.assetId) {
        await AssetService.transitionAssetStatus(
          tx,
          organizationId,
          booking.resource.assetId,
          AssetStatus.AVAILABLE,
          actorId,
          'Booking completed'
        );
      }

      return updatedBooking;
    }, { timeout: 25000 });
  }
}
