-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CONTACT', 'BOOKING');

-- AlterTable: existing accounts keep full access.
ALTER TABLE "Admin" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ADMIN';

-- The original seeded admin account signs in as Admin@samatechs.com.
UPDATE "Admin" SET "email" = 'Admin@samatechs.com', "name" = 'Admin@samatechs.com'
WHERE lower("email") = 'user@samatechs.com';
