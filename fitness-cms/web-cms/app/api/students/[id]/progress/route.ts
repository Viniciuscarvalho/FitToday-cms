import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest, uploadProgressPhoto } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// GET /api/students/[id]/progress - List progress entries for a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
    if (!authResult.isTrainer || !authResult.uid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { id: studentId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const snapshot = await adminDb
      .collection('progress_entries')
      .where('trainerId', '==', authResult.uid)
      .where('studentId', '==', studentId)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ entries, total: entries.length });
  } catch (error: any) {
    console.error('Error listing progress entries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list progress entries' },
      { status: 500 }
    );
  }
}

// POST /api/students/[id]/progress - Create a progress entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
    if (!authResult.isTrainer || !authResult.uid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { id: studentId } = await params;
    const contentType = request.headers.get('content-type') || '';

    let body: any;
    let photoFiles: { position: string; file: File }[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = JSON.parse(formData.get('data') as string);

      for (const position of ['front', 'side', 'back'] as const) {
        const file = formData.get(`photo_${position}`) as File | null;
        if (file) {
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return NextResponse.json(
              { error: `Photo ${position} must be JPEG, PNG, or WebP` },
              { status: 400 }
            );
          }
          if (file.size > MAX_PHOTO_SIZE) {
            return NextResponse.json(
              { error: `Photo ${position} must be less than 10MB` },
              { status: 400 }
            );
          }
          photoFiles.push({ position, file });
        }
      }
    } else {
      body = await request.json();
    }

    // Upload photos if provided
    const photos: Record<string, string> = {};
    for (const { position, file } of photoFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadProgressPhoto(
        authResult.uid,
        studentId,
        position as 'front' | 'side' | 'back',
        buffer,
        file.type
      );
      photos[position] = result.url;
    }

    // Merge with any photo URLs passed in body
    if (body.photos) {
      if (body.photos.front && !photos.front) photos.front = body.photos.front;
      if (body.photos.side && !photos.side) photos.side = body.photos.side;
      if (body.photos.back && !photos.back) photos.back = body.photos.back;
    }

    const entryRef = adminDb.collection('progress_entries').doc();

    const entryData = {
      trainerId: authResult.uid,
      studentId,
      date: body.date ? new Date(body.date) : new Date(),
      measurements: {
        weight: body.measurements?.weight ?? null,
        bodyFat: body.measurements?.bodyFat ?? null,
        muscleMass: body.measurements?.muscleMass ?? null,
        chest: body.measurements?.chest ?? null,
        waist: body.measurements?.waist ?? null,
        hips: body.measurements?.hips ?? null,
        rightArm: body.measurements?.rightArm ?? null,
        leftArm: body.measurements?.leftArm ?? null,
        rightThigh: body.measurements?.rightThigh ?? null,
        leftThigh: body.measurements?.leftThigh ?? null,
        rightCalf: body.measurements?.rightCalf ?? null,
        leftCalf: body.measurements?.leftCalf ?? null,
      },
      ...(Object.keys(photos).length > 0 ? { photos } : {}),
      notes: body.notes?.trim() || '',
      registeredBy: 'trainer' as const,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await entryRef.set(entryData);

    return NextResponse.json(
      { id: entryRef.id, createdAt: new Date().toISOString() },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating progress entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create progress entry' },
      { status: 500 }
    );
  }
}
