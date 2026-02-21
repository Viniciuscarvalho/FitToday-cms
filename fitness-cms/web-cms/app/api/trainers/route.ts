import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { toPublicProfile } from '@/lib/trainer-utils';
import { PublicTrainerListResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/trainers - List active trainers (public)
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const specialty = searchParams.get('specialty');
    const city = searchParams.get('city');

    // Base query: active trainers only
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb
      .collection('users')
      .where('role', '==', 'trainer')
      .where('status', '==', 'active');

    if (specialty) {
      query = query.where('profile.specialties', 'array-contains', specialty);
    }

    // When filtering by city, fetch all matching trainers and filter in-memory
    // (Firestore doesn't support nested field equality combined with other inequality/orderBy)
    if (city) {
      const snapshot = await query.orderBy('store.rating', 'desc').get();
      const allTrainers = snapshot.docs
        .map((doc) => toPublicProfile(doc.id, doc.data()))
        .filter((t) => t.profile.location?.city?.toLowerCase() === city.toLowerCase());

      const paged = allTrainers.slice(offset, offset + limit);

      const response: PublicTrainerListResponse = {
        trainers: paged,
        total: allTrainers.length,
        hasMore: offset + limit < allTrainers.length,
      };
      return NextResponse.json(response);
    }

    // Standard path: Firestore handles pagination
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query.orderBy('store.rating', 'desc').limit(limit).offset(offset).get();
    const trainers = snapshot.docs.map((doc) => toPublicProfile(doc.id, doc.data()));

    const response: PublicTrainerListResponse = {
      trainers,
      total,
      hasMore: offset + limit < total,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error listing trainers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list trainers' },
      { status: 500 }
    );
  }
}
