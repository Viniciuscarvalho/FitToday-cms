import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuthRequest(request.headers.get('Authorization'));

  if (!authResult.isAuthenticated || authResult.role !== 'trainer') {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const trainerId = authResult.uid!;

  if (!adminDb) {
    return apiError('Database not available', 500, 'DB_ERROR');
  }

  try {
    const subDoc = await adminDb.collection('platformSubscriptions').doc(trainerId).get();

    if (!subDoc.exists) {
      return NextResponse.json({ plan: 'starter', status: null });
    }

    const data = subDoc.data()!;
    return NextResponse.json({
      plan: data.plan,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd?.toDate?.()?.toISOString() || null,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      stripeSubscriptionId: data.stripeSubscriptionId,
    });
  } catch (error: any) {
    return apiError('Failed to fetch subscription', 500, 'FETCH_SUBSCRIPTION_ERROR', error);
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuthRequest(request.headers.get('Authorization'));

  if (!authResult.isAuthenticated || authResult.role !== 'trainer') {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const trainerId = authResult.uid!;

  if (!adminDb) {
    return apiError('Database not available', 500, 'DB_ERROR');
  }

  try {
    const subDoc = await adminDb.collection('platformSubscriptions').doc(trainerId).get();

    if (!subDoc.exists) {
      return apiError('No active subscription found', 404, 'NOT_FOUND');
    }

    const { stripeSubscriptionId } = subDoc.data()!;

    if (!stripeSubscriptionId) {
      return apiError('Subscription ID not found', 404, 'NOT_FOUND');
    }

    // Cancel at period end (does not cancel immediately)
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await adminDb.collection('platformSubscriptions').doc(trainerId).update({
      cancelAtPeriodEnd: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, cancelAtPeriodEnd: true });
  } catch (error: any) {
    return apiError('Failed to cancel subscription', 500, 'CANCEL_SUBSCRIPTION_ERROR', error);
  }
}
