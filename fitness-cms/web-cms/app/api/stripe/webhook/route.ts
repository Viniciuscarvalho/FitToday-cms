import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculatePlatformFee } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';
import { PLANS, PlanId } from '@/lib/constants';
import { createChatRoom } from '@/lib/chat-utils';

export const dynamic = 'force-dynamic';

// ============================================================
// IDEMPOTENCY — prevent duplicate processing on Stripe retries
// ============================================================

async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  if (!adminDb) return false;
  const doc = await adminDb.collection('processedWebhookEvents').doc(eventId).get();
  return doc.exists;
}

async function markEventAsProcessed(eventId: string, eventType: string): Promise<void> {
  if (!adminDb) return;
  await adminDb.collection('processedWebhookEvents').doc(eventId).set({
    type: eventType,
    processedAt: FieldValue.serverTimestamp(),
  });
}

// ============================================================
// HELPERS — shared utilities
// ============================================================

function calculatePeriodEnd(session: Stripe.Checkout.Session): Date {
  const now = new Date();
  if (session.mode === 'payment') {
    now.setFullYear(now.getFullYear() + 100);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now;
}

async function sendNotification(
  userId: string,
  userRole: 'trainer' | 'student',
  data: {
    type: string;
    title: string;
    body: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }
) {
  if (!adminDb) return;

  const destination = (() => {
    switch (data.relatedEntityType) {
      case 'program': return `/programs/${data.relatedEntityId}`;
      case 'subscription': return `/subscriptions/${data.relatedEntityId}`;
      case 'message': return `/chats/${data.relatedEntityId}`;
      default: return '/';
    }
  })();

  const ref = adminDb.collection('users').doc(userId).collection('notifications').doc();
  await ref.set({
    id: ref.id,
    userId,
    userRole,
    ...data,
    action: { type: 'navigate', destination },
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

// ============================================================
// PLATFORM SUBSCRIPTION HANDLERS (trainer pays FitToday)
// ============================================================

async function handlePlatformCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!adminDb) return;

  const { trainerId, plan } = session.metadata || {};
  if (!trainerId || !plan) return;

  const subscriptionId = session.subscription as string;
  const now = FieldValue.serverTimestamp();

  let currentPeriodEnd: Date | null = null;
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
    currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  }

  await adminDb.collection('platformSubscriptions').doc(trainerId).set({
    plan,
    status: 'active',
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });

  await adminDb.collection('users').doc(trainerId).update({
    'subscription.plan': plan,
    'subscription.status': 'active',
    updatedAt: now,
  });

  console.log(`Platform subscription created for trainer ${trainerId}: ${plan}`);
}

async function handlePlatformSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (!adminDb) return;

  const { trainerId } = subscription.metadata || {};
  if (!trainerId) return;

  const sub = subscription as any;
  let newStatus: 'active' | 'canceled' | 'past_due' | 'trialing' = 'active';
  if (subscription.status === 'canceled') newStatus = 'canceled';
  else if (subscription.status === 'past_due' || subscription.status === 'unpaid') newStatus = 'past_due';
  else if (subscription.status === 'trialing') newStatus = 'trialing';

  const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  const now = FieldValue.serverTimestamp();

  await adminDb.collection('platformSubscriptions').doc(trainerId).set(
    { status: newStatus, currentPeriodEnd, cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false, updatedAt: now },
    { merge: true }
  );

  await adminDb.collection('users').doc(trainerId).update({
    'subscription.status': newStatus,
    updatedAt: now,
  });

  console.log(`Platform subscription updated for trainer ${trainerId}: ${newStatus}`);
}

async function handlePlatformSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!adminDb) return;

  const { trainerId } = subscription.metadata || {};
  if (!trainerId) return;

  const now = FieldValue.serverTimestamp();

  await adminDb.collection('platformSubscriptions').doc(trainerId).set(
    { status: 'canceled', cancelAtPeriodEnd: false, updatedAt: now },
    { merge: true }
  );

  await adminDb.collection('users').doc(trainerId).update({
    'subscription.plan': 'starter',
    'subscription.status': 'canceled',
    updatedAt: now,
  });

  console.log(`Platform subscription deleted for trainer ${trainerId} — downgraded to starter`);
}

async function handlePlatformInvoicePaid(sub: any) {
  if (!adminDb) return;

  const trainerId = sub.metadata?.trainerId;
  if (!trainerId) return;

  const now = FieldValue.serverTimestamp();
  const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

  await adminDb.collection('platformSubscriptions').doc(trainerId).set(
    { status: 'active', currentPeriodEnd, updatedAt: now },
    { merge: true }
  );

  await adminDb.collection('users').doc(trainerId).update({
    'subscription.status': 'active',
    updatedAt: now,
  });

  console.log(`Platform invoice paid for trainer ${trainerId}`);
}

