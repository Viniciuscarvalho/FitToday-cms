import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

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
      return apiError(verification.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
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
      return apiError('Trainer not found', 404, 'NOT_FOUND');
    }

    const trainerData = trainerDoc.data();

    if (trainerData?.role !== 'trainer') {
      return apiError('User is not a trainer', 400, 'INVALID_REQUEST');
    }

    if (trainerData?.status === 'suspended') {
      return apiError('Trainer is already suspended', 400, 'INVALID_REQUEST');
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
    return apiError('Failed to suspend trainer', 500, 'SUSPEND_TRAINER_ERROR', error);
  }
}
