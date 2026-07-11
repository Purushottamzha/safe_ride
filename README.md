# SafeRide Nepal 🚍

**School Transport Management Platform** — v1.0.0-RC1

A production-ready school transport management system built for Kathmandu Valley, featuring QR-based attendance, real-time GPS tracking, MQTT-powered device communication, and full operational control for school administrators, parents, and drivers.

---

## Architecture

```
saferide-nepal/
├── backend/           # NestJS REST API (TypeScript)
├── admin-web/         # Admin Dashboard (React 19 / Vite / MUI)
├── parent-web/        # Parent Web Portal (React 19 / Vite / MUI)
├── driver-app/        # Driver Mobile App (React Native)
├── device-scanner/    # Android QR scanner app
├── shared/            # Shared types and utilities
├── docker/            # Docker configurations
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens), Passport, Argon2 |
| Real-time | MQTT (Mosquitto) + Socket.IO |
| API Docs | Swagger/OpenAPI |
| Admin Web | React 19, Vite 5, MUI 6, Emotion, Framer Motion |
| Parent Web | React 19, Vite 5, MUI 6 |
| Driver App | React Native |
| Mapping | OpenStreetMap + Leaflet |
| Routing | OSRM (self-hosted) |
| Monitoring | Prometheus, Grafana, Loki, Alertmanager |
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

### Manual Start

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

# 3. Start admin web (another terminal)
cd admin-web
npm install
npm run dev

# 4. Start parent web (another terminal)
cd parent-web
npm install
npm run dev
```

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@saferide.com | Admin@123456 |
| School Admin | admin.srs001@saferide.com | Admin@123456 |
| Driver | ram.driver0@saferide.com | Admin@123456 |
| Parent | parent.stu_00001@saferide.com | Admin@123456 |

## Key Features

### Admin Portal
- **Operations Center** — Live KPI dashboard, fleet map, activity feed, attendance charts
- **Transport Control Center** — Real-time bus tracking, emergency alerts, map style toggle
- **Student Management** — Full CRUD, QR token generation, pending approval workflow
- **Guided Admission Workflow** — 8-step wizard: student → parent → transport → QR
- **Fleet Management** — Health scores, documents, insurance, fuel logs, maintenance reminders
- **QR Management** — Generate individual/bulk QR, print cards, export
- **Trip Management** — Create, start, complete, cancel with live progress
- **Incident Management** — Report, assign, resolve with emergency alert chain
- **Daily Operations Dashboard** — Single-screen operations center with 8 KPIs
- **Kathmandu Valley Tools** — Rain mode, road closure, traffic alerts, notification broadcast
- **Demo Mode** — One-click simulation with speed control and animated banner
- **Analytics & Reports** — Attendance trends, driver safety scores, bus utilization
- **Notifications** — In-app delivery with real-time WebSocket updates

### Parent Portal
- **Live Bus Tracking** — Real-time map with ETA, bus position, route
- **Attendance Timeline** — 30-day history with board/exit times
- **Emergency Contacts** — Quick-access SOS and emergency info
- **Notification Preferences** — Toggle notification channels

### Driver App
- **Driving-first UX** — Large touch targets, progress bar, action grid
- **SOS FAB** — Emergency button with pulse animation
- **Trip Lifecycle** — Ready → Started → Reached Stop → Boarding → Reached School → Complete
- **Student List** — Per-stop boarding status

### QR Attendance
- Offline-first scanning with local queue
- Duplicate scan prevention
- Bus ownership validation
- MQTT-powered real-time sync
- Parent notification on scan

## API Documentation

Swagger docs (when running):
```
http://localhost:3000/api/docs
```

## Documentation

| Document | Location |
|----------|----------|
| Final Validation Report (58 tests) | [docs/FINAL_VALIDATION_REPORT.md](docs/FINAL_VALIDATION_REPORT.md) |
| Product Scope & Roadmap | [docs/v1.0-product-scope.md](docs/v1.0-product-scope.md) |
| Project Status | [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) |
| Environment Variables | [docs/environment-variables.md](docs/environment-variables.md) |
| Device Registry | [docs/device-registry.md](docs/device-registry.md) |
| Pilot Deployment Plan | [docs/PILOT_DEPLOYMENT_PLAN.md](docs/PILOT_DEPLOYMENT_PLAN.md) |
| Product Specification | [SPEC.md](SPEC.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| Security Policy | [SECURITY.md](SECURITY.md) |

## Monitoring

The monitoring stack provides:
- **Prometheus** — Metrics collection (http://localhost:9090)
- **Grafana** — Dashboards and alerting (http://localhost:3002, admin/admin)
- **Loki** — Log aggregation
- **Alertmanager** — Alert routing
- **cAdvisor** — Container metrics
- **Node Exporter** — Host metrics

## Development

```bash
# Backend
cd backend
npm run start:dev        # Watch mode
npm run build            # Production build
npm test                 # Unit tests
npm run test:e2e         # E2E tests

# Lint
npm run lint

# Database
npx prisma migrate dev   # Create migration
npx prisma db seed       # Seed 130 students, 5 schools, 15 buses
npx prisma generate      # Generate Prisma client
npx prisma studio        # Database GUI
```

## Docker

```bash
# Full stack
docker compose up --build

# Individual services
docker compose up postgres redis -d
docker compose up backend
docker compose up admin-web parent-web

# Monitoring stack
docker compose up prometheus grafana loki alertmanager cadvisor node-exporter -d
```

## Release Checklist

See [docs/FINAL_VALIDATION_REPORT.md](docs/FINAL_VALIDATION_REPORT.md) for the complete 58-test-case validation report.

## License

Private — SafeRide Nepal
