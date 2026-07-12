-- Drop the old constraint
ALTER TABLE "ResourceBooking" DROP CONSTRAINT IF EXISTS no_overlapping_bookings;

-- Create the new scoped constraint that ignores CANCELLED, EXPIRED, and COMPLETED bookings
ALTER TABLE "ResourceBooking" 
ADD CONSTRAINT no_overlapping_bookings 
EXCLUDE USING GIST ("resourceId" WITH =, tsrange("startAt", "endAt") WITH &&)
WHERE ("status" IN ('HELD', 'CONFIRMED', 'CHECKED_IN'));