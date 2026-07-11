# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.0-RC1 | ✅ |
| < 1.0.0 | ❌ |

## Authentication

- Argon2 password hashing with per-user salts
- JWT access tokens (15m expiry) with refresh token rotation (7d expiry)
- Account lockout after 5 failed login attempts (15m cooldown)
- Session invalidation on password change

## Authorization

- Role-Based Access Control (SUPER_ADMIN, SCHOOL_ADMIN, DRIVER, PARENT)
- Route-level guards enforce permissions on every endpoint
- School-scoped data isolation — school admins only see their school's data
- Soft delete on all entities preserves audit trail

## Data Protection

- All API traffic must use HTTPS in production
- Encryption at rest via PostgreSQL TDE (production) or disk encryption
- Audit logging on create, update, and delete operations
- Input validation via class-validator DTOs
- SQL injection prevention via Prisma ORM parameterized queries

## API Security

- Helmet security headers (XSS, content-type sniffing, frameguard)
- CORS restricted to configured origins
- Rate limiting via @nestjs/throttler (default: 10req/10s per IP)
- Request body size limits
- API key authentication for device endpoints

## MQTT Security

- Username/password authentication on broker
- Topic-based access control via Mosquitto ACL
- Backend validates all incoming MQTT messages before processing
- Device API keys required for MQTT publishing

## Reporting a Vulnerability

Contact the project maintainers directly. Do not open public issues for security vulnerabilities.
