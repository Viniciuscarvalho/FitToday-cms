import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

interface RejectBody {
  reason?: string;
}

// POST /api/admin/trainers/[id]/reject - Reject a trainer
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

    // Parse request body
    let body: RejectBody = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
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

    if (trainerData?.status === 'rejected') {
      return apiError('Trainer is already rejected', 400, 'INVALID_REQUEST');
    }

    // Update trainer status to rejected
    await trainerRef.update({
      status: 'rejected',
      rejectionReason: body.reason || null,
      statusUpdatedAt: FieldValue.serverTimestamp(),
      statusUpdatedBy: verification.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Trainer rejected successfully',
      trainerId: id,
      status: 'rejected',
      reason: body.reason || null,
    });
  } catch (error: any) {
    return apiError('Failed to reject trainer', 500, 'REJECT_TRAINER_ERROR', error);
  }
}
