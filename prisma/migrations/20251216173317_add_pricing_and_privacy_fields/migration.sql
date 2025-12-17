-- AlterTable
ALTER TABLE "ReservationRequest" ADD COLUMN     "extrasSelection" TEXT,
ADD COLUMN     "guestAddress" TEXT,
ADD COLUMN     "privacyAcceptedAt" TIMESTAMP(3);