async function handlePlatformInvoicePaymentFailed(sub: any) {
  if (!adminDb) return;

  const trainerId = sub.metadata?.trainerId;
  if (!trainerId) return;

  const now = FieldValue.serverTimestamp();

  await adminDb.collection('platformSubscriptions').doc(trainerId).set(
    { status: 'past_due', updatedAt: now },
    { merge: true }
  );

  await adminDb.collection('users').doc(trainerId).update({
    'subscription.status': 'past_due',
    updatedAt: now,
  });

  console.error(`Platform invoice payment failed for trainer ${trainerId}`);
}

// ============================================================
// PROGRAM PURCHASE HANDLERS (student pays trainer)
// ============================================================

async function handleProgramCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!adminDb) return;

  const { trainerId, programId, studentId } = session.metadata || {};
  if (!trainerId || !programId || !studentId) return;

  // Dedup check: avoid creating duplicate subscription for same checkout session
  const existingCheck = await adminDb
    .collection('subscriptions')
    .where('stripeCheckoutSessionId', '==', session.id)
    .limit(1)
    .get();
  if (!existingCheck.empty) {
    console.log(`[WEBHOOK] Subscription already exists for checkout session ${session.id}`);
    return;
  }

  const amountTotal = session.amount_total || 0;
  const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
  const trainerPlan = (trainerDoc.data()?.subscription?.plan || 'starter') as PlanId;
  const commissionRate = PLANS[trainerPlan]?.commissionRate ?? PLANS.starter.commissionRate;
  const platformFee = calculatePlatformFee(amountTotal, commissionRate);
  const trainerEarnings = amountTotal - platformFee;
  const now = FieldValue.serverTimestamp();
  const periodEnd = calculatePeriodEnd(session);

  const batch = adminDb.batch();

  // Subscription document
  const subscriptionRef = adminDb.collection('subscriptions').doc();
  batch.set(subscriptionRef, {
    id: subscriptionRef.id,
    studentId,
    trainerId,
    programId,
    status: 'active',
    startDate: now,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    stripeSubscriptionId: session.subscription || null,
    stripeCustomerId: session.customer || null,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string || null,
    pricing: {
      amount: amountTotal,
      currency: (session.currency || 'brl').toUpperCase(),
      interval: session.mode === 'subscription' ? 'monthly' : 'one_time',
    },
    invoices: [],
    createdAt: now,
    updatedAt: now,
  });

  // Progress document
  const progressRef = adminDb.collection('progress').doc();
  batch.set(progressRef, {
    id: progressRef.id,
    studentId,
    trainerId,
    programId,
    subscriptionId: subscriptionRef.id,
    startedAt: now,
    currentWeek: 1,
    currentDay: 1,
    completionPercentage: 0,
    status: 'active',
    completedWorkouts: [],
    metrics: {
      totalWorkoutsCompleted: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageSessionDuration: 0,
    },
    bodyMetrics: [],
    updatedAt: now,
  });

  // Transaction document
  const transactionRef = adminDb.collection('transactions').doc();
  batch.set(transactionRef, {
    id: transactionRef.id,
    type: session.mode === 'subscription' ? 'subscription_payment' : 'one_time_purchase',
    studentId,
    trainerId,
    programId,
    subscriptionId: subscriptionRef.id,
    amount: amountTotal,
    platformFee,
    trainerEarnings,
    currency: (session.currency || 'brl').toUpperCase(),
    status: 'completed',
    stripePaymentIntentId: session.payment_intent as string || null,
    description: `Compra do programa: ${programId}`,
    createdAt: now,
    completedAt: now,
  });

  // Student: grant access
  batch.update(adminDb.collection('users').doc(studentId), {
    'purchases.activeSubscriptions': FieldValue.arrayUnion(subscriptionRef.id),
    'purchases.purchasedPrograms': FieldValue.arrayUnion(programId),
    [`programs.${programId}`]: { accessGrantedAt: now, subscriptionId: subscriptionRef.id, trainerId },
    updatedAt: now,
  });

  // Program stats
  batch.update(adminDb.collection('programs').doc(programId), {
    'stats.totalSales': FieldValue.increment(1),
    'stats.activeStudents': FieldValue.increment(1),
    updatedAt: now,
  });

  // Trainer stats
  batch.update(adminDb.collection('users').doc(trainerId), {
    'store.totalSales': FieldValue.increment(1),
    'store.totalStudents': FieldValue.increment(1),
    'financial.totalEarnings': FieldValue.increment(trainerEarnings / 100),
    'financial.pendingBalance': FieldValue.increment(trainerEarnings / 100),
    updatedAt: now,
  });

  await batch.commit();
  console.log('Program checkout completed:', subscriptionRef.id);

  // Notifications
  await Promise.all([
    sendNotification(trainerId, 'trainer', {
      type: 'new_subscriber',
      title: 'Novo Aluno!',
      body: 'Você tem um novo aluno no seu programa!',
      relatedEntityType: 'subscription',
      relatedEntityId: subscriptionRef.id,
    }),
    sendNotification(studentId, 'student', {
      type: 'new_content',
      title: 'Bem-vindo ao programa!',
      body: 'Seu treino está pronto para começar!',
      relatedEntityType: 'program',
      relatedEntityId: programId,
    }),
    createChatRoom(
      trainerId,
      studentId,
      programId,
      'Bem-vindo! Este é o seu canal de comunicação direta com o personal trainer. Qualquer dúvida, é só mandar mensagem!'
    ),
  ]);
}

