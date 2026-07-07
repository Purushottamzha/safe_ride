export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174',
  logLevel: process.env.LOG_LEVEL || 'debug',

  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://saferide:saferide_secret_2024@localhost:5432/saferide?schema=public',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://default:saferide_redis_2024@localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'saferide_jwt_super_secret_key_2024',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'saferide_refresh_super_secret_key_2024',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'saferide_encryption_key_32_bytes_2024!!!!',
  },

  throttle: {
    ttl: 60000,
    limit: 60,
  },

  qr: {
    tokenExpirationDays: 365,
    signatureAlgorithm: 'HS256',
  },

  hardware: {
    gpsPollIntervalMs: 5000,
    cameraEnabled: false,
    faceVerificationEnabled: false,
  },
});
