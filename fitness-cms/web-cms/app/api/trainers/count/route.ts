import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/trainers/count - Get total active trainer count (public)
export async function GET() {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const countSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'trainer')
      .where('status', '==', 'active')
      .count()
      .get();

    return NextResponse.json({ total: countSnapshot.data().count }, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
  } catch (error: any) {
    return apiError('Failed to count trainers', 500, 'COUNT_TRAINERS_ERROR', error);
  }
}
