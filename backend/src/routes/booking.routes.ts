import { Router } from 'express';
import { BookingService } from '../modules/bookings/services/booking.service';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/db/prisma';

const router = Router();

// Get all bookable resources
router.get('/resources', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId;
    const resources = await prisma.resource.findMany({
      where: { organizationId: orgId },
      include: {
        location: true
      }
    });
    res.json(resources);
  } catch (error) {
    next(error);
  }
});

// Get all bookings
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId;
    const bookings = await prisma.resourceBooking.findMany({
      where: { resource: { organizationId: orgId } },
      include: {
        resource: true,
        bookedBy: true
      },
      orderBy: { startAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// Create booking hold (soft-hold)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    // using BookingService from HEAD
    const booking = await BookingService.createBooking(
      req.user!.organizationId,
      req.user!.userId,
      req.body
    );
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

// Confirm booking hold
router.post('/:bookingId/confirm', requireAuth, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingService.confirmBooking(
      req.user!.organizationId,
      bookingId as string,
      req.user!.userId
    );
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Cancel booking
router.post('/:bookingId/cancel', requireAuth, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const booking = await BookingService.cancelBooking(
      req.user!.organizationId,
      bookingId as string,
      req.user!.userId,
      reason
    );
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Check-in to booking
router.post('/:bookingId/checkin', requireAuth, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingService.checkIn(
      req.user!.organizationId,
      bookingId as string
    );
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Complete booking
router.post('/:bookingId/complete', requireAuth, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingService.completeBooking(
      req.user!.organizationId,
      bookingId as string,
      req.user!.userId
    );
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Confirm/Update status (from Frontend)
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await prisma.resourceBooking.update({
      where: { id: req.params.id as string },
      data: { status }
    });
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

export default router;
