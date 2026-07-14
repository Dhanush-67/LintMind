-- CreateEnum
CREATE TYPE "ReviewRunStatus" AS ENUM ('COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ReviewRun" (
    "id" TEXT NOT NULL,
    "pullRequestNumber" INTEGER NOT NULL,
    "pullRequestTitle" TEXT,
    "pullRequestAuthor" TEXT,
    "installationId" INTEGER NOT NULL,
    "githubDeliveryId" TEXT,
    "status" "ReviewRunStatus" NOT NULL DEFAULT 'COMPLETED',
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "reviewRunId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reviewRunId_fkey" FOREIGN KEY ("reviewRunId") REFERENCES "ReviewRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
