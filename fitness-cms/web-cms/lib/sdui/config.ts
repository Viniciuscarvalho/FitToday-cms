export const SDUI_CONFIG = {
  schemaVersion: '1.0.0',
  minClientVersion: '1.0.0',
  sduiVersion: '1.0',
  defaultCachePolicy: { maxAgeSeconds: 60, staleWhileRevalidate: true },
  defaultRefreshPolicy: { type: 'time-based' as const, intervalSeconds: 300 },
  enableSchemaValidation: process.env.NODE_ENV === 'development',
} as const;
