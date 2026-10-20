-- Fields collected by the website's contact form.
ALTER TABLE "ContactMessage" ADD COLUMN "organization" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN "jobTitle" TEXT;

-- The website's booking form does not ask for a phone number.
ALTER TABLE "Consultation" ALTER COLUMN "phone" DROP NOT NULL;
