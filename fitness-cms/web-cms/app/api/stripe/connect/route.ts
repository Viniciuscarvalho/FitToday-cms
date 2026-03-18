import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyTrainerRequest, adminDb } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

// Create a Stripe Connect account for a trainer
export async function POST(request: NextRequest) {
  const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
  if (!authResult.isTrainer || !authResult.uid) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const { trainerId, email, existingAccountId, returnUrl } = await request.json();

    if (!trainerId || !email) {
      return apiError('trainerId and email are required', 400, 'MISSING_PARAM');
    }

    // Trainers can only create/access their own Stripe account
    if (trainerId !== authResult.uid) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    let accountId = existingAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { trainerId },
      });
      accountId = account.id;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/finances?refresh=true`,
      return_url: returnUrl || `${baseUrl}/finances?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url, accountId });
  } catch (error) {
    return apiError('Failed to create Stripe account', 500, 'STRIPE_ERROR', error);
  }
}

// Get Stripe Connect account status
export async function GET(request: NextRequest) {
  const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
  if (!authResult.isTrainer || !authResult.uid) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ connected: false, onboardingComplete: false });
    }

    // Ownership check: trainer can only view their own account status
    const trainerDoc = await adminDb!.collection('users').doc(authResult.uid).get();
    const trainerStripeAccountId = trainerDoc.data()?.financial?.stripeAccountId;
    if (trainerStripeAccountId !== accountId) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const account = await stripe.accounts.retrieve(accountId);
    const isOnboardingComplete = account.charges_enabled && account.payouts_enabled;

    return NextResponse.json({
      connected: true,
      onboardingComplete: isOnboardingComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      accountId: account.id,
      email: account.email,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    return apiError('Failed to get account status', 500, 'STRIPE_ERROR', error);
  }
}
