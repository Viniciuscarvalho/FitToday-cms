import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyTrainerRequest, adminDb } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

// Create a product in Stripe for a program
export async function POST(request: NextRequest) {
  const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
  if (!authResult.isTrainer || !authResult.uid) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const { programId, name, description, trainerId, trainerStripeAccountId, imageUrl } =
      await request.json();

    if (!programId || !name || !trainerId || !trainerStripeAccountId) {
      return apiError(
        'Missing required fields: programId, name, trainerId, trainerStripeAccountId',
        400,
        'MISSING_PARAM'
      );
    }

    // Trainers can only manage their own products
    if (trainerId !== authResult.uid) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Verify the Stripe account belongs to this trainer
    const trainerDoc = await adminDb!.collection('users').doc(authResult.uid).get();
    const trainerStripeId = trainerDoc.data()?.financial?.stripeAccountId;
    if (trainerStripeId !== trainerStripeAccountId) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const product = await stripe.products.create(
      {
        name,
        description: description || undefined,
        images: imageUrl ? [imageUrl] : undefined,
        metadata: { programId, trainerId },
      },
      { stripeAccount: trainerStripeAccountId }
    );

    return NextResponse.json({
      productId: product.id,
      name: product.name,
      description: product.description,
      active: product.active,
    });
  } catch (error) {
    return apiError('Failed to create product', 500, 'STRIPE_ERROR', error);
  }
}

// Get a product by ID
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
  } catch (error) {
    return apiError('Failed to get product', 500, 'STRIPE_ERROR', error);
  }
}
