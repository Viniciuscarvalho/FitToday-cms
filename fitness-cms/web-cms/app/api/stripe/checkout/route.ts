import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculatePlatformFee, PLATFORM_FEE_PERCENT } from '@/lib/stripe';
import { verifyAuthRequest, adminDb } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

type CheckoutMode = 'payment' | 'subscription';

interface CheckoutRequestBody {
  programId: string;
  programName?: string;
  programDescription?: string;
  price: number;
  currency?: string;
  priceId?: string;
  mode?: CheckoutMode;
  trainerId: string;
  trainerStripeAccountId: string;
  studentId: string;
  studentEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Create a checkout session for purchasing a program
export async function POST(request: NextRequest) {
  const authResult = await verifyAuthRequest(request.headers.get('authorization'));
  if (!authResult.isAuthenticated || !authResult.uid) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const body: CheckoutRequestBody = await request.json();

    const {
      programId,
      programName,
      programDescription,
      price,
      priceId,
      currency = 'brl',
      mode = 'payment',
      trainerId,
      trainerStripeAccountId,
      studentId,
      studentEmail,
      successUrl,
      cancelUrl,
    } = body;

    if (!programId || !trainerId || !trainerStripeAccountId || !studentId) {
      return apiError(
        'Missing required fields: programId, trainerId, trainerStripeAccountId, studentId',
        400,
        'MISSING_PARAM'
      );
    }

    if (mode === 'subscription' && !priceId) {
      return apiError('priceId is required for subscription mode', 400, 'MISSING_PARAM');
    }

    if (mode === 'payment' && !price) {
      return apiError('price is required for payment mode', 400, 'MISSING_PARAM');
    }

    // Validate programId exists in Firestore
    const programDoc = await adminDb!.collection('programs').doc(programId).get();
    if (!programDoc.exists) {
      return apiError('Program not found', 404, 'PROGRAM_NOT_FOUND');
    }

    // Validate trainerId exists and has an active Stripe account
    const trainerDoc = await adminDb!.collection('users').doc(trainerId).get();
    if (!trainerDoc.exists) {
      return apiError('Trainer not found', 404, 'TRAINER_NOT_FOUND');
    }

    const trainerData = trainerDoc.data();
    const actualStripeAccountId = trainerData?.financial?.stripeAccountId;

    if (!actualStripeAccountId) {
      return apiError('Trainer does not have a connected Stripe account', 400, 'NO_STRIPE_ACCOUNT');
    }

    // Validate the provided trainerStripeAccountId matches the trainer's actual account
    if (actualStripeAccountId !== trainerStripeAccountId) {
      return apiError('Invalid trainer Stripe account', 400, 'INVALID_STRIPE_ACCOUNT');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const metadata = { trainerId, programId, studentId };

    if (mode === 'subscription') {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId!, quantity: 1 }],
        subscription_data: {
          application_fee_percent: PLATFORM_FEE_PERCENT,
          transfer_data: { destination: trainerStripeAccountId },
          metadata,
        },
        customer_email: studentEmail,
        metadata,
        success_url: successUrl || `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${baseUrl}/checkout/cancel`,
      });

      return NextResponse.json({ sessionId: session.id, url: session.url, mode: 'subscription' });
    } else {
      const platformFee = calculatePlatformFee(price!);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card', 'boleto', 'pix'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: programName || 'Programa de Treino',
                description: programDescription || 'Acesso completo ao programa',
              },
              unit_amount: price!,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: platformFee,
          transfer_data: { destination: trainerStripeAccountId },
          metadata,
        },
        customer_email: studentEmail,
        metadata,
        success_url: successUrl || `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${baseUrl}/checkout/cancel`,
      });

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
        mode: 'payment',
        platformFee,
        trainerEarnings: price! - platformFee,
      });
    }
  } catch (error) {
    return apiError('Failed to create checkout session', 500, 'STRIPE_ERROR', error);
  }
}

// Get checkout session details
export async function GET(request: NextRequest) {
  const authResult = await verifyAuthRequest(request.headers.get('authorization'));
  if (!authResult.isAuthenticated || !authResult.uid) {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return apiError('sessionId is required', 400, 'MISSING_PARAM');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items', 'subscription'],
    });

    return NextResponse.json({
      id: session.id,
      status: session.status,
      mode: session.mode,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email,
      metadata: session.metadata,
      subscription: session.subscription
        ? {
            id: (session.subscription as any).id,
            status: (session.subscription as any).status,
            currentPeriodEnd: (session.subscription as any).current_period_end,
          }
        : null,
    });
  } catch (error) {
    return apiError('Failed to get checkout session', 500, 'STRIPE_ERROR', error);
  }
}
