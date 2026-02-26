import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest, uploadProgramCover, deleteProgramCover, uploadProgramPDF, uploadProgramVideo } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const programDoc = await adminDb.collection('programs').doc(programId).get();

    if (!programDoc.exists) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
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
    console.error('Error getting program:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get program' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Verify ownership
    const programDoc = await adminDb.collection('programs').doc(programId).get();

    if (!programDoc.exists) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const existingData = programDoc.data()!;

    if (existingData.trainerId !== authResult.uid) {
      return NextResponse.json({ error: 'Not authorized to edit this program' }, { status: 403 });
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

    // Upload workout PDF if provided
    if (pdfFile) {
      if (pdfFile.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Workout file must be a PDF' }, { status: 400 });
      }
      if (pdfFile.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'PDF must be less than 10MB' }, { status: 400 });
      }
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const result = await uploadProgramPDF(programId, buffer, pdfFile.type);
      body.workoutPdfUrl = result.url;
      body.workoutPdfPath = result.path;
    }

    // Upload preview video file if provided
    if (videoFile) {
      if (!videoFile.type.startsWith('video/')) {
        return NextResponse.json({ error: 'Preview file must be a video' }, { status: 400 });
      }
      if (videoFile.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: 'Video must be less than 100MB' }, { status: 400 });
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
    console.error('Error updating program:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update program' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Verify ownership
    const programDoc = await adminDb.collection('programs').doc(programId).get();

    if (!programDoc.exists) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const existingData = programDoc.data()!;

    if (existingData.trainerId !== authResult.uid) {
      return NextResponse.json({ error: 'Not authorized to delete this program' }, { status: 403 });
    }

    // Check if program has active students
    if (existingData.stats?.activeStudents > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a program with active students. Archive it instead.' },
        { status: 400 }
      );
    }

    // Soft delete: archive the program
    await adminDb.collection('programs').doc(programId).update({
      status: 'archived',
      visibility: 'private',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: programId, status: 'archived' });
  } catch (error: any) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete program' },
      { status: 500 }
    );
  }
}
