import dotenv from 'dotenv';

dotenv.config();

/**
 * Reads an environment variable, falling back to a default when provided.
 * Throws if a required variable (no fallback) is missing.
 */
function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const nodeEnv = getEnv('NODE_ENV', 'development');

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  port: parseInt(getEnv('PORT', '4000'), 10),
  databaseUrl: getEnv('DATABASE_URL'),
  corsOrigin: getEnv('CORS_ORIGIN', '*'),
  jwtSecret: getEnv('JWT_SECRET', 'change-me-in-production'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  // Public base URL of this API, used to build email-verification links.
  apiUrl: getEnv('API_URL', 'http://localhost:4000/api'),
  // Public base URL of the client app, referenced in transactional emails.
  clientUrl: getEnv('CLIENT_URL', 'http://localhost:8081'),
  // Python ML microservice (FastAPI) base URL.
  mlServiceUrl: getEnv('ML_SERVICE_URL', 'http://localhost:8000'),
  email: {
    host: getEnv('SMTP_HOST', ''),
    port: parseInt(getEnv('SMTP_PORT', '587'), 10),
    user: getEnv('SMTP_USER', ''),
    password: getEnv('SMTP_PASSWORD', ''),
    from: getEnv('EMAIL_FROM', 'ExpenSee <no-reply@expensee.app>'),
  },
} as const;
