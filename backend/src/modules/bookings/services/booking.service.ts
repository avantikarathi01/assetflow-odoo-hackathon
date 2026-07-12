import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../core/errors';
import { BookingStatus, ResourceStatus } from '@prisma/client';
import { AvailabilityService } from '../../core/availability.service';

export class BookingService {
  /**
   * Performs lazy cleanup of expired holds
   */
  static async cleanupExpiredHolds(organizationId: string) {
    await prisma.resourceBooking.updateMany({
      where: {
        organizationId,
        status: BookingStatus.HELD,
        holdExpiresAt: { lt: new Date() }
      },
      data: {
        status: BookingStatus.EXPIRED
      }
    });
  }

  /**
   * Creates a resource booking (Starts as a Soft-Hold).
   * Leverages the Postgres EXCLUDE constraint to ensure mathematically 0 overlaps.
   */
  static async createBooking(organizationId: string, bookedById: string, data: { resourceId: string, startAt: string, endAt: string, purpose?: string }) {
    // 1. Clean up any expired holds so the DB EXCLUDE constraint doesn't trip on them
    await this.cleanupExpiredHolds(organizationId);

    const resource = await prisma.resource.findFirst({
      where: { id: data.resourceId, organizationId, deletedAt: null }
    });

    if (!resource) throw new NotFoundError('Resource not found');
    if (resource.status !== ResourceStatus.ACTIVE) {
      throw new ValidationError(`Cannot book a resource that is ${resource.status}`);
    }

    // Unified cross-module conflict check
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

    // Apply buffer times to the physical DB entry so the EXCLUDE constraint handles the gap automatically.
    // The actual start/end seen by users can be stored in metadata if needed, 
    // but typically we can just store the padded time or check padding in query.
    // Wait, if we pad the DB time, the calendar looks wrong. 
    // Let's store the REAL time in the DB, and let the EXCLUDE constraint fail ONLY IF there is an actual overlap.
    // BUT we need the buffer! 
    // If we can't pad the DB time, we must enforce the buffer at the application level.
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

    // Attempt to insert. The EXCLUDE constraint will still act as a fallback safety net for exact overlaps.
    try {
      const holdExpiresAt = new Date(Date.now() + resource.holdMinutes * 60000);
      
      const booking = await prisma.resourceBooking.create({
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

      return booking;
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

    return prisma.resourceBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        holdExpiresAt: null, // clear the hold expiration
        version: { increment: 1 }
      }
    });
  }

  static async cancelBooking(organizationId: string, bookingId: string, cancelledById: string, reason?: string) {
    const booking = await prisma.resourceBooking.findFirst({
      where: { id: bookingId, organizationId }
    });

    if (!booking) throw new NotFoundError('Booking not found');
    
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.EXPIRED) {
      throw new ValidationError(`Booking is already ${booking.status}`);
    }

    // Cancelling changes the status to CANCELLED, which our DB EXCLUDE constraint now ignores, automatically freeing the resource.
    return prisma.resourceBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
        version: { increment: 1 }
      }
    });
  }

  static async checkIn(organizationId: string, bookingId: string) {
    const booking = await prisma.resourceBooking.findFirst({
      where: { id: bookingId, organizationId, status: BookingStatus.CONFIRMED }
    });

    if (!booking) throw new NotFoundError('Confirmed booking not found');

    const now = new Date();
    // Allow check-in 15 mins before start
    const allowedCheckInTime = new Date(booking.startAt.getTime() - 15 * 60000);
    if (now < allowedCheckInTime) {
      throw new ValidationError('Too early to check in');
    }

    return prisma.resourceBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CHECKED_IN,
        checkedInAt: now,
        version: { increment: 1 }
      }
    });
  }
}
