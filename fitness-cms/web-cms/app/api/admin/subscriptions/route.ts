import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';
import { PLANS } from '@/lib/constants';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await verifyAdminRequest(request.headers.get('Authorization'));

  if (!authResult.isAdmin) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  if (!adminDb) {
    return apiError('Database not available', 500, 'DB_ERROR');
  }

  try {
    const trainersSnap = await adminDb
      .collection('users')
      .where('role', '==', 'trainer')
      .get();

    const trainers = trainersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.displayName || 'Sem nome',
        email: data.email || '',
        plan: data.subscription?.plan || 'starter',
        subscriptionStatus: data.subscription?.status || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Calculate MRR from active paid subscriptions
    let mrr = 0;
    for (const trainer of trainers) {
      if (trainer.subscriptionStatus === 'active' && trainer.plan !== 'starter') {
        mrr += PLANS[trainer.plan as 'pro' | 'elite']?.priceMonthly ?? 0;
      }
    }

    const summary = {
      total: trainers.length,
      starter: trainers.filter((t) => t.plan === 'starter').length,
      pro: trainers.filter((t) => t.plan === 'pro').length,
      elite: trainers.filter((t) => t.plan === 'elite').length,
      pastDue: trainers.filter((t) => t.subscriptionStatus === 'past_due').length,
      mrrCents: mrr,
    };

    return NextResponse.json({ trainers, summary });
  } catch (error: any) {
    return apiError('Failed to fetch subscriptions', 500, 'FETCH_SUBSCRIPTIONS_ERROR', error);
  }
}
