-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "collectionAddress" TEXT NOT NULL,
    "collectionPostcode" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryPostcode" TEXT NOT NULL,
    "stops" JSONB,
    "collectionStairs" INTEGER NOT NULL DEFAULT 0,
    "deliveryStairs" INTEGER NOT NULL DEFAULT 0,
    "moveDate" TIMESTAMP(3) NOT NULL,
    "vanSize" TEXT NOT NULL,
    "helpers" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL,
    "bookedHours" DOUBLE PRECISION,
    "bookedVanType" INTEGER,
    "stripePaymentId" TEXT,
    "stripeSessionId" TEXT,
    "checkoutToken" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "contactEmail" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
