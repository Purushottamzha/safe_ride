# Pilot Deployment Plan — SafeRide Nepal

## 1. Overview

### Objective
Deploy SafeRide Nepal at 2 Kathmandu Valley schools for a 4-week pilot, validating the platform in a live school transport environment before full rollout.

### Pilot Schools

| School | Code | Buses | Drivers | Students | Route Complexity |
|--------|------|-------|---------|----------|------------------|
| Shree Janata Secondary School | SRS001 | 5 | 6 | 130 | Medium — 8 routes |
| Kendriya Vidyalaya (Proposed) | SRS002 | 3 | 4 | 80 | Low — 5 routes |

### Success Criteria
- 95%+ QR scan success rate (board in / exit out)
- 100% attendance data accuracy vs manual register
- < 5s end-to-end QR scan → parent notification latency (p95)
- Zero unplanned downtime during school hours (7:00–10:00, 14:00–17:00)
- Parent satisfaction score ≥ 4/5

---

## 2. Deployment Timeline

### Week 1 — Preparation

| Day | Activity | Owner |
|-----|----------|-------|
| Mon | Server provisioning, Docker setup, DNS configuration | DevOps |
| Tue | Database migration, seed data import | Backend |
| Wed | School onboarding: student/parent/bus/driver data import | Admin |
| Thu | QR card printing and distribution (130 cards) | Admin |
| Fri | Driver training session (2h) + app installation | Training |
| Sat | Parent notification: welcome message + portal access | Admin |
| Sun | Final system check, dry run with 1 bus | All |

### Week 2 — Soft Launch (School 1)

- **Mon–Tue:** Shadow mode — run parallel with manual register
- **Wed:** Go-live at School 1 — QR attendance replaces manual register
- **Thu–Fri:** Monitoring + bug fixes + parent feedback collection

### Week 3 — Scale (School 2)

- **Mon:** School 2 onboarding and data import
- **Tue:** Driver training, QR card distribution
- **Wed:** Go-live at School 2
- **Thu–Fri:** Dual-school monitoring

### Week 4 — Review

| Day | Activity |
|-----|----------|
| Mon | Survey parents, drivers, school admins |
| Tue | Analyze metrics (scan rate, latency, incidents) |
| Wed | Compile pilot report |
| Thu | Go/no-go decision for full rollout |
| Fri | Present findings to stakeholders |

---

## 3. Infrastructure Requirements

### Server (On-Premise or Cloud)

| Component | Specification | Cost (NPR/month) |
|-----------|--------------|------------------|
| CPU | 4 cores (Intel Xeon / AMD EPYC) | |
| RAM | 16 GB | |
| Storage | 100 GB SSD | |
| Network | 100 Mbps dedicated | |
| **Estimated Total** | | **~15,000–25,000 NPR** |

### Hardware Per School

| Item | Qty | Unit Cost (NPR) |
|------|-----|-----------------|
| Android scanner device | 2 | 15,000 |
| QR card (PVC, printed) | 130 | 50 |
| Driver smartphone (if needed) | 5 | 12,000 |
| UPS for server | 1 | 25,000 |
| **Estimated Total Per School** | | **~145,000 NPR** |

### Software Licenses

| Service | Cost |
|---------|------|
| PostgreSQL 16 | Free (Open Source) |
| Redis 7 | Free |
| Mosquitto MQTT | Free |
| Prometheus + Grafana | Free |
| OSRM | Free |
| Map tiles (OpenStreetMap) | Free |
| **Total** | **0 NPR** |

---

## 4. Training Plan

### School Admin Training (1.5 hours)

1. Login and dashboard overview (15 min)
2. Student management (15 min)
3. Trip creation and monitoring (15 min)
4. QR management — generate, print, scan (15 min)
5. Incident reporting (10 min)
6. Reports and analytics (10 min)
7. Q&A (10 min)

### Driver Training (1 hour)

1. App installation and login (10 min)
2. Trip lifecycle — start, route, complete (15 min)
3. QR scanning at stops (10 min)
4. SOS button and emergency procedure (10 min)
5. Battery and GPS management (5 min)
6. Q&A (10 min)

