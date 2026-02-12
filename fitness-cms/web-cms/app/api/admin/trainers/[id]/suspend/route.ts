import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

interface SuspendBody {
  reason?: string;
}

// POST /api/admin/trainers/[id]/suspend - Suspend a trainer
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

    // Parse request body
    let body: SuspendBody = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
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

    if (trainerData?.status === 'suspended') {
      return NextResponse.json({ error: 'Trainer is already suspended' }, { status: 400 });
    }

    // Update trainer status to suspended
    await trainerRef.update({
      status: 'suspended',
      suspensionReason: body.reason || null,
      statusUpdatedAt: FieldValue.serverTimestamp(),
      statusUpdatedBy: verification.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Trainer suspended successfully',
      trainerId: id,
      status: 'suspended',
      reason: body.reason || null,
    });
  } catch (error: any) {
    console.error('Error suspending trainer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to suspend trainer' },
      { status: 500 }
    );
  }
}
