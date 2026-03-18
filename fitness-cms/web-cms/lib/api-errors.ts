import { NextResponse } from 'next/server';

export function apiError(
  message: string,
  status: number,
  code?: string,
  internalError?: unknown
): NextResponse {
  if (internalError) {
    console.error(`[${code ?? 'ERROR'}] ${message}:`, internalError);
  }
  return NextResponse.json(
    { error: message, ...(code && { code }) },
    { status }
  );
}
