import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest, uploadProgramCover } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { isWithinProgramLimit, PLANS, PlanId } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// GET /api/programs - List programs for a trainer (or public programs for students)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const status = searchParams.get('status');
    const visibility = searchParams.get('visibility');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      adminDb.collection('programs');

    if (trainerId) {
      query = query.where('trainerId', '==', trainerId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (visibility) {
      query = query.where('visibility', '==', visibility);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    // If no trainerId, only return published+public programs (marketplace)
    if (!trainerId) {
      query = query
        .where('status', '==', 'published')
        .where('visibility', '==', 'public');
    }

    query = query.orderBy('createdAt', 'desc').limit(limit);

    const snapshot = await query.get();

    const programs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ programs, total: programs.length });
  } catch (error: any) {
    console.error('Error listing programs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list programs' },
      { status: 500 }
    );
  }
}

// POST /api/programs - Create a new program
export async function POST(request: NextRequest) {
  try {
    // Verify trainer auth
    const authResult = await verifyTrainerRequest(
      request.headers.get('authorization')
    );

    if (!authResult.isTrainer || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const contentType = request.headers.get('content-type') || '';

    let body: any;
    let coverFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const dataStr = formData.get('data') as string;
      body = JSON.parse(dataStr);
      coverFile = formData.get('cover') as File | null;
    } else {
      body = await request.json();
    }

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Check program limit based on trainer's plan
    const trainerDoc = await adminDb.collection('users').doc(authResult.uid).get();
    const trainerData = trainerDoc.data();
    const planId = (trainerData?.subscription?.plan || 'starter') as PlanId;
    const maxPrograms = PLANS[planId]?.features.maxPrograms ?? PLANS.starter.features.maxPrograms;

    if (maxPrograms !== -1) {
      const existingPrograms = await adminDb
        .collection('programs')
        .where('trainerId', '==', authResult.uid)
        .count()
        .get();

      if (!isWithinProgramLimit(maxPrograms, existingPrograms.data().count)) {
        return NextResponse.json(
          {
            error: `Limite de programas atingido. Seu plano ${PLANS[planId]?.name || 'Starter'} permite ate ${maxPrograms} programas. Faca upgrade para criar mais.`,
            code: 'PROGRAM_LIMIT_REACHED',
          },
          { status: 403 }
        );
      }
    }

    // Generate program ID
    const programRef = adminDb.collection('programs').doc();
    const programId = programRef.id;

    // Upload cover image if provided
    let coverImageURL = body.coverImageURL || '';
    if (coverFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
        return NextResponse.json(
          { error: 'Cover image must be JPEG, PNG, or WebP' },
          { status: 400 }
        );
      }
      if (coverFile.size > MAX_COVER_SIZE) {
        return NextResponse.json(
          { error: 'Cover image must be less than 10MB' },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const result = await uploadProgramCover(programId, buffer, coverFile.type);
      coverImageURL = result.url;
    }

    const programData = {
      trainerId: authResult.uid,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      coverImageURL,
      previewVideoURL: body.previewVideoURL || '',
      category: body.category || '',
      tags: body.tags || [],
      difficulty: body.difficulty || 'intermediate',
      duration: {
        weeks: body.duration?.weeks || 8,
        daysPerWeek: body.duration?.daysPerWeek || 4,
        avgSessionMinutes: body.duration?.avgSessionMinutes || 60,
      },
      requirements: {
        equipment: body.requirements?.equipment || [],
        fitnessLevel: body.difficulty || 'intermediate',
        prerequisites: body.requirements?.prerequisites || '',
      },
      content: {
        totalWorkouts: body.content?.totalWorkouts || 0,
        totalExercises: body.content?.totalExercises || 0,
        includesNutrition: body.content?.includesNutrition || false,
        includesSupplements: body.content?.includesSupplements || false,
        hasVideoGuides: body.content?.hasVideoGuides || false,
      },
      pricing: {
        type: body.pricing?.type || 'one_time',
        price: body.pricing?.price || 0,
        currency: body.pricing?.currency || 'BRL',
        ...(body.pricing?.originalPrice ? { originalPrice: body.pricing.originalPrice } : {}),
      },
      stats: {
        totalSales: 0,
        activeStudents: 0,
        completionRate: 0,
        averageRating: 0,
        totalReviews: 0,
      },
      weeks: body.weeks || [],
      status: body.status || 'draft',
      visibility: body.visibility || 'public',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(body.status === 'published' ? { publishedAt: FieldValue.serverTimestamp() } : {}),
    };

    await programRef.set(programData);

    return NextResponse.json(
      {
        id: programId,
        coverImageURL,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating program:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create program' },
      { status: 500 }
    );
  }
}
