# SafeRide Nepal

School Transport Management Platform

A modern, scalable, secure school transport management platform built with NestJS, React, PostgreSQL, MQTT, and open-source mapping tools.

## Architecture

```
saferide-nepal/
├── backend/          # NestJS REST API (TypeScript)
├── admin-web/        # Admin Dashboard (React/TypeScript)
├── parent-web/       # Parent Web Portal (React/TypeScript)
├── driver-app/       # Driver Mobile App (React Native)
├── shared/           # Shared types and utilities
├── docker/           # Docker configuration
├── scripts/          # Utility scripts
├── docs/             # Documentation
└── .github/          # CI/CD workflows
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT, Passport, Argon2 |
| API Docs | Swagger/OpenAPI |
| Admin Web | React 19, Vite, MUI |
| Parent Web | React 19, Vite, MUI |
| Driver App | React Native |
| Testing | Jest, Supertest, Playwright |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm or yarn

### One-command Start

```bash
docker compose up --build
```

### Or Manual Start

```bash
# 1. Start infrastructure
docker compose up postgres redis -d

# 2. Setup backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# 3. Start admin web (in another terminal)
cd admin-web
npm install
npm run dev

# 4. Start parent web (in another terminal)
cd parent-web
npm install
npm run dev
```

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@saferide.com | Admin@123456 |
| School Admin | school@saferide.com | Admin@123456 |
| Driver | driver@saferide.com | Admin@123456 |
| Parent | parent@saferide.com | Admin@123456 |

## API Documentation

Once running, Swagger docs are available at:

```
http://localhost:3000/api/docs
```

## Key Features

- QR-based student attendance (board in / exit out)
- Trip management (morning/afternoon)
- Real-time notifications via WebSocket
- RBAC with granular permissions
- Hardware abstraction layer for ESP32/GPS/Camera
- Attendance reports and analytics
- Responsive parent web portal
- Professional admin dashboard

## Product Scope

SafeRide Nepal v1.0 is scoped as a commercial school transport platform, not only
a QR attendance demo. See [docs/v1.0-product-scope.md](docs/v1.0-product-scope.md)
for the 14-module roadmap, implementation sequence, digital twin principle, and
pilot-readiness checklist.

Development progress is tracked in [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md).

## Security

- Argon2 password hashing
- JWT with refresh token rotation
- Rate limiting (ThrottlerGuard)
- Helmet security headers
- CORS configured
- Input validation (class-validator)
- SQL injection prevention (Prisma ORM)
- Account lockout after failed attempts
- Soft delete on all entities
- Audit logging

## Hardware Integration

The hardware abstraction layer supports future integration with:

- ESP32 Camera Module
- GPS Module
- Face Verification
- IoT Sensors

Current implementation uses dummy local simulators. When hardware is ready, implement new adapters without changing business logic.

## Development

```bash
# Backend
cd backend
npm run start:dev        # Watch mode
npm run build            # Production build
npm test                 # Unit tests
npm run test:e2e         # E2E tests
npm run prisma:studio    # Database GUI

# Lint
npm run lint

# Database
npx prisma migrate dev   # Create migration
npx prisma db seed       # Seed data
npx prisma generate      # Generate client
```

## License

Private - SafeRide Nepal
