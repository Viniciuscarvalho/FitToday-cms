import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLATFORM_FEE_PERCENT, calculatePlatformFee } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';

// Disable body parsing, we need the raw body for webhook signature verification
export const dynamic = 'force-dynamic';

// Types for Firestore documents
interface SubscriptionDocument {
  id: string;
  studentId: string;
  trainerId: string;
  programId: string;
  stripeSubscriptionId?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'expired';
  type: 'one_time' | 'monthly' | 'quarterly' | 'yearly';
  price: number;
  platformFee: number;
  trainerEarnings: number;
  currency: string;
  startDate: FirebaseFirestore.Timestamp;
  currentPeriodEnd?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
}

interface TransactionDocument {
  id: string;
  subscriptionId: string;
  trainerId: string;
  studentId: string;
  programId: string;
  type: 'purchase' | 'renewal' | 'refund';
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        console.log('Account updated:', account.id);

        // Update trainer's Stripe account status in Firestore
        if (adminDb && account.metadata?.trainerId) {
          const trainerId = account.metadata.trainerId;
          await adminDb.collection('users').doc(trainerId).update({
            'financial.stripeAccountId': account.id,
            'financial.stripeOnboardingComplete': account.charges_enabled && account.payouts_enabled,
            'financial.stripeChargesEnabled': account.charges_enabled,
            'financial.stripePayoutsEnabled': account.payouts_enabled,
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log('Updated trainer Stripe status:', trainerId);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        const { trainerId, programId, studentId } = session.metadata || {};

        if (!adminDb) {
          console.error('Firebase Admin not initialized');
          break;
        }

        if (trainerId && programId && studentId) {
          const amountTotal = session.amount_total || 0;
          const platformFee = calculatePlatformFee(amountTotal);
          const trainerEarnings = amountTotal - platformFee;
          const isSubscription = session.mode === 'subscription';
          const now = FieldValue.serverTimestamp();

          // Determine subscription type based on mode
          let subscriptionType: SubscriptionDocument['type'] = 'one_time';
          if (isSubscription && session.subscription) {
            // Get subscription to determine interval
            const subscriptionObj = await stripe.subscriptions.retrieve(session.subscription as string) as any;
            const interval = subscriptionObj.items?.data?.[0]?.price?.recurring?.interval;
            if (interval === 'month') subscriptionType = 'monthly';
            else if (interval === 'year') subscriptionType = 'yearly';
          }

          // Create subscription document
          const subscriptionRef = adminDb.collection('subscriptions').doc();
          const subscriptionDoc: Omit<SubscriptionDocument, 'id' | 'startDate' | 'currentPeriodEnd' | 'createdAt'> & {
            id: string;
            startDate: FirebaseFirestore.FieldValue;
            currentPeriodEnd?: FirebaseFirestore.FieldValue;
            createdAt: FirebaseFirestore.FieldValue;
          } = {
            id: subscriptionRef.id,
            studentId,
            trainerId,
            programId,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string || undefined,
            stripeSubscriptionId: session.subscription as string || undefined,
            status: 'active',
            type: subscriptionType,
            price: amountTotal,
            platformFee,
            trainerEarnings,
            currency: session.currency || 'brl',
            startDate: now,
            createdAt: now,
          };

          await subscriptionRef.set(subscriptionDoc);
          console.log('Created subscription:', subscriptionRef.id);

          // Create transaction document
          const transactionRef = adminDb.collection('transactions').doc();
          const transactionDoc: Omit<TransactionDocument, 'id' | 'createdAt'> & {
            id: string;
            createdAt: FirebaseFirestore.FieldValue;
          } = {
            id: transactionRef.id,
            subscriptionId: subscriptionRef.id,
            trainerId,
            studentId,
            programId,
            type: 'purchase',
            grossAmount: amountTotal,
            platformFee,
            netAmount: trainerEarnings,
            currency: session.currency || 'brl',
            status: 'succeeded',
            stripePaymentIntentId: session.payment_intent as string || undefined,
            createdAt: now,
          };

          await transactionRef.set(transactionDoc);
          console.log('Created transaction:', transactionRef.id);

          // Update trainer's total earnings
          await adminDb.collection('users').doc(trainerId).update({
            'financial.totalEarnings': FieldValue.increment(trainerEarnings / 100), // Convert cents to BRL
            'financial.pendingBalance': FieldValue.increment(trainerEarnings / 100),
            'stats.totalStudents': FieldValue.increment(1),
            updatedAt: now,
          });
          console.log('Updated trainer earnings:', trainerId);

          // Grant program access to student
          await adminDb.collection('users').doc(studentId).update({
            [`programs.${programId}`]: {
              accessGrantedAt: now,
              subscriptionId: subscriptionRef.id,
              trainerId,
            },
            updatedAt: now,
          });
          console.log('Granted program access to student:', studentId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);

        const invoiceSubscriptionId = (invoice as any).subscription as string | null;
        if (!adminDb || !invoiceSubscriptionId) break;

        // This is a renewal payment for a subscription
        const subscriptionData = await stripe.subscriptions.retrieve(invoiceSubscriptionId) as any;
        const trainerId = subscriptionData.metadata?.trainerId;
        const studentId = subscriptionData.metadata?.studentId;
        const programId = subscriptionData.metadata?.programId;

        if (trainerId && studentId && programId) {
          const amountPaid = invoice.amount_paid || 0;
          const platformFee = calculatePlatformFee(amountPaid);
          const trainerEarnings = amountPaid - platformFee;
          const now = FieldValue.serverTimestamp();

          // Find existing subscription document
          const subscriptionQuery = await adminDb
            .collection('subscriptions')
            .where('stripeSubscriptionId', '==', invoiceSubscriptionId)
            .limit(1)
            .get();

          let subscriptionId = '';
          if (!subscriptionQuery.empty) {
            subscriptionId = subscriptionQuery.docs[0].id;

            // Update subscription period (current_period_end is in seconds)
            const periodEnd = subscriptionData.current_period_end;
            await adminDb.collection('subscriptions').doc(subscriptionId).update({
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
              updatedAt: now,
            });
          }

          // Create renewal transaction (skip if it's the first payment)
          if (invoice.billing_reason === 'subscription_cycle') {
            const transactionRef = adminDb.collection('transactions').doc();
            await transactionRef.set({
              id: transactionRef.id,
              subscriptionId,
              trainerId,
              studentId,
              programId,
              type: 'renewal',
              grossAmount: amountPaid,
              platformFee,
              netAmount: trainerEarnings,
              currency: invoice.currency || 'brl',
              status: 'succeeded',
              stripeInvoiceId: invoice.id,
              createdAt: now,
            });
            console.log('Created renewal transaction:', transactionRef.id);

            // Update trainer earnings
            await adminDb.collection('users').doc(trainerId).update({
              'financial.totalEarnings': FieldValue.increment(trainerEarnings / 100),
              'financial.pendingBalance': FieldValue.increment(trainerEarnings / 100),
              updatedAt: now,
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error('Invoice payment failed:', invoice.id);

        const failedInvoiceSubscriptionId = (invoice as any).subscription as string | null;
        if (!adminDb || !failedInvoiceSubscriptionId) break;

        // Update subscription status to past_due
        const subscriptionQuery = await adminDb
          .collection('subscriptions')
          .where('stripeSubscriptionId', '==', failedInvoiceSubscriptionId)
          .limit(1)
          .get();

        if (!subscriptionQuery.empty) {
          await adminDb.collection('subscriptions').doc(subscriptionQuery.docs[0].id).update({
            status: 'past_due',
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log('Updated subscription to past_due:', subscriptionQuery.docs[0].id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription canceled:', subscription.id);

        if (!adminDb) break;

        // Update subscription status to canceled
        const subscriptionQuery = await adminDb
          .collection('subscriptions')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();

        if (!subscriptionQuery.empty) {
          const subDoc = subscriptionQuery.docs[0];
          await subDoc.ref.update({
            status: 'canceled',
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log('Updated subscription to canceled:', subDoc.id);

          // Revoke program access
          const subData = subDoc.data();
          if (subData.studentId && subData.programId) {
            await adminDb.collection('users').doc(subData.studentId).update({
              [`programs.${subData.programId}.status`]: 'canceled',
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        // Most logic is handled in checkout.session.completed
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id);
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        console.log('Transfer created:', transfer.id, 'to', transfer.destination);

        if (!adminDb) break;

        // Update trainer's available balance when transfer completes
        const trainerId = transfer.metadata?.trainerId;
        if (trainerId) {
          const amountInBRL = transfer.amount / 100;
          await adminDb.collection('users').doc(trainerId).update({
            'financial.pendingBalance': FieldValue.increment(-amountInBRL),
            'financial.availableBalance': FieldValue.increment(amountInBRL),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        console.log('Payout paid:', payout.id, 'amount:', payout.amount);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        console.error('Payout failed:', payout.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', charge.id);

        if (!adminDb) break;

        const paymentIntentId = charge.payment_intent as string;
        if (paymentIntentId) {
          // Find the original transaction
          const transactionQuery = await adminDb
            .collection('transactions')
            .where('stripePaymentIntentId', '==', paymentIntentId)
            .limit(1)
            .get();

          if (!transactionQuery.empty) {
            const originalTx = transactionQuery.docs[0].data();
            const refundAmount = charge.amount_refunded || 0;
            const platformFeeRefund = calculatePlatformFee(refundAmount);
            const trainerRefund = refundAmount - platformFeeRefund;
            const now = FieldValue.serverTimestamp();

            // Create refund transaction
            const refundRef = adminDb.collection('transactions').doc();
            await refundRef.set({
              id: refundRef.id,
              subscriptionId: originalTx.subscriptionId,
              trainerId: originalTx.trainerId,
              studentId: originalTx.studentId,
              programId: originalTx.programId,
              type: 'refund',
              grossAmount: -refundAmount,
              platformFee: -platformFeeRefund,
              netAmount: -trainerRefund,
              currency: charge.currency || 'brl',
              status: 'succeeded',
              stripePaymentIntentId: paymentIntentId,
              createdAt: now,
            });

            // Update trainer earnings
            await adminDb.collection('users').doc(originalTx.trainerId).update({
              'financial.totalEarnings': FieldValue.increment(-trainerRefund / 100),
              updatedAt: now,
            });
            console.log('Created refund transaction:', refundRef.id);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
