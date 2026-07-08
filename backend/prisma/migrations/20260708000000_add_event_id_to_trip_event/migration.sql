-- Add eventId column to trip_events for device-side idempotency
ALTER TABLE "trip_events" ADD COLUMN "eventId" TEXT;

-- Create unique index for eventId deduplication
CREATE UNIQUE INDEX "trip_events_eventId_key" ON "trip_events"("eventId");
