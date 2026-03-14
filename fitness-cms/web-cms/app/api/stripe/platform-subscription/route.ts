import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuthRequest(request.headers.get('Authorization'));

  if (!authResult.isAuthenticated || authResult.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trainerId = authResult.uid!;

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
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
    console.error('Error fetching platform subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuthRequest(request.headers.get('Authorization'));

  if (!authResult.isAuthenticated || authResult.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trainerId = authResult.uid!;

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }

  try {
    const subDoc = await adminDb.collection('platformSubscriptions').doc(trainerId).get();

    if (!subDoc.exists) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const { stripeSubscriptionId } = subDoc.data()!;

    if (!stripeSubscriptionId) {
      return NextResponse.json({ error: 'Subscription ID not found' }, { status: 404 });
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
    console.error('Error canceling platform subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel subscription' }, { status: 500 });
  }
}
