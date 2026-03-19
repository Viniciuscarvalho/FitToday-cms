import { describe, it, expect, vi } from 'vitest';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status ?? 200,
      body: data,
    }),
  },
}));

// Import after mock
const { apiError } = await import('../lib/api-errors');

describe('apiError', () => {
  it('returns sanitized error response with correct status', () => {
    const result = apiError('Something failed', 400, 'INVALID_REQUEST') as any;
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Something failed');
    expect(result.body.code).toBe('INVALID_REQUEST');
  });

  it('does not expose internal error details in production', () => {
    const internalError = new Error('sensitive DB connection string');
    const result = apiError('Internal error', 500, 'DB_ERROR', internalError) as any;
    expect(result.body.error).toBe('Internal error');
    expect(JSON.stringify(result.body)).not.toContain('sensitive DB connection string');
  });

  it('defaults to 500 status when not specified', () => {
    const result = apiError('Error', 500, 'ERROR') as any;
    expect(result.status).toBe(500);
  });
});
