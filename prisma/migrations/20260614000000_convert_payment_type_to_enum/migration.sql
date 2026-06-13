-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('FULL', 'DEPOSIT');

-- AlterTable: cast existing TEXT values to the new enum (no data loss)
ALTER TABLE "Booking" ALTER COLUMN "paymentType" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "paymentType" TYPE "PaymentType" USING "paymentType"::"PaymentType";
ALTER TABLE "Booking" ALTER COLUMN "paymentType" SET DEFAULT 'FULL';
