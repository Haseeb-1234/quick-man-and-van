-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "customerSubject" TEXT NOT NULL DEFAULT 'Your move is confirmed — {{bookingRef}}',
    "customerBody" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);
