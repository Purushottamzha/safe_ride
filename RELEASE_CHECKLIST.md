# SafeRide Nepal — Release Checklist v1.0.0

## Build Verification

- [ ] Backend — `npx tsc --noEmit` passes
- [ ] Backend — `npm run build` passes
- [ ] Admin Web — `npx tsc --noEmit` passes
- [ ] Admin Web — `npx vite build` passes
- [ ] Parent Web — `npx tsc --noEmit` passes
- [ ] Parent Web — `npx vite build` passes
- [ ] Driver App — builds successfully
- [ ] No ESLint errors
- [ ] No bundle size warnings (optimized)

## Docker

- [ ] `docker compose down -v` — clean teardown
- [ ] `docker compose up --build` — all 14 containers start
- [ ] PostgreSQL — migrations run on startup
- [ ] Redis — connectable
- [ ] Mosquitto — connectable
- [ ] OSRM — routing engine responds
- [ ] Backend — health endpoint returns 200
- [ ] Admin Web — accessible at http://localhost:5173
- [ ] Parent Web — accessible at http://localhost:5174
- [ ] Prometheus — targets UP at http://localhost:9090
- [ ] Grafana — accessible at http://localhost:3002
- [ ] Loki — logs visible in Grafana Explore

## Seed Data

- [ ] `npx prisma db seed` — 130 students, 130 parents, 5 schools, 15 buses, 17 drivers
- [ ] 30-day attendance history available
- [ ] Fuel/maintenance/incident records present

## Authentication

- [ ] Super Admin login: `admin@saferide.com` / `Admin@123456`
- [ ] School Admin login: `admin.srs001@saferide.com` / `Admin@123456`
- [ ] Driver login: `ram.driver0@saferide.com` / `Admin@123456`
- [ ] Parent login: `parent.stu_00001@saferide.com` / `Admin@123456`
- [ ] Invalid credentials rejected with error
- [ ] Token refresh works (session persists)
- [ ] Logout clears session

## RBAC

- [ ] Super Admin — sees all schools data
- [ ] School Admin — sees only their school's data
- [ ] Driver — cannot access admin pages (403)
- [ ] Parent — sees only their children's data

## CRUD Operations

- [ ] Students — list, create, detail, edit, delete
- [ ] Parents — list, create, detail, edit, delete
- [ ] Drivers — list, create, detail, edit, delete
- [ ] Buses — list, create, detail, edit, delete
- [ ] Routes — list, create, detail, delete
- [ ] Stops — list, create, detail, edit, delete
- [ ] Assignments — list, create, edit, calendar view
- [ ] Trips — list, create, detail, replay
- [ ] Incidents — list, create, assign, resolve
- [ ] Schools — list, create, detail, edit (super admin)
- [ ] Users — list, create, detail (super admin)

## QR Management

- [ ] Generate QR for individual student
- [ ] Bulk QR generation
- [ ] Download QR as PNG
- [ ] Print QR card
- [ ] Preview QR with payload details
- [ ] QR regeneration increments version
- [ ] Missing QR indicator works
- [ ] Export QR data

## QR Scanning (Gate Scanner)

- [ ] Board In — creates attendance record
- [ ] Exit Out — updates attendance with exit time
- [ ] Duplicate scan — rejected with "already scanned"
- [ ] Invalid token — rejected with 404
- [ ] Bus mismatch — rejected with error
- [ ] Offline queue — scans queued when disconnected
- [ ] Offline sync — queued scans delivered on reconnect

## Real-time (MQTT + Socket.IO)

- [ ] Backend connects to MQTT broker on startup
- [ ] Attendance events published to `saferide/attendance/scan`
- [ ] Backend status published to `saferide/backend/status`
- [ ] Bus locations stream via Socket.IO
- [ ] Dashboard updates without page refresh
- [ ] Notifications delivered in real-time

## Demo Mode

- [ ] Toggle in Settings → starts simulator
- [ ] Speed slider controls simulation pace
- [ ] Green banner appears on all pages
- [ ] Stop button stops simulator
- [ ] Buses move on map, KPI cards show live data
- [ ] Demo mode persists across page navigation

## Fleet Management

- [ ] Fleet dashboard loads KPI cards
- [ ] Vehicle Health tab — status cards with gauges
- [ ] Documents tab — upload/download/expiry tracking
- [ ] Insurance tab — policy tracking with expiry
- [ ] Fuel Logs tab — entries with cost tracking
- [ ] Reminders tab — maintenance schedule
- [ ] Document upload dialog works
- [ ] Expiry alerts shown (30-day warning)

## Reports & Analytics

- [ ] Analytics page — attendance trends, driver ranking, delay metrics, fleet utilization
- [ ] Reports page — daily attendance chart, monthly trends, driver performance, bus utilization
- [ ] Date range filtering works
- [ ] Tab navigation works

## Guided Workflow

- [ ] 8-step wizard: Student → Parent → Transport → Route → Bus → Driver → QR → Complete
- [ ] Step navigation (next/back)
- [ ] Form validation per step
- [ ] QR generation in step 7
- [ ] Completion summary

## Monitoring Stack

- [ ] Prometheus scrapes `/api/v1/metrics`
- [ ] Grafana dashboards render
- [ ] Loki collects backend logs
- [ ] Alertmanager configured
- [ ] cAdvisor container metrics available
- [ ] Node Exporter host metrics available

## Security

- [ ] No secrets in `.env` committed
- [ ] `.env.example` has placeholder values only
- [ ] JWT secret, refresh secret, encryption key all configurable
- [ ] CORS restricted to configured origins
- [ ] Helmet headers present
- [ ] Rate limiting active (429 on abuse)
- [ ] Input validation on all endpoints
- [ ] Soft delete on all entities

## Documentation

- [ ] README.md — project overview, setup instructions, architecture
- [ ] CHANGELOG.md — complete release history
- [ ] LICENSE — MIT
- [ ] SECURITY.md — auth, data protection, reporting
- [ ] CONTRIBUTING.md — code standards, PR process
- [ ] `.env.example` — all configurable variables
- [ ] `docs/FINAL_VALIDATION_REPORT.md` — 63 test cases
- [ ] `docs/PILOT_DEPLOYMENT_PLAN.md` — 2-school pilot plan
- [ ] `docs/PROJECT_STATUS.md` — current RC1 state
- [ ] `docs/environment-variables.md` — variable reference
- [ ] `docs/device-registry.md` — device management
- [ ] `docs/v1.0-product-scope.md` — scope and roadmap

## GitHub

- [ ] `.gitignore` excludes `node_modules`, `.env`, `dist`
- [ ] No large binary files committed
- [ ] Tag `v1.0.0-RC1` created (annotated)
- [ ] Release notes drafted

## Final Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Reviewer | | | |
| Approver | | | |
