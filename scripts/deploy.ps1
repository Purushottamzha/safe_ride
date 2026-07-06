# SafeRide Nepal Deployment Script for Windows
Write-Host "Building and deploying SafeRide Nepal..." -ForegroundColor Green

docker compose build --no-cache
docker compose up -d

Write-Host "Running database migrations..." -ForegroundColor Yellow
docker compose exec backend npx prisma migrate deploy

Write-Host "Seeding database..." -ForegroundColor Yellow
docker compose exec backend npx prisma db seed

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000"
Write-Host "Admin Web: http://localhost:5173"
Write-Host "Parent Web: http://localhost:5174"
Write-Host "API Docs: http://localhost:3000/api/docs"
