const REQUIRED_ENV_VARS = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const msg = `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}`;
    console.error(`[ENV] ${msg}`);
    // Log but don't crash — Firebase Admin already handles missing credentials gracefully
  }
}
