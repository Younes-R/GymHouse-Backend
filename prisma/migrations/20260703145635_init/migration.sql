-- Enable the extension required for GiST indexes
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ONLINE');

-- CreateTable
CREATE TABLE "User" (
    "userId" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "userType" "UserType" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Plan" (
    "planId" SERIAL NOT NULL,
    "planType" "PlanType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("planId")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "subscriptionId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "priceAtPurchase" DOUBLE PRECISION NOT NULL,
    "subscrptionTime" tstzrange NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("subscriptionId")
);

-- CreateTable
CREATE TABLE "Payment" (
    "paymentId" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("paymentId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionId" SERIAL NOT NULL,
    "sessionTime" tstzrange NOT NULL,
    "gender" "Gender" NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionId")
);

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("planId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("subscriptionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add EXCLUDE constraint 
ALTER TABLE "Session" ADD CONSTRAINT "no_overlapping_sessions"
EXCLUDE USING gist (
    "sessionTime" WITH &&
);

-- Add EXCLUDE constraint 
ALTER TABLE "Subscription" ADD CONSTRAINT "no_overlapping_subscriptions"
EXCLUDE USING gist (
    "userId" WITH =,
    "subscrptionTime" WITH &&
)