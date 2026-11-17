-- Stores rotating third-party credentials (Microsoft refresh token for Teams meetings).
CREATE TABLE "IntegrationToken" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationToken_pkey" PRIMARY KEY ("key")
);
