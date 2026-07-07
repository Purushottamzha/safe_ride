-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('TRIP_STARTED', 'BUS_APPROACHING', 'STUDENT_BOARDED', 'STUDENT_EXITED', 'STUDENT_ABSENT', 'TRIP_COMPLETED', 'ROUTE_DEVIATION', 'EMERGENCY_ALERT', 'DELAY_ALERT', 'SYSTEM_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "DriverSafetyEventType" AS ENUM ('OVERSPEED', 'ROUTE_DEVIATION', 'LONG_IDLE', 'MISSED_STOP', 'HARD_BRAKE', 'GPS_DISCONNECTED', 'EMERGENCY_TRIGGERED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttendanceStatus" ADD VALUE 'NOT_BOARDED';
ALTER TYPE "AttendanceStatus" ADD VALUE 'BOARDED';
ALTER TYPE "AttendanceStatus" ADD VALUE 'DROPPED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TripStatus" ADD VALUE 'DRIVER_ASSIGNED';
ALTER TYPE "TripStatus" ADD VALUE 'BUS_ASSIGNED';
ALTER TYPE "TripStatus" ADD VALUE 'READY';
ALTER TYPE "TripStatus" ADD VALUE 'DRIVING_TO_PICKUP';
ALTER TYPE "TripStatus" ADD VALUE 'AT_STOP';
ALTER TYPE "TripStatus" ADD VALUE 'BOARDING';
ALTER TYPE "TripStatus" ADD VALUE 'DRIVING_TO_SCHOOL';
ALTER TYPE "TripStatus" ADD VALUE 'SCHOOL_ARRIVED';
ALTER TYPE "TripStatus" ADD VALUE 'DRIVING_TO_DROP';
ALTER TYPE "TripStatus" ADD VALUE 'DROPPING';

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "boardCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedStops" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentStopId" TEXT,
ADD COLUMN     "currentStopLat" DOUBLE PRECISION,
ADD COLUMN     "currentStopLng" DOUBLE PRECISION,
ADD COLUMN     "dropCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stopSequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalStops" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_safety_events" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tripId" TEXT,
    "eventType" "DriverSafetyEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "value" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_safety_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_safety_scores" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "tripCount" INTEGER NOT NULL DEFAULT 0,
    "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overspeedCount" INTEGER NOT NULL DEFAULT 0,
    "deviationCount" INTEGER NOT NULL DEFAULT 0,
    "idleEventCount" INTEGER NOT NULL DEFAULT 0,
    "missedStopCount" INTEGER NOT NULL DEFAULT 0,
    "hardBrakeCount" INTEGER NOT NULL DEFAULT 0,
    "gpsDropCount" INTEGER NOT NULL DEFAULT 0,
    "emergencyCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_safety_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_waypoints" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "occupancy" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_waypoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notification_preferences_eventType_idx" ON "notification_preferences"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_eventType_channel_key" ON "notification_preferences"("userId", "eventType", "channel");

-- CreateIndex
CREATE INDEX "driver_safety_events_driverId_idx" ON "driver_safety_events"("driverId");

-- CreateIndex
CREATE INDEX "driver_safety_events_tripId_idx" ON "driver_safety_events"("tripId");

-- CreateIndex
CREATE INDEX "driver_safety_events_eventType_idx" ON "driver_safety_events"("eventType");

-- CreateIndex
CREATE INDEX "driver_safety_events_createdAt_idx" ON "driver_safety_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "driver_safety_scores_driverId_key" ON "driver_safety_scores"("driverId");

-- CreateIndex
CREATE INDEX "trip_waypoints_tripId_timestamp_idx" ON "trip_waypoints"("tripId", "timestamp");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_safety_events" ADD CONSTRAINT "driver_safety_events_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_safety_events" ADD CONSTRAINT "driver_safety_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_safety_scores" ADD CONSTRAINT "driver_safety_scores_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_waypoints" ADD CONSTRAINT "trip_waypoints_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
