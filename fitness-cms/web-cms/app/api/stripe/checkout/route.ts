import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculatePlatformFee, PLATFORM_FEE_PERCENT } from '@/lib/stripe';

type CheckoutMode = 'payment' | 'subscription';

interface CheckoutRequestBody {
  // Program info
  programId: string;
  programName?: string;
  programDescription?: string;

  // Pricing
  price: number; // Price in cents (e.g., 9900 for R$99.00)
  currency?: string;

  // For subscriptions: use priceId instead of price
  priceId?: string;

  // Mode
  mode?: CheckoutMode;

  // Participants
  trainerId: string;
  trainerStripeAccountId: string;
  studentId: string;
  studentEmail?: string;

  // URLs (for mobile app, use deep links)
  successUrl?: string;
  cancelUrl?: string;
}

// Create a checkout session for purchasing a program
export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!programId || !trainerId || !trainerStripeAccountId || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields: programId, trainerId, trainerStripeAccountId, studentId' },
        { status: 400 }
      );
    }

    // For subscriptions, priceId is required; for one-time payments, price is required
    if (mode === 'subscription' && !priceId) {
      return NextResponse.json(
        { error: 'priceId is required for subscription mode' },
        { status: 400 }
      );
    }

    if (mode === 'payment' && !price) {
      return NextResponse.json(
        { error: 'price is required for payment mode' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    const metadata = {
      trainerId,
      programId,
      studentId,
    };

    // Build checkout session params based on mode
    if (mode === 'subscription') {
      // Subscription mode: use existing price from Stripe
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId!,
            quantity: 1,
          },
        ],
        subscription_data: {
          application_fee_percent: PLATFORM_FEE_PERCENT,
          transfer_data: {
            destination: trainerStripeAccountId,
          },
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
        mode: 'subscription',
      });
    } else {
      // Payment mode: one-time purchase with inline price
      const platformFee = calculatePlatformFee(price!);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card', 'boleto', 'pix'],
        line_items: [
          {
            price_data: {
              currency: currency,
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
          transfer_data: {
            destination: trainerStripeAccountId,
          },
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
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Get checkout session details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
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
  } catch (error: any) {
    console.error('Error getting checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get checkout session' },
      { status: 500 }
    );
  }
}
