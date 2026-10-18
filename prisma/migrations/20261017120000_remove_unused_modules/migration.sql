-- Remove retired feature data. Back up these tables before deployment.
-- The User model maps to Admin, preserving existing accounts unchanged.
DROP TABLE "Blog";
DROP TABLE "BlogCategory";
DROP TABLE "CareerApplication";
DROP TABLE "Subscriber";
DROP TYPE "BlogType";
DROP TYPE "BlogStatus";
DROP TYPE "CareerApplicationStatus";
DROP TYPE "SubscriberStatus";
