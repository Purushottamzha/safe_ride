-- CreateEnum
CREATE TYPE "StudentRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('WEBCAM_DEMO', 'ESP32_CAM', 'ESP32_GPS');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');

-- CreateTable
CREATE TABLE "pending_student_requests" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "profilePicture" TEXT,
    "schoolId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "status" "StudentRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_student_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "busId" TEXT,
    "schoolId" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "firmwareVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_student_requests_schoolId_idx" ON "pending_student_requests"("schoolId");

-- CreateIndex
CREATE INDEX "pending_student_requests_status_idx" ON "pending_student_requests"("status");

-- CreateIndex
CREATE INDEX "pending_student_requests_parentId_idx" ON "pending_student_requests"("parentId");

-- CreateIndex
CREATE INDEX "devices_busId_idx" ON "devices"("busId");

-- CreateIndex
CREATE INDEX "devices_schoolId_idx" ON "devices"("schoolId");

-- CreateIndex
CREATE INDEX "devices_type_idx" ON "devices"("type");

-- AddForeignKey
ALTER TABLE "pending_student_requests" ADD CONSTRAINT "pending_student_requests_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_student_requests" ADD CONSTRAINT "pending_student_requests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_student_requests" ADD CONSTRAINT "pending_student_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
