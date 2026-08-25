/*
  Warnings:

  - You are about to drop the column `sessionTime` on the `Session` table. All the data in the column will be lost.
  - Added the required column `day` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSlot` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "sessionTime",
ADD COLUMN     "day" "DayOfWeek" NOT NULL,
ADD COLUMN     "timeSlot" timerange NOT NULL;