async function handleProgramInvoicePaid(invoice: Stripe.Invoice, sub: any) {
  if (!adminDb) return;

  const subscriptionsQuery = await adminDb
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', sub.id)
    .limit(1)
    .get();

  if (subscriptionsQuery.empty) return;

  const subDoc = subscriptionsQuery.docs[0];
  const now = FieldValue.serverTimestamp();
  const trainerId = sub.metadata?.trainerId;
  const amountPaid = invoice.amount_paid || 0;
  let platformFee: number;
  let trainerEarnings: number;
  if (trainerId) {
    const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
    const trainerPlan = (trainerDoc.data()?.subscription?.plan || 'starter') as PlanId;
    const commissionRate = PLANS[trainerPlan]?.commissionRate ?? PLANS.starter.commissionRate;
    platformFee = calculatePlatformFee(amountPaid, commissionRate);
  } else {
    platformFee = calculatePlatformFee(amountPaid);
  }
  trainerEarnings = amountPaid - platformFee;

  const updates: Record<string, any> = {
    status: 'active',
    currentPeriodStart: sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : null,
    currentPeriodEnd: sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null,
    invoices: FieldValue.arrayUnion({
      id: invoice.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      status: 'paid',
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : null,
      invoiceURL: invoice.hosted_invoice_url || null,
      createdAt: new Date(invoice.created * 1000),
    }),
    updatedAt: now,
  };

  await subDoc.ref.update(updates);

  // Create renewal transaction and update trainer earnings
  if (invoice.billing_reason === 'subscription_cycle' && trainerId) {
    const transactionRef = adminDb.collection('transactions').doc();
    await transactionRef.set({
      id: transactionRef.id,
      subscriptionId: subDoc.id,
      trainerId,
      studentId: subDoc.data().studentId,
      programId: subDoc.data().programId,
      type: 'renewal',
      amount: amountPaid,
      platformFee,
      trainerEarnings,
      currency: (invoice.currency || 'brl').toUpperCase(),
      status: 'completed',
      stripeInvoiceId: invoice.id,
      createdAt: now,
      completedAt: now,
    });

    await adminDb.collection('users').doc(trainerId).update({
      'financial.totalEarnings': FieldValue.increment(trainerEarnings / 100),
      'financial.pendingBalance': FieldValue.increment(trainerEarnings / 100),
      updatedAt: now,
    });
  }

  console.log('Program invoice paid:', invoice.id);
}

