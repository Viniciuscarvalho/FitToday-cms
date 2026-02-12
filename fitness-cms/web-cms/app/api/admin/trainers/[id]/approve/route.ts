import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// POST /api/admin/trainers/[id]/approve - Approve a trainer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin access
    const authHeader = request.headers.get('authorization');
    const verification = await verifyAdminRequest(authHeader);

    if (!verification.isAdmin) {
      return NextResponse.json(
        { error: verification.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get trainer document
    const trainerRef = adminDb.collection('users').doc(id);
    const trainerDoc = await trainerRef.get();

    if (!trainerDoc.exists) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    const trainerData = trainerDoc.data();

    if (trainerData?.role !== 'trainer') {
      return NextResponse.json({ error: 'User is not a trainer' }, { status: 400 });
    }

    if (trainerData?.status === 'active') {
      return NextResponse.json({ error: 'Trainer is already active' }, { status: 400 });
    }

    // Update trainer status to active
    await trainerRef.update({
      status: 'active',
      statusUpdatedAt: FieldValue.serverTimestamp(),
      statusUpdatedBy: verification.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Trainer approved successfully',
      trainerId: id,
      status: 'active',
    });
  } catch (error: any) {
    console.error('Error approving trainer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve trainer' },
      { status: 500 }
    );
  }
}
