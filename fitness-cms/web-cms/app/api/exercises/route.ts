import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

/**
 * Slugify a string for use as a Firestore document ID.
 * Converts to lowercase, replaces spaces/special chars with hyphens,
 * and appends a short random suffix to avoid collisions.
 */
function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')    // remove non-alphanumeric
    .replace(/[\s_]+/g, '-')          // spaces/underscores to hyphens
    .replace(/-+/g, '-')              // collapse multiple hyphens
    .replace(/^-|-$/g, '');           // trim leading/trailing hyphens

  const suffix = Math.random().toString(36).substring(2, 8);
  return `${slug}-${suffix}`;
}

// GET /api/exercises - List exercises with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const equipment = searchParams.get('equipment');
    const source = searchParams.get('source');
    const level = searchParams.get('level');
    const isActiveParam = searchParams.get('isActive');
    const trainerId = searchParams.get('trainerId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const pageParam = searchParams.get('page');
    const offset = pageParam
      ? (parseInt(pageParam) - 1) * limit
      : parseInt(searchParams.get('offset') || '0');

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      adminDb.collection('exercises');

    // Default isActive to true unless explicitly set to 'false' or 'all'
    if (isActiveParam !== 'false' && isActiveParam !== 'all') {
      query = query.where('isActive', '==', true);
    } else if (isActiveParam === 'false') {
      query = query.where('isActive', '==', false);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    if (equipment) {
      query = query.where('equipment', '==', equipment);
    }

    if (source) {
      query = query.where('source', '==', source);
    }

    if (level) {
      query = query.where('level', '==', level);
    }

    if (trainerId) {
      query = query.where('trainerId', '==', trainerId);
    }

    // Firestore does not support full-text search natively.
    // When a search term is provided, we fetch a larger set and filter in-memory.
    const fetchLimit = search ? 500 : offset + limit;

    query = query.orderBy('name.pt', 'asc').limit(fetchLimit);

    const snapshot = await query.get();

    let exercises = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    // In-memory search filtering across name.pt, name.en, and aliases
    if (search) {
      const searchLower = search.toLowerCase();
      exercises = exercises.filter((ex: any) => {
        const namePt = (ex.name?.pt || '').toLowerCase();
        const nameEn = (ex.name?.en || '').toLowerCase();
        const aliases = (ex.aliases || []) as string[];
        return (
          namePt.includes(searchLower) ||
          nameEn.includes(searchLower) ||
          aliases.some((alias: string) => alias.toLowerCase().includes(searchLower))
        );
      });
    }

    const total = exercises.length;

    // Apply offset and limit after filtering
    exercises = exercises.slice(offset, offset + limit);

    return NextResponse.json(
      {
        exercises,
        total,
        page: pageParam ? parseInt(pageParam) : Math.floor(offset / limit) + 1,
        limit,
      },
      search
        ? undefined
        : { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } }
    );
  } catch (error: any) {
    return apiError('Failed to list exercises', 500, 'LIST_EXERCISES_ERROR', error);
  }
}

// POST /api/exercises - Create a trainer exercise
export async function POST(request: NextRequest) {
  try {
    // Verify trainer auth
    const authResult = await verifyTrainerRequest(
      request.headers.get('authorization')
    );

    if (!authResult.isTrainer || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name?.pt?.trim()) {
      return apiError('name.pt is required', 400, 'INVALID_REQUEST');
    }

    if (!body.name?.en?.trim()) {
      return apiError('name.en is required', 400, 'INVALID_REQUEST');
    }

    if (!body.category?.trim()) {
      return apiError('category is required', 400, 'INVALID_REQUEST');
    }

    if (!body.equipment?.trim()) {
      return apiError('equipment is required', 400, 'INVALID_REQUEST');
    }

    // Generate ID by slugifying name.en
    const exerciseId = slugify(body.name.en);

    const exerciseData = {
      name: {
        en: body.name.en.trim(),
        pt: body.name.pt.trim(),
      },
      aliases: body.aliases || [],
      description: body.description?.trim() || '',
      category: body.category.trim(),
      muscleGroups: {
        primary: body.muscleGroups?.primary || [],
        secondary: body.muscleGroups?.secondary || [],
      },
      equipment: body.equipment.trim(),
      force: body.force || null,
      level: body.level || 'intermediate',
      mechanic: body.mechanic || null,
      instructions: {
        en: body.instructions?.en || [],
        pt: body.instructions?.pt || [],
      },
      media: {
        thumbnailURL: body.media?.thumbnailURL || '',
        images: body.media?.images || [],
        gifURL: body.media?.gifURL || null,
        videoURL: body.media?.videoURL || null,
      },
      source: 'trainer' as const,
      trainerId: authResult.uid,
      isActive: true,
      isApproved: false,
      wgerBaseId: body.wgerBaseId || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('exercises').doc(exerciseId).set(exerciseData);

    return NextResponse.json(
      {
        id: exerciseId,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    return apiError('Failed to create exercise', 500, 'CREATE_EXERCISE_ERROR', error);
  }
}
