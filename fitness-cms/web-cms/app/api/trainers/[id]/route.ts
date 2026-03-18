import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { toPublicProfile } from '@/lib/trainer-utils';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/trainers/[id] - Get a single trainer's public profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const { id } = await params;
    const doc = await adminDb.collection('users').doc(id).get();

    if (!doc.exists) {
      return apiError('Trainer not found', 404, 'TRAINER_NOT_FOUND');
    }

    const data = doc.data()!;

    if (data.role !== 'trainer' || data.status !== 'active') {
      return apiError('Trainer not found', 404, 'TRAINER_NOT_FOUND');
    }

    return NextResponse.json(toPublicProfile(doc.id, data));
  } catch (error: any) {
    return apiError('Failed to fetch trainer', 500, 'FETCH_TRAINER_ERROR', error);
  }
}
