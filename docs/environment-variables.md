# SafeRide Nepal — Environment Variables

| Variable | Description | Required | Default | Example |
|---|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://saferide:saferide_secret_2024@localhost:5432/saferide?schema=public` | `postgresql://user:pass@host:5432/db?schema=public` |
| `REDIS_URL` | Redis connection string | Yes | `redis://default:saferide_redis_2024@localhost:6379` | `redis://user:pass@host:6379` |
| `JWT_SECRET` | Secret key for signing JWT access tokens | Yes | `saferide_jwt_super_secret_key_2024` | `your-256-bit-secret` |
| `JWT_REFRESH_SECRET` | Secret key for signing JWT refresh tokens | Yes | `saferide_refresh_super_secret_key_2024` | `your-refresh-secret` |
| `JWT_EXPIRATION` | Access token expiration duration | No | `15m` | `15m`, `1h`, `7d` |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration duration | No | `7d` | `7d`, `30d` |
| `PORT` | Backend API server port | No | `3000` | `3000` |
| `NODE_ENV` | Node environment (development / production / test) | No | `development` | `production` |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins | No | `http://localhost:5173,http://localhost:5174` | `http://localhost:5173,http://localhost:5174` |
| `LOG_LEVEL` | Winston log level | No | `debug` | `debug`, `info`, `warn`, `error` |
| `ENCRYPTION_KEY` | Key used for encryption operations | Yes | `saferide_encryption_key_32_bytes_2024!!!!` | `a-32-byte-key-string-for-aes!!` |
