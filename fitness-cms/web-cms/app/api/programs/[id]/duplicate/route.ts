import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// POST /api/programs/[id]/duplicate - Duplicate a program
export async function POST(
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

    // Get original program
    const programDoc = await adminDb.collection('programs').doc(programId).get();

    if (!programDoc.exists) {
      return apiError('Program not found', 404, 'NOT_FOUND');
    }

    const originalData = programDoc.data()!;

    if (originalData.trainerId !== authResult.uid) {
      return apiError('Not authorized to duplicate this program', 403, 'FORBIDDEN');
    }

    // Create duplicate
    const newProgramRef = adminDb.collection('programs').doc();
    const { publishedAt, ...dataWithoutPublished } = originalData;
    const duplicateData = {
      ...dataWithoutPublished,
      title: `${originalData.title} (Cópia)`,
      status: 'draft',
      visibility: 'private',
      stats: {
        totalSales: 0,
        activeStudents: 0,
        completionRate: 0,
        averageRating: 0,
        totalReviews: 0,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await newProgramRef.set(duplicateData);

    return NextResponse.json(
      {
        id: newProgramRef.id,
        title: duplicateData.title,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    return apiError('Failed to duplicate program', 500, 'DUPLICATE_PROGRAM_ERROR', error);
  }
}
