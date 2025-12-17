-- Allow nullable reservationId and add inviteLinkId
ALTER TABLE "EmailLog" DROP CONSTRAINT IF EXISTS "EmailLog_reservationId_fkey";
ALTER TABLE "EmailLog" ALTER COLUMN "reservationId" DROP NOT NULL;
ALTER TABLE "EmailLog" ADD COLUMN "inviteLinkId" TEXT;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "ReservationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_inviteLinkId_fkey" FOREIGN KEY ("inviteLinkId") REFERENCES "InviteLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
