import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest, uploadProgramCover, uploadProgramPDF, uploadProgramVideo } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { isWithinProgramLimit, PLANS, PlanId } from '@/lib/constants';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// GET /api/programs - List programs for a trainer (or public programs for students)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const visibility = searchParams.get('visibility');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      adminDb.collection('programs');

    if (trainerId) {
      query = query.where('trainerId', '==', trainerId);
    }

    if (studentId) {
      query = query.where('studentId', '==', studentId);
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
    return apiError('Failed to list programs', 500, 'LIST_PROGRAMS_ERROR', error);
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
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const contentType = request.headers.get('content-type') || '';

    let body: any;
    let coverFile: File | null = null;
    let pdfFile: File | null = null;
    let videoFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const dataStr = formData.get('data') as string;
      body = JSON.parse(dataStr);
      coverFile = formData.get('cover') as File | null;
      pdfFile = formData.get('pdf') as File | null;
      videoFile = formData.get('video') as File | null;
    } else {
      body = await request.json();
    }

    // Validate required fields
    if (!body.title?.trim()) {
      return apiError('Title is required', 400, 'INVALID_REQUEST');
    }

    if (!body.description?.trim()) {
      return apiError('Description is required', 400, 'INVALID_REQUEST');
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
        return apiError('Cover image must be JPEG, PNG, or WebP', 400, 'INVALID_REQUEST');
      }
      if (coverFile.size > MAX_COVER_SIZE) {
        return apiError('Cover image must be less than 10MB', 400, 'INVALID_REQUEST');
      }
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const result = await uploadProgramCover(programId, buffer, coverFile.type);
      coverImageURL = result.url;
    }

    // Upload workout PDF if provided
    let workoutPdfUrl = '';
    let workoutPdfPath = '';
    if (pdfFile) {
      if (pdfFile.type !== 'application/pdf') {
        return apiError('Workout file must be a PDF', 400, 'INVALID_REQUEST');
      }
      if (pdfFile.size > 10 * 1024 * 1024) {
        return apiError('PDF must be less than 10MB', 400, 'INVALID_REQUEST');
      }
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const result = await uploadProgramPDF(programId, buffer, pdfFile.type);
      workoutPdfUrl = result.url;
      workoutPdfPath = result.path;
    }

    // Upload preview video if provided
    let previewVideoURL = body.previewVideoURL || '';
    if (videoFile) {
      if (!videoFile.type.startsWith('video/')) {
        return apiError('Preview file must be a video', 400, 'INVALID_REQUEST');
      }
      if (videoFile.size > 100 * 1024 * 1024) {
        return apiError('Video must be less than 100MB', 400, 'INVALID_REQUEST');
      }
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      const result = await uploadProgramVideo(programId, buffer, videoFile.type);
      previewVideoURL = result.url;
    }

    const programData = {
      trainerId: authResult.uid,
      ...(body.studentId ? { studentId: body.studentId } : {}),
      title: body.title.trim(),
      description: body.description?.trim() || '',
      coverImageURL,
      previewVideoURL,
      ...(workoutPdfUrl ? { workoutPdfUrl, workoutPdfPath } : {}),
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
    return apiError('Failed to create program', 500, 'CREATE_PROGRAM_ERROR', error);
  }
}
