import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyTrainerRequest, adminDb } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

// Get Stripe account balance and details
export async function GET(request: NextRequest) {
  const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
  if (!authResult.isTrainer || !authResult.uid) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return apiError('accountId is required', 400, 'MISSING_PARAM');
    }

    // Ownership check: trainer can only access their own Stripe account
    const trainerDoc = await adminDb!.collection('users').doc(authResult.uid).get();
    const trainerStripeAccountId = trainerDoc.data()?.financial?.stripeAccountId;
    if (trainerStripeAccountId !== accountId) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const account = await stripe.accounts.retrieve(accountId);
    const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
    const payouts = await stripe.payouts.list({ limit: 10 }, { stripeAccount: accountId });
    const charges = await stripe.charges.list({ limit: 20 }, { stripeAccount: accountId });

    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0);
    const totalEarnings = charges.data
      .filter((c) => c.paid && !c.refunded)
      .reduce((sum, c) => sum + c.amount, 0);

    return NextResponse.json({
      account: {
        id: account.id,
        email: account.email,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      },
      balance: {
        available: availableBalance,
        pending: pendingBalance,
        currency: balance.available[0]?.currency || 'brl',
      },
      payouts: payouts.data.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        arrivalDate: new Date(p.arrival_date * 1000),
        createdAt: new Date(p.created * 1000),
      })),
      recentCharges: charges.data.map((c) => ({
        id: c.id,
        amount: c.amount,
        status: c.status,
        paid: c.paid,
        refunded: c.refunded,
        description: c.description,
        createdAt: new Date(c.created * 1000),
      })),
      totalEarnings,
    });
  } catch (error) {
    return apiError('Failed to get account details', 500, 'STRIPE_ERROR', error);
  }
}

// Create a login link for Stripe Express dashboard
export async function POST(request: NextRequest) {
  const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
  if (!authResult.isTrainer || !authResult.uid) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return apiError('accountId is required', 400, 'MISSING_PARAM');
    }

    // Ownership check: trainer can only create login links for their own account
    const trainerDoc = await adminDb!.collection('users').doc(authResult.uid).get();
    const trainerStripeAccountId = trainerDoc.data()?.financial?.stripeAccountId;
    if (trainerStripeAccountId !== accountId) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    return apiError('Failed to create login link', 500, 'STRIPE_ERROR', error);
  }
}
