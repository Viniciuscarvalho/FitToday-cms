import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest, uploadProgramCover, deleteProgramCover, uploadProgramPDF, uploadProgramVideo } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// GET /api/programs/[id] - Get a single program
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = params.id;

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const programDoc = await adminDb.collection('programs').doc(programId).get();

    if (!programDoc.exists) {
      return apiError('Program not found', 404, 'NOT_FOUND');
    }

    const data = programDoc.data()!;

    return NextResponse.json({
      id: programDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error: any) {
    return apiError('Failed to get program', 500, 'GET_PROGRAM_ERROR', error);
  }
}

// PUT /api/programs/[id] - Update a program
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = params.id;

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

    // Verify ownership
    const programDoc = await adminDb.collection('programs').doc(programId).get();

    if (!programDoc.exists) {
      return apiError('Program not found', 404, 'NOT_FOUND');
    }

    const existingData = programDoc.data()!;

    if (existingData.trainerId !== authResult.uid) {
      return apiError('Not authorized to edit this program', 403, 'FORBIDDEN');
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

    // Upload new cover image if provided
    let coverImageURL = body.coverImageURL;
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
    if (pdfFile) {
      if (pdfFile.type !== 'application/pdf') {
        return apiError('Workout file must be a PDF', 400, 'INVALID_REQUEST');
      }
      if (pdfFile.size > 10 * 1024 * 1024) {
        return apiError('PDF must be less than 10MB', 400, 'INVALID_REQUEST');
      }
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const result = await uploadProgramPDF(programId, buffer, pdfFile.type);
      body.workoutPdfUrl = result.url;
      body.workoutPdfPath = result.path;
    }

    // Upload preview video file if provided
    if (videoFile) {
      if (!videoFile.type.startsWith('video/')) {
        return apiError('Preview file must be a video', 400, 'INVALID_REQUEST');
      }
      if (videoFile.size > 100 * 1024 * 1024) {
        return apiError('Video must be less than 100MB', 400, 'INVALID_REQUEST');
      }
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      const result = await uploadProgramVideo(programId, buffer, videoFile.type);
      body.previewVideoURL = result.url;
    }

    // Build update data - only include fields that were provided
    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (coverImageURL !== undefined) updateData.coverImageURL = coverImageURL;
    if (body.previewVideoURL !== undefined) updateData.previewVideoURL = body.previewVideoURL;
    if (body.workoutPdfUrl !== undefined) updateData.workoutPdfUrl = body.workoutPdfUrl;
    if (body.workoutPdfPath !== undefined) updateData.workoutPdfPath = body.workoutPdfPath;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.requirements !== undefined) updateData.requirements = body.requirements;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.pricing !== undefined) updateData.pricing = body.pricing;
    if (body.weeks !== undefined) updateData.weeks = body.weeks;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;

    if (body.status !== undefined) {
      updateData.status = body.status;
      // Set publishedAt when publishing for the first time
      if (body.status === 'published' && existingData.status !== 'published') {
        updateData.publishedAt = FieldValue.serverTimestamp();
      }
    }

    await adminDb.collection('programs').doc(programId).update(updateData);

    return NextResponse.json({
      id: programId,
      ...(coverImageURL ? { coverImageURL } : {}),
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return apiError('Failed to update program', 500, 'UPDATE_PROGRAM_ERROR', error);
  }
}

// DELETE /api/programs/[id] - Archive a program (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = params.id;

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

    // Verify ownership
    const programDoc = await adminDb.collection('programs').doc(programId).get();

    if (!programDoc.exists) {
      return apiError('Program not found', 404, 'NOT_FOUND');
    }

    const existingData = programDoc.data()!;

    if (existingData.trainerId !== authResult.uid) {
      return apiError('Not authorized to delete this program', 403, 'FORBIDDEN');
    }

    // Check if program has active students
    if (existingData.stats?.activeStudents > 0) {
      return apiError('Cannot delete a program with active students. Archive it instead.', 400, 'INVALID_REQUEST');
    }

    // Soft delete: archive the program
    await adminDb.collection('programs').doc(programId).update({
      status: 'archived',
      visibility: 'private',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: programId, status: 'archived' });
  } catch (error: any) {
    return apiError('Failed to delete program', 500, 'DELETE_PROGRAM_ERROR', error);
  }
}
