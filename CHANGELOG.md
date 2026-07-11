# Changelog

## [v1.0.0-RC1] — July 2026

### Backend
- NestJS REST API with modular architecture (auth, students, parents, drivers, buses, routes, trips, attendance, incidents, notifications, fleet, reports, analytics)
- Prisma ORM with PostgreSQL schema covering 14 modules
- JWT authentication with refresh token rotation and account lockout
- RBAC with SUPER_ADMIN, SCHOOL_ADMIN, DRIVER, PARENT roles
- MQTT integration for real-time device communication and offline queue
- WebSocket gateway for live bus tracking and notifications
- Swagger/OpenAPI documentation
- Rate limiting, Helmet security headers, input validation
- Audit logging on all entities
- Prometheus metrics endpoint
- Seed script: 5 schools, 15 buses, 17 drivers, 130 students/parents, 30-day history

### Admin Web
- Operations Center dashboard with live KPI cards, fleet map, activity feed
- Student, Parent, Driver, Bus, Route, Stop full CRUD with DataTable
- Transport Control Center with real-time bus tracking and emergency alerts
- QR Management module (generate, bulk, print, export)
- Fleet Management dashboard (health scores, documents, insurance, fuel, reminders)
- Guided Admission Workflow (8-step wizard: student → parent → transport → QR)
- Daily Operations dashboard
- Kathmandu Valley operational tools (rain mode, road closure, traffic alerts)
- Analytics & Reports pages with charts
- Demo Mode toggle with animated banner and backend simulator integration
- UI Consistency Audit fixes: standardized PageHeader, card padding, heading weights

### Parent Web
- Dashboard with ETA hero card, live map, trip info, driver/bus card
- Emergency contacts and SOS FAB
- Attendance timeline and notification preferences
- Real-time bus tracking

### Driver App
- Home screen with driving-first UX, live trip card, SOS FAB
- Active trip screen with progress bar, action grid, student list
- Animated pulse indicators and large touch targets

### Device Scanner
- Offline-first QR scanning with local queue
- MQTT communication for attendance events
- Hardware abstraction layer for ESP32/GPS/Camera

### Infrastructure
- Docker Compose — 14 containers (postgres, redis, mosquitto, osrm, backend, admin-web, parent-web, prometheus, grafana, loki, alertmanager, cadvisor, node-exporter, uptime-kuma)
- Prometheus + Grafana + Loki monitoring stack
- Self-hosted OSRM routing engine for ETA calculation
- GitHub Actions CI/CD workflows

### Documentation
- Final Validation Report: 58 test cases across 15 categories
- Project Status tracking
- Environment variables reference
- Device registry documentation
- Product scope specification

---

## [v0.9.0] — June 2026

### Backend
- Student CRUD with QR token generation
- Parent registration and approval workflow
- Driver CRUD with assignment tracking
- Bus CRUD with GPS tracking endpoints
- Route and stop management
- Trip management (create, start, complete, cancel)
- Attendance scan pipeline with duplicate prevention
- Incident management (report, assign, resolve)
- Notification system with in-app delivery
- Fleet maintenance and fuel log endpoints
- Basic analytics and reporting
- Prisma migrations for all modules

### Admin Web
- Student, Parent, Driver, Bus, Route list pages with DataTable
- Detail pages for students, parents, drivers, buses
- Gate scanner for QR attendance
- Basic dashboard with stats
- AlertBanner, StatusChip, GlassCard component library

### Parent Web
- Dashboard with child status cards
- Attendance timeline
- Notification preferences

### Driver App (React Native)
- Home screen with trip status
- Active trip screen skeleton
- SOS button

### Infrastructure
- Docker Compose with backend, postgres, redis, mosquitto
- Basic monitoring setup

---

## [v0.5.0] — May 2026

### Backend
- Project scaffolding with NestJS
- Authentication module (login, register, refresh, logout)
- JWT implementation with access/refresh tokens
- Prisma schema foundation (users, schools, students, parents, drivers, buses, routes, trips, attendance)
- RBAC foundation with role guards
- Basic CRUD for schools and users

### Admin Web
- Login page
- Basic routing and authentication flow
- School management pages

### Infrastructure
- Docker Compose foundation
- PostgreSQL and Redis setup
- MQTT broker configuration

---

## [v0.1.0] — April 2026

- Project initialization
- Monorepo structure
- Technology stack selection
- Architecture planning
- Development environment setup
