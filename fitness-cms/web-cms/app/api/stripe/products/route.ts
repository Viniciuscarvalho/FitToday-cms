import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Create a product in Stripe for a program
export async function POST(request: NextRequest) {
  try {
    const {
      programId,
      name,
      description,
      trainerId,
      trainerStripeAccountId,
      imageUrl,
    } = await request.json();

    if (!programId || !name || !trainerId || !trainerStripeAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: programId, name, trainerId, trainerStripeAccountId' },
        { status: 400 }
      );
    }

    // Create product on the connected account
    const product = await stripe.products.create(
      {
        name,
        description: description || undefined,
        images: imageUrl ? [imageUrl] : undefined,
        metadata: {
          programId,
          trainerId,
        },
      },
      {
        stripeAccount: trainerStripeAccountId,
      }
    );

    return NextResponse.json({
      productId: product.id,
      name: product.name,
      description: product.description,
      active: product.active,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Get a product by ID
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

    const product = await stripe.products.retrieve(productId, {
      stripeAccount: trainerStripeAccountId,
    });

    return NextResponse.json({
      productId: product.id,
      name: product.name,
      description: product.description,
      active: product.active,
      metadata: product.metadata,
    });
  } catch (error: any) {
    console.error('Error getting product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get product' },
      { status: 500 }
    );
  }
}
