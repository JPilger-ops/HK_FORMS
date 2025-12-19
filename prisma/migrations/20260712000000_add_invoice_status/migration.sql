-- Add invoice status fields to ReservationRequest
CREATE TYPE "InvoiceStatus" AS ENUM ('NONE', 'SENT', 'PAID', 'OVERDUE');

ALTER TABLE "ReservationRequest"
  ADD COLUMN "invoiceReference" TEXT,
  ADD COLUMN "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "invoiceSentAt" TIMESTAMP(3),
  ADD COLUMN "invoicePaidAt" TIMESTAMP(3),
  ADD COLUMN "invoiceOverdueSince" TIMESTAMP(3);
