-- AlterTable
-- The initial schema already contains company. Keep both fresh installs and
-- older databases that only have country on the same migration path.
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "Consultation" DROP COLUMN IF EXISTS "country";
