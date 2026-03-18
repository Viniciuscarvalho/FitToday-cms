import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authResult = await verifyAuthRequest(request.headers.get('Authorization'));

  if (!authResult.isAuthenticated || authResult.role !== 'trainer') {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const trainerId = authResult.uid!;

  let body: { plan: 'pro' | 'elite' };
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid request body', 400, 'INVALID_REQUEST');
  }

  const { plan } = body;
  if (plan !== 'pro' && plan !== 'elite') {
    return apiError('Invalid plan. Must be "pro" or "elite"', 400, 'INVALID_REQUEST');
  }

  const priceId =
    plan === 'pro'
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_ELITE_PRICE_ID;

  if (!priceId) {
    console.error(`Missing env var for plan: ${plan}`);
    return apiError('Plan price not configured', 500, 'CONFIG_ERROR');
  }

  if (!adminDb) {
    return apiError('Database not available', 500, 'DB_ERROR');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // Get or create Stripe customer for this trainer
    const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
    const trainerData = trainerDoc.data();

    let stripeCustomerId: string = trainerData?.stripeCustomerId || '';

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: trainerData?.email || undefined,
        name: trainerData?.name || undefined,
        metadata: { trainerId },
      });
      stripeCustomerId = customer.id;

      await adminDb.collection('users').doc(trainerId).update({
        stripeCustomerId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/cms/finances?subscription_success=true`,
      cancel_url: `${appUrl}/cms/finances?subscription_canceled=true`,
      metadata: {
        trainerId,
        plan,
        type: 'platform_subscription',
      },
      subscription_data: {
        metadata: {
          trainerId,
          plan,
          type: 'platform_subscription',
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return apiError('Failed to create checkout session', 500, 'CREATE_CHECKOUT_ERROR', error);
  }
}
