#!/bin/bash
# SafeRide Nepal Deployment Script
set -e

echo "Building and deploying SafeRide Nepal..."

# Build and start all services
docker compose build --no-cache
docker compose up -d

# Run database migrations
docker compose exec backend npx prisma migrate deploy

# Seed database
docker compose exec backend npx prisma db seed

echo "Deployment complete!"
echo "Backend: http://localhost:3000"
echo "Admin Web: http://localhost:5173"
echo "Parent Web: http://localhost:5174"
echo "API Docs: http://localhost:3000/api/docs"
