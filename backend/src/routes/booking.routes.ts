import { Router } from 'express';
import { BookingService } from '../modules/bookings/services/booking.service';

const router = Router();

// Create booking hold (soft-hold)
router.post('/', async (req, res, next) => {
  try {
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
router.post('/:bookingId/confirm', async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingService.confirmBooking(
      req.user!.organizationId,
      bookingId,
      req.user!.userId
    );
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Cancel booking
router.post('/:bookingId/cancel', async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const booking = await BookingService.cancelBooking(
      req.user!.organizationId,
      bookingId,
      req.user!.userId,
      reason
    );
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Check-in to booking
router.post('/:bookingId/checkin', async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingService.checkIn(
      req.user!.organizationId,
      bookingId
    );
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Complete booking
router.post('/:bookingId/complete', async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingService.completeBooking(
      req.user!.organizationId,
      bookingId,
      req.user!.userId
    );
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

export default router;
