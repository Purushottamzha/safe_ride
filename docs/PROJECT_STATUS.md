# SafeRide Nepal - Project Status

Last updated: 2026-07-09

This file is the single source of truth for v1.0 delivery status. Update it
whenever a module is completed, started, blocked, or materially changed.

## Overall Progress

Overall: 68%

Backend: 95%

Android Scanner: 100%

MQTT: 100%

Attendance: 100%

GPS: 90%

Admin Portal: 40%

Parent Portal: 45%

Driver Portal: 0%

Notifications: 30%

Reports: 10%

Analytics: 5%

Deployment: 70%

Documentation: 58%

## Completed

- [x] QR scanner foundation
- [x] MQTT broker integration
- [x] Scanner offline queue foundation
- [x] Attendance scan pipeline
- [x] Authentication foundation
- [x] JWT refresh token foundation
- [x] RBAC foundation
- [x] Audit log foundation
- [x] PostgreSQL and Prisma schema foundation
- [x] Docker Compose foundation
- [x] Device registration and API key flow
- [x] MQTT credential provisioning foundation
- [x] Admin student detail production-style profile
- [x] Parent dashboard v1.0 home experience
- [x] v1.0 product scope document

## In Progress

- [ ] Transport Control Center
- [ ] Admin portal production polish
- [ ] Parent live tracking
- [ ] Parent notification experience
- [ ] Device monitoring dashboard
- [ ] Route and trip replay workflows
- [ ] Reports and analytics screens
- [ ] Production documentation

## Remaining

- [ ] Driver portal or driver web/app workflow
- [ ] Bulk student import/export
- [ ] Bulk QR generation and print flow
- [ ] Manual attendance correction with audit UI
- [ ] Full notification center event matrix
- [ ] Browser push notification readiness
- [ ] Fleet maintenance workflow
- [ ] Route drawing and OSRM ETA integration
- [ ] Geofencing rules and alerts
- [ ] Scanner diagnostics history
- [ ] Monitoring stack documentation
- [ ] Backup and restore procedure
- [ ] Password reset flow
- [ ] Session history screen
- [ ] 2FA-ready settings
- [ ] End-to-end pilot test script

## Module Status

| Module | Status | Notes |
|---|---|---|
| Authentication | In Progress | Login, JWT, refresh, RBAC foundations exist. Password reset, session history, and 2FA readiness remain. |
| Student Management | In Progress | CRUD and detail view exist. Bulk import/export, QR print, pickup/drop metadata, and richer guardian operations remain. |
| Parent Portal | In Progress | Parent web exists and now has a v1.0-style dashboard with live ETA, map, student, driver, bus, emergency, analytics, and notifications. Needs dedicated live tracking hardening, calendar, settings, and notification UX. |
| Driver Portal | Not Started | Driver-facing workflow needs a clear app/web target and implementation. |
| Fleet Management | In Progress | Bus CRUD exists. Maintenance, mileage, insurance, scanner/GPS health, and current occupancy need completion. |
| Route Management | In Progress | Route/stops exist. Draw/edit map workflow, OSRM ETA, replay, and geofencing need completion. |
| Transport Control Center | In Progress | Control Center screen is present. Needs hardening, filtering, alerts, interpolation, health indicators, and tests. |
| Live Tracking | In Progress | Socket.IO tracking gateway and parent/admin listeners exist. Needs smoothing, role scoping verification, and GPS-loss states. |
| Attendance | Complete Foundation | QR scan, MQTT scan, duplicate protection, and attendance records exist. Manual correction/audit UI remains. |
| Notification Center | In Progress | Notification module and gateway exist. Needs event matrix, unread UX, and push-ready integration. |
| Analytics | Early | API and admin screen foundations exist. Needs product-grade charts, exports, and validation. |
| Device Monitoring | In Progress | Device registry exists. Scanner diagnostics, heartbeat history, and alerting remain. |
| System Settings | Not Started | Needs school profile, academic year, templates, roles/permissions UI, backup/restore. |
| Platform Security | In Progress | Helmet, validation, rate limiting, JWT, RBAC, Prisma, audit foundations exist. Needs production review and hardening checklist. |

## Current Engineering Focus

1. Finish the Transport Control Center as the flagship v1.0 operations screen.
2. Harden real-time tracking event names, payloads, auth, and offline behavior.
3. Upgrade parent live tracking and notification experience.
4. Upgrade admin workflows for students, fleet, routes, devices, and attendance.
5. Add driver-facing trip workflow.

## Blockers and Risks

- Driver portal scope is not yet implemented.
- Some real-time events use colon naming (`bus:location`) while the v1.0 plan also proposes dotted names (`bus.location.updated`). Choose a compatibility strategy before broadening clients.
- Bundle size warnings exist in admin-web and should be addressed during frontend hardening.
- Real school deployment requires parental consent and retention policy enforcement.
- Production secrets, backups, TLS, and monitoring still need operational hardening.

## Update Rule

After each meaningful implementation change:

- Update the relevant percentage only when actual working functionality changes.
- Move checklist items between Completed, In Progress, and Remaining.
- Add blockers when a task cannot safely proceed.
- Keep `docs/v1.0-product-scope.md` aligned when architecture or contracts change.
