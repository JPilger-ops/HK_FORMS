CREATE TABLE "ReservationInvoice" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "invoiceReference" TEXT NOT NULL,
    "firstItemLabel" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'NONE',
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "overdueSince" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationInvoice_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReservationInvoice" ADD CONSTRAINT "ReservationInvoice_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "ReservationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ReservationInvoice_reservationId_invoiceReference_key" ON "ReservationInvoice"("reservationId", "invoiceReference");
