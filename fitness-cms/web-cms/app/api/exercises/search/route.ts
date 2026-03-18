import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/exercises/search?q=supino&limit=20&category=chest&equipment=barbell
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const equipment = searchParams.get('equipment');

    if (!q || !q.trim()) {
      return apiError('Query parameter "q" is required', 400, 'INVALID_REQUEST');
    }

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    // Build Firestore query: fetch active exercises, optionally filtered by category/equipment
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      adminDb.collection('exercises').where('isActive', '==', true);

    if (category) {
      query = query.where('category', '==', category);
    }

    if (equipment) {
      query = query.where('equipment', '==', equipment);
    }

    // Fetch a reasonable batch for in-memory filtering
    // Firestore does not support full-text search natively
    const FETCH_LIMIT = 500;
    query = query.limit(FETCH_LIMIT);

    const snapshot = await query.get();

    const searchLower = q.toLowerCase().trim();

    // Filter in-memory: match against name.pt, name.en, and aliases[]
    let exercises = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        };
      })
      .filter((ex: any) => {
        const namePt = (ex.name?.pt || '').toLowerCase();
        const nameEn = (ex.name?.en || '').toLowerCase();
        const aliases = (ex.aliases || []) as string[];
        return (
          namePt.includes(searchLower) ||
          nameEn.includes(searchLower) ||
          aliases.some((alias: string) => alias.toLowerCase().includes(searchLower))
        );
      });

    const total = exercises.length;

    // Apply limit
    exercises = exercises.slice(0, limit);

    return NextResponse.json({ exercises, total });
  } catch (error: any) {
    return apiError('Failed to search exercises', 500, 'SEARCH_EXERCISES_ERROR', error);
  }
}
