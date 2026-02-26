-- Ensure RideRequestStatus includes OFFER_SENT
ALTER TYPE "RideRequestStatus" ADD VALUE IF NOT EXISTS 'OFFER_SENT';