async function handleProgramSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (!adminDb) return;

  const subscriptionsQuery = await adminDb
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsQuery.empty) return;

  const sub = subscription as any;
  const newStatus =
    subscription.status === 'active' ? 'active' :
    subscription.status === 'past_due' ? 'past_due' : 'canceled';

  await subscriptionsQuery.docs[0].ref.update({
    status: newStatus,
    currentPeriodStart: sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : null,
    currentPeriodEnd: sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log('Program subscription updated:', subscription.id, '->', newStatus);
}

async function handleProgramSubscriptionCanceled(subscription: Stripe.Subscription) {
  if (!adminDb) return;

  const subscriptionsQuery = await adminDb
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsQuery.empty) return;

  const subDoc = subscriptionsQuery.docs[0];
  const subData = subDoc.data();
  const now = FieldValue.serverTimestamp();
  const batch = adminDb.batch();

  // Cancel subscription
  batch.update(subDoc.ref, {
    status: 'canceled',
    canceledAt: now,
    updatedAt: now,
  });

  // Mark progress as abandoned
  const progressQuery = await adminDb
    .collection('progress')
    .where('subscriptionId', '==', subDoc.id)
    .limit(1)
    .get();

  if (!progressQuery.empty) {
    batch.update(progressQuery.docs[0].ref, { status: 'abandoned', updatedAt: now });
  }

  // Decrement program active students
  if (subData.programId) {
    batch.update(adminDb.collection('programs').doc(subData.programId), {
      'stats.activeStudents': FieldValue.increment(-1),
      updatedAt: now,
    });
  }

  // Revoke student access
  if (subData.studentId && subData.programId) {
    batch.update(adminDb.collection('users').doc(subData.studentId), {
      [`programs.${subData.programId}.status`]: 'canceled',
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log('Program subscription canceled:', subscription.id);
}

// ============================================================

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Idempotency check — skip events already processed (Stripe retries on failure)
  if (await isEventAlreadyProcessed(event.id)) {
    console.log(`[WEBHOOK] Duplicate event skipped: ${event.id}`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        if (adminDb && account.metadata?.trainerId) {
          await adminDb.collection('users').doc(account.metadata.trainerId).update({
            'financial.stripeAccountId': account.id,
            'financial.stripeOnboardingComplete': account.charges_enabled && account.payouts_enabled,
            'financial.stripeChargesEnabled': account.charges_enabled,
            'financial.stripePayoutsEnabled': account.payouts_enabled,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === 'platform_subscription') {
          await handlePlatformCheckoutCompleted(session);
        } else {
          await handleProgramCheckoutCompleted(session);
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId = (invoice as any).subscription as string | null;
        if (!invoiceSubId) break;

        const sub = await stripe.subscriptions.retrieve(invoiceSubId) as any;

        if (sub.metadata?.type === 'platform_subscription') {
          await handlePlatformInvoicePaid(sub);
        } else {
          await handleProgramInvoicePaid(invoice, sub);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId = (invoice as any).subscription as string | null;
        if (!invoiceSubId) break;

        const sub = await stripe.subscriptions.retrieve(invoiceSubId) as any;

        if (sub.metadata?.type === 'platform_subscription') {
          await handlePlatformInvoicePaymentFailed(sub);
        } else {
          const subscriptionQuery = await adminDb!
            .collection('subscriptions')
            .where('stripeSubscriptionId', '==', invoiceSubId)
            .limit(1)
            .get();

          if (!subscriptionQuery.empty) {
            await subscriptionQuery.docs[0].ref.update({
              status: 'past_due',
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.metadata?.type === 'platform_subscription') {
          await handlePlatformSubscriptionUpdated(subscription);
        } else {
          await handleProgramSubscriptionUpdated(subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.metadata?.type === 'platform_subscription') {
          await handlePlatformSubscriptionDeleted(subscription);
        } else {
          await handleProgramSubscriptionCanceled(subscription);
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        if (adminDb && transfer.metadata?.trainerId) {
          const amountInBRL = transfer.amount / 100;
          await adminDb.collection('users').doc(transfer.metadata.trainerId).update({
            'financial.pendingBalance': FieldValue.increment(-amountInBRL),
            'financial.availableBalance': FieldValue.increment(amountInBRL),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        break;
      }

      case 'payout.paid':
        console.log('Payout paid:', (event.data.object as Stripe.Payout).id);
        break;

      case 'payout.failed':
        console.error('Payout failed:', (event.data.object as Stripe.Payout).id);
        break;

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        if (!adminDb || !charge.payment_intent) break;

        const transactionQuery = await adminDb
          .collection('transactions')
          .where('stripePaymentIntentId', '==', charge.payment_intent)
          .limit(1)
          .get();

        if (!transactionQuery.empty) {
          const originalTx = transactionQuery.docs[0].data();
          const refundAmount = charge.amount_refunded || 0;
          const platformFeeRefund = calculatePlatformFee(refundAmount);
          const trainerRefund = refundAmount - platformFeeRefund;
          const now = FieldValue.serverTimestamp();

          const refundRef = adminDb.collection('transactions').doc();
          await refundRef.set({
            id: refundRef.id,
            subscriptionId: originalTx.subscriptionId,
            trainerId: originalTx.trainerId,
            studentId: originalTx.studentId,
            programId: originalTx.programId,
            type: 'refund',
            amount: -refundAmount,
            platformFee: -platformFeeRefund,
            trainerEarnings: -trainerRefund,
            currency: charge.currency?.toUpperCase() || 'BRL',
            status: 'completed',
            stripePaymentIntentId: charge.payment_intent as string,
            createdAt: now,
            completedAt: now,
          });

          await adminDb.collection('users').doc(originalTx.trainerId).update({
            'financial.totalEarnings': FieldValue.increment(-trainerRefund / 100),
            updatedAt: now,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed after successful handling
    await markEventAsProcessed(event.id, event.type);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
