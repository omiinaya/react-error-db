-- CreateEnum
CREATE TYPE "public"."CategoryRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "themePreference" TEXT DEFAULT 'light';

-- CreateTable
CREATE TABLE "public"."category_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "status" "public"."CategoryRequestStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."category_requests" ADD CONSTRAINT "category_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_requests" ADD CONSTRAINT "category_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_requests" ADD CONSTRAINT "category_requests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
