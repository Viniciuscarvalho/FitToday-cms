import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { toPublicProfile } from '@/lib/trainer-utils';

export const dynamic = 'force-dynamic';

// GET /api/trainers/[id] - Get a single trainer's public profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { id } = await params;
    const doc = await adminDb.collection('users').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Trainer not found', code: 'TRAINER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const data = doc.data()!;

    if (data.role !== 'trainer' || data.status !== 'active') {
      return NextResponse.json(
        { error: 'Trainer not found', code: 'TRAINER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(toPublicProfile(doc.id, data));
  } catch (error: any) {
    console.error('Error fetching trainer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trainer' },
      { status: 500 }
    );
  }
}
