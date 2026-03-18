import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

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
      return apiError(verification.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    // Get trainer document
    const trainerRef = adminDb.collection('users').doc(id);
    const trainerDoc = await trainerRef.get();

    if (!trainerDoc.exists) {
      return apiError('Trainer not found', 404, 'NOT_FOUND');
    }

    const trainerData = trainerDoc.data();

    if (trainerData?.role !== 'trainer') {
      return apiError('User is not a trainer', 400, 'INVALID_REQUEST');
    }

    if (trainerData?.status === 'active') {
      return apiError('Trainer is already active', 400, 'INVALID_REQUEST');
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
    return apiError('Failed to approve trainer', 500, 'APPROVE_TRAINER_ERROR', error);
  }
}
