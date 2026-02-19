import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get original program
    const programDoc = await adminDb.collection('programs').doc(programId).get();

    if (!programDoc.exists) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const originalData = programDoc.data()!;

    if (originalData.trainerId !== authResult.uid) {
      return NextResponse.json({ error: 'Not authorized to duplicate this program' }, { status: 403 });
    }

    // Create duplicate
    const newProgramRef = adminDb.collection('programs').doc();
    const duplicateData = {
      ...originalData,
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

    // Remove publishedAt from duplicate
    delete duplicateData.publishedAt;

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
    console.error('Error duplicating program:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to duplicate program' },
      { status: 500 }
    );
  }
}
