import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyTrainerRequest, adminDb } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

type RecurringInterval = 'month' | 'year';

interface CreatePriceBody {
  productId: string;
  programId: string;
  trainerId: string;
  trainerStripeAccountId: string;
  unitAmount: number;
  currency?: string;
  recurring?: {
    interval: RecurringInterval;
    intervalCount?: number;
  };
}

// Create a price for a product
export async function POST(request: NextRequest) {
  const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
  if (!authResult.isTrainer || !authResult.uid) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const body: CreatePriceBody = await request.json();
    const {
      productId,
      programId,
      trainerId,
      trainerStripeAccountId,
      unitAmount,
      currency = 'brl',
      recurring,
    } = body;

    if (!productId || !programId || !trainerId || !trainerStripeAccountId || !unitAmount) {
      return apiError(
        'Missing required fields: productId, programId, trainerId, trainerStripeAccountId, unitAmount',
        400,
        'MISSING_PARAM'
      );
    }

    // Trainers can only manage their own prices
    if (trainerId !== authResult.uid) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Verify the Stripe account belongs to this trainer
    const trainerDoc = await adminDb!.collection('users').doc(authResult.uid).get();
    const trainerStripeId = trainerDoc.data()?.financial?.stripeAccountId;
    if (trainerStripeId !== trainerStripeAccountId) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const priceData: Parameters<typeof stripe.prices.create>[0] = {
      product: productId,
      unit_amount: unitAmount,
      currency,
      metadata: { programId, trainerId },
    };

    if (recurring) {
      priceData.recurring = {
        interval: recurring.interval,
        interval_count: recurring.intervalCount || 1,
      };
    }

    const price = await stripe.prices.create(priceData, {
      stripeAccount: trainerStripeAccountId,
    });

    return NextResponse.json({
      priceId: price.id,
      productId: price.product,
      unitAmount: price.unit_amount,
      currency: price.currency,
      type: price.type,
      recurring: price.recurring
        ? { interval: price.recurring.interval, intervalCount: price.recurring.interval_count }
        : null,
      active: price.active,
    });
  } catch (error) {
    return apiError('Failed to create price', 500, 'STRIPE_ERROR', error);
  }
}

// List prices for a product
export async function GET(request: NextRequest) {
  const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
  if (!authResult.isTrainer || !authResult.uid) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const trainerStripeAccountId = searchParams.get('stripeAccountId');

    if (!productId || !trainerStripeAccountId) {
      return apiError('productId and stripeAccountId are required', 400, 'MISSING_PARAM');
    }

    // Verify the Stripe account belongs to this trainer
    const trainerDoc = await adminDb!.collection('users').doc(authResult.uid).get();
    const trainerStripeId = trainerDoc.data()?.financial?.stripeAccountId;
    if (trainerStripeId !== trainerStripeAccountId) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const prices = await stripe.prices.list(
      { product: productId, active: true },
      { stripeAccount: trainerStripeAccountId }
    );

    return NextResponse.json({
      prices: prices.data.map((price) => ({
        priceId: price.id,
        productId: price.product,
        unitAmount: price.unit_amount,
        currency: price.currency,
        type: price.type,
        recurring: price.recurring
          ? { interval: price.recurring.interval, intervalCount: price.recurring.interval_count }
          : null,
        active: price.active,
      })),
    });
  } catch (error) {
    return apiError('Failed to list prices', 500, 'STRIPE_ERROR', error);
  }
}
