/*
  Warnings:

  - A unique constraint covering the columns `[githubDeliveryId]` on the table `ReviewRun` will be added. If there are existing duplicate values, this will fail.
  - Made the column `githubDeliveryId` on table `ReviewRun` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "ReviewRunStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "ReviewRun" ALTER COLUMN "githubDeliveryId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRun_githubDeliveryId_key" ON "ReviewRun"("githubDeliveryId");
