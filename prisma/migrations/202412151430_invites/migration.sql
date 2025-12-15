-- InviteLink redesign
ALTER TABLE "InviteLink" DROP CONSTRAINT IF EXISTS "InviteLink_reservationId_fkey";
ALTER TABLE "InviteLink" DROP COLUMN IF EXISTS "reservationId";
ALTER TABLE "InviteLink" ADD COLUMN "formKey" TEXT NOT NULL DEFAULT 'gesellschaften';
ALTER TABLE "InviteLink" ADD COLUMN "usedByReservationId" TEXT;
ALTER TABLE "InviteLink" ADD COLUMN "recipientEmail" TEXT;
ALTER TABLE "InviteLink" ADD COLUMN "maxUses" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "InviteLink" ADD COLUMN "useCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "InviteLink" ADD COLUMN "note" TEXT;
ALTER TABLE "InviteLink" ADD COLUMN "isRevoked" BOOLEAN NOT NULL DEFAULT false;

-- adjust relation
ALTER TABLE "InviteLink" ADD CONSTRAINT "InviteLink_usedByReservationId_fkey" FOREIGN KEY ("usedByReservationId") REFERENCES "ReservationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- clean default
ALTER TABLE "InviteLink" ALTER COLUMN "formKey" DROP DEFAULT;
