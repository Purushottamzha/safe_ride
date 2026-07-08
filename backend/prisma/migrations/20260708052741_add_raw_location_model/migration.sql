-- CreateTable
CREATE TABLE "raw_locations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "deviceId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "deviceTimestamp" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "raw_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_locations_eventId_key" ON "raw_locations"("eventId");

-- CreateIndex
CREATE INDEX "raw_locations_schoolId_busId_idx" ON "raw_locations"("schoolId", "busId");

-- CreateIndex
CREATE INDEX "raw_locations_receivedAt_idx" ON "raw_locations"("receivedAt");

-- CreateIndex
CREATE INDEX "raw_locations_eventId_idx" ON "raw_locations"("eventId");
