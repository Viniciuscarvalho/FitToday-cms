import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Get Stripe account balance and details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Get account details
    const account = await stripe.accounts.retrieve(accountId);

    // Get balance for the connected account
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    // Get recent payouts
    const payouts = await stripe.payouts.list(
      {
        limit: 10,
      },
      {
        stripeAccount: accountId,
      }
    );

    // Get recent charges/payments
    const charges = await stripe.charges.list(
      {
        limit: 20,
      },
      {
        stripeAccount: accountId,
      }
    );

    // Calculate totals
    const availableBalance = balance.available.reduce(
      (sum, b) => sum + b.amount,
      0
    );
    const pendingBalance = balance.pending.reduce(
      (sum, b) => sum + b.amount,
      0
    );

    // Get total earnings from successful charges
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
  } catch (error: any) {
    console.error('Error getting Stripe account details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get account details' },
      { status: 500 }
    );
  }
}

// Create a login link for Stripe Express dashboard
export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const loginLink = await stripe.accounts.createLoginLink(accountId);

    return NextResponse.json({
      url: loginLink.url,
    });
  } catch (error: any) {
    console.error('Error creating Stripe login link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create login link' },
      { status: 500 }
    );
  }
}
