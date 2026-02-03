import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Create a Stripe Connect account for a trainer
export async function POST(request: NextRequest) {
  try {
    const { trainerId, email, existingAccountId, returnUrl } = await request.json();

    if (!trainerId || !email) {
      return NextResponse.json(
        { error: 'trainerId and email are required' },
        { status: 400 }
      );
    }

    let accountId = existingAccountId;

    if (!accountId) {
      // Create a new Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          trainerId: trainerId,
        },
      });

      accountId = account.id;
    }

    // Create an account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/finances?refresh=true`,
      return_url: returnUrl || `${baseUrl}/finances?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: accountId,
    });
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe account' },
      { status: 500 }
    );
  }
}

// Get Stripe Connect account status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
      });
    }

    // Get the account details from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    const isOnboardingComplete =
      account.charges_enabled && account.payouts_enabled;

    return NextResponse.json({
      connected: true,
      onboardingComplete: isOnboardingComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      accountId: account.id,
      email: account.email,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error: any) {
    console.error('Error getting Stripe account status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get account status' },
      { status: 500 }
    );
  }
}
