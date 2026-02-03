import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

type RecurringInterval = 'month' | 'year';

interface CreatePriceBody {
  productId: string;
  programId: string;
  trainerId: string;
  trainerStripeAccountId: string;
  unitAmount: number; // Price in cents
  currency?: string;
  recurring?: {
    interval: RecurringInterval;
    intervalCount?: number;
  };
}

// Create a price for a product
export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Missing required fields: productId, programId, trainerId, trainerStripeAccountId, unitAmount' },
        { status: 400 }
      );
    }

    // Create price on the connected account
    const priceData: Parameters<typeof stripe.prices.create>[0] = {
      product: productId,
      unit_amount: unitAmount,
      currency,
      metadata: {
        programId,
        trainerId,
      },
    };

    // Add recurring config if provided
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
        ? {
            interval: price.recurring.interval,
            intervalCount: price.recurring.interval_count,
          }
        : null,
      active: price.active,
    });
  } catch (error: any) {
    console.error('Error creating price:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create price' },
      { status: 500 }
    );
  }
}

// List prices for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const trainerStripeAccountId = searchParams.get('stripeAccountId');

    if (!productId || !trainerStripeAccountId) {
      return NextResponse.json(
        { error: 'productId and stripeAccountId are required' },
        { status: 400 }
      );
    }

    const prices = await stripe.prices.list(
      {
        product: productId,
        active: true,
      },
      {
        stripeAccount: trainerStripeAccountId,
      }
    );

    return NextResponse.json({
      prices: prices.data.map((price) => ({
        priceId: price.id,
        productId: price.product,
        unitAmount: price.unit_amount,
        currency: price.currency,
        type: price.type,
        recurring: price.recurring
          ? {
              interval: price.recurring.interval,
              intervalCount: price.recurring.interval_count,
            }
          : null,
        active: price.active,
      })),
    });
  } catch (error: any) {
    console.error('Error listing prices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list prices' },
      { status: 500 }
    );
  }
}