### Parent Onboarding (email + video)

1. Welcome email with portal link (5 min read)
2. 2-minute video: how to track your child's bus
3. Notification preferences setup
4. Emergency contact information

---

## 5. Rollback Plan

### Trigger Conditions
- QR scan failure rate > 10% for 2 consecutive days
- Backend outage > 30 minutes during school hours
- Data accuracy discrepancy > 2% vs manual register
- Security incident (breach, unauthorized access)

### Rollback Procedure

1. Switch to manual attendance register immediately
2. Parent notification via SMS/phone: "System maintenance — manual attendance today"
3. Keep Docker containers running for debugging
4. Root cause analysis within 24 hours
5. Re-deploy fix in staging, validate, then promote to production
6. Communicate resolution to all stakeholders

---

## 6. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Power outage during school hours | Medium | High | UPS for server; offline queue on scanners |
| Internet failure | Medium | Medium | MQTT local broker + offline queue; auto-sync on reconnect |
| Scanner device failure | Low | Medium | 2 scanners per school (redundancy) |
| Driver app crash | Low | Low | Trip continues without live tracking; data entered post-trip |
| Parent portal overload | Low | Low | Rate limiting; auto-scaling if cloud-hosted |
| QR card loss/damage | Medium | Low | Re-print from admin portal (2 min) |
| Data entry error by driver | Medium | Low | Admin can correct attendance records |
| Server hardware failure | Low | High | Daily backups; replacement server within 4 hours |

---

## 7. Maintenance Schedule

| Frequency | Activity |
|-----------|----------|
| Daily | Backup database, check container health, review error logs |
| Weekly | Apply OS security patches, review Prometheus alerts, rotate logs |
| Monthly | Prune old data (90+ day attendance), review audit logs |
| Quarterly | Update OSRM routing data, review capacity planning, SSL renewal |
| Annually | Full security audit, disaster recovery drill, version upgrade assessment |

---

## 8. Data Backup Strategy

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Full database dump | Daily | 30 days | Server + cloud storage |
| Database WAL archive | Continuous | 7 days | Server |
| Docker volume snapshots | Weekly | 90 days | Cloud storage |
| Configuration files | On change | Git history | GitHub repository |

### Recovery Time Objective (RTO): 2 hours
### Recovery Point Objective (RPO): 1 hour

---

## 9. Privacy & Security Considerations

- All student/parent data stored in Nepal on school premises
- No third-party data sharing
- QR codes contain no personal information (only opaque token)
- All API traffic uses HTTPS
- Parent data accessible only to authorized school staff
- Driver app collects only GPS during active trips
- Data retention: student records kept for 3 years after graduation
- Parent consent required for QR attendance system
- Right to opt out: alternative manual attendance available
- GDPR-style data access request process available

---

## 10. Estimated Operational Costs

### Monthly Recurring

| Item | Cost (NPR) |
|------|------------|
| Server hosting | 15,000–25,000 |
| Internet (dedicated) | 5,000–10,000 |
| Electricity | 3,000–5,000 |
| Maintenance engineer (retainer) | 10,000–15,000 |
| **Total (per school pair)** | **33,000–55,000 NPR** |

### One-Time Setup (Per School)

| Item | Cost (NPR) |
|------|------------|
| Scanners (×2) | 30,000 |
| PVC QR cards (×130) | 6,500 |
| UPS | 25,000 |
| Driver smartphones (×5, if needed) | 60,000 |
| Installation & training | 20,000 |
| **Total** | **141,500 NPR** |

---

## 11. Conclusion

The pilot deployment plan provides a structured, low-risk approach to introducing SafeRide Nepal in real school environments. With 2 weeks of preparation, 2 weeks of phased rollout, and 1 week of evaluation, the pilot validates the platform's readiness for broader deployment across Kathmandu Valley.

The key risk mitigations — offline-first scanning, redundant hardware, clear rollback procedures, and comprehensive training — ensure that even in the event of technical issues, school transport operations are never disrupted.
