-- CreateEnum
CREATE TYPE "ExtraPricingType" AS ENUM ('PER_PERSON', 'FLAT');

-- AlterTable
ALTER TABLE "ReservationRequest"
ADD COLUMN     "hostFirstName" TEXT,
ADD COLUMN     "hostLastName" TEXT,
ADD COLUMN     "hostStreet" TEXT,
ADD COLUMN     "hostPostalCode" TEXT,
ADD COLUMN     "hostCity" TEXT,
ADD COLUMN     "hostPhone" TEXT,
ADD COLUMN     "hostEmail" TEXT,
ADD COLUMN     "extrasSnapshot" JSONB,
ADD COLUMN     "legacyData" JSONB;

-- CreateTable
CREATE TABLE "ExtraOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "pricingType" "ExtraPricingType" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraOption_pkey" PRIMARY KEY ("id")
);

-- Backfill legacy host/contact information where possible
UPDATE "ReservationRequest"
SET
  "hostFirstName" = COALESCE("hostFirstName", NULLIF(split_part("guestName", ' ', 1), '')),
  "hostLastName" = COALESCE(
    "hostLastName",
    NULLIF(regexp_replace("guestName", '^[^\\s]+\\s*', ''), ''),
    "guestName"
  ),
  "hostEmail" = COALESCE("hostEmail", "guestEmail"),
  "hostPhone" = COALESCE("hostPhone", "guestPhone"),
  "hostStreet" = COALESCE("hostStreet", "guestAddress")
WHERE "guestName" IS NOT NULL;

-- Persist previous raw values for compatibility
UPDATE "ReservationRequest"
SET "legacyData" = jsonb_build_object(
  'guestName', "guestName",
  'guestEmail', "guestEmail",
  'guestPhone', "guestPhone",
  'guestAddress', "guestAddress",
  'eventStartTime', "eventStartTime",
  'eventEndTime', "eventEndTime",
  'extrasSelection', "extrasSelection",
  'extras', "extras"
)
WHERE "legacyData" IS NULL;
