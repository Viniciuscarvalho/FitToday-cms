// ============================================================
// FITNESS CMS - CLOUD FUNCTIONS
// Backend Logic for Personal Trainer Marketplace
// ============================================================

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();

const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe?.secret_key || '', {
  apiVersion: '2023-10-16',
});

// ============================================================
// 1. USER MANAGEMENT
// ============================================================

/**
 * Criar perfil de usuário quando se registra
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const userRef = db.collection('users').doc(user.uid);

  // Perfil básico - será atualizado com role específico depois
  await userRef.set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    phoneNumber: user.phoneNumber || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isActive: true,
    role: 'student', // Default, pode mudar para 'trainer'
  });

  console.log(`User profile created for ${user.uid}`);
});

/**
 * Promover usuário para Personal Trainer
 */
export const becomeTrainer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { profile } = data;

  // Criar conta Stripe Connect
  const stripeAccount = await stripe.accounts.create({
    type: 'express',
    country: 'BR',
    email: context.auth.token.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
  });

  // Atualizar perfil do usuário
  await db.collection('users').doc(userId).update({
    role: 'trainer',
    profile: {
      bio: profile?.bio || '',
      specialties: profile?.specialties || [],
      certifications: [],
      experience: profile?.experience || 0,
      socialMedia: profile?.socialMedia || {},
      location: profile?.location || {},
    },
    store: {
      slug: await generateUniqueSlug(profile?.displayName || userId),
      isVerified: false,
      rating: 0,
      totalReviews: 0,
      totalSales: 0,
      totalStudents: 0,
    },
    financial: {
      stripeAccountId: stripeAccount.id,
      totalEarnings: 0,
      pendingBalance: 0,
      availableBalance: 0,
    },
    subscription: {
      plan: 'free',
      status: 'active',
      features: {
        maxPrograms: 3,
        maxStudents: 10,
        customBranding: false,
        analyticsAdvanced: false,
        prioritySupport: false,
        commissionRate: 20,
      },
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Gerar link de onboarding Stripe
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccount.id,
    refresh_url: `${functions.config().app?.url || 'http://localhost:3000'}/trainer/onboarding/refresh`,
    return_url: `${functions.config().app?.url || 'http://localhost:3000'}/trainer/onboarding/complete`,
    type: 'account_onboarding',
  });

  return {
    success: true,
    stripeOnboardingUrl: accountLink.url
  };
});

async function generateUniqueSlug(name: string): Promise<string> {
  let slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let counter = 0;
  let uniqueSlug = slug;

  while (true) {
    const existing = await db.collection('users')
      .where('store.slug', '==', uniqueSlug)
      .limit(1)
      .get();

    if (existing.empty) break;

    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}


// ============================================================
// 2. PAYMENT PROCESSING
// ============================================================

/**
 * Criar sessão de checkout para compra de programa
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { programId } = data;
  const studentId = context.auth.uid;

  // Buscar dados do programa
  const programDoc = await db.collection('programs').doc(programId).get();
  if (!programDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Program not found');
  }

  const program = programDoc.data()!;
  const trainerDoc = await db.collection('users').doc(program.trainerId).get();
  const trainer = trainerDoc.data()!;

  // Calcular taxas
  const commissionRate = (trainer.subscription?.features?.commissionRate || 15) / 100;
  const applicationFee = Math.round(program.pricing.price * commissionRate);

  // Criar ou recuperar customer Stripe
  const stripeCustomerId = await getOrCreateStripeCustomer(studentId, context.auth.token.email!);

  // Configurar sessão baseado no tipo de preço
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    mode: program.pricing.type === 'subscription' ? 'subscription' : 'payment',
    success_url: `${functions.config().app?.url || 'http://localhost:3000'}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${functions.config().app?.url || 'http://localhost:3000'}/programs/${programId}`,
    metadata: {
      programId,
      studentId,
      trainerId: program.trainerId,
    },
    line_items: [{
      price_data: {
        currency: program.pricing.currency.toLowerCase(),
        product_data: {
          name: program.title,
          description: program.subtitle || program.description?.substring(0, 200) || '',
          images: program.coverImageURL ? [program.coverImageURL] : [],
        },
        unit_amount: program.pricing.price,
        ...(program.pricing.type === 'subscription' && {
          recurring: {
            interval: program.pricing.subscriptionInterval === 'yearly' ? 'year' :
                     program.pricing.subscriptionInterval === 'quarterly' ? 'month' : 'month',
            interval_count: program.pricing.subscriptionInterval === 'quarterly' ? 3 : 1,
          },
        }),
      },
      quantity: 1,
    }],
    ...(program.pricing.type === 'one_time' && trainer.financial?.stripeAccountId && {
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: trainer.financial.stripeAccountId,
        },
      },
    }),
    ...(program.pricing.type === 'subscription' && trainer.financial?.stripeAccountId && {
      subscription_data: {
        application_fee_percent: commissionRate * 100,
        transfer_data: {
          destination: trainer.financial.stripeAccountId,
        },
      },
    }),
  };

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return { sessionId: session.id, url: session.url };
});

async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.stripeCustomerId) {
    return userData.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { firebaseUserId: userId },
  });

  await db.collection('users').doc(userId).update({
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

/**
 * Webhook do Stripe para processar eventos de pagamento
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      functions.config().stripe?.webhook_secret || ''
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { programId, studentId, trainerId } = session.metadata!;

  const batch = db.batch();

  // Criar assinatura no Firestore
  const subscriptionRef = db.collection('subscriptions').doc();
  batch.set(subscriptionRef, {
    id: subscriptionRef.id,
    studentId,
    trainerId,
    programId,
    status: 'active',
    startDate: admin.firestore.FieldValue.serverTimestamp(),
    currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
    currentPeriodEnd: calculatePeriodEnd(session),
    stripeSubscriptionId: session.subscription || null,
    stripeCustomerId: session.customer,
    pricing: {
      amount: session.amount_total,
      currency: session.currency?.toUpperCase(),
      interval: session.mode === 'subscription' ? 'monthly' : 'one_time',
    },
    invoices: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Criar progresso do aluno
  const progressRef = db.collection('progress').doc();
  batch.set(progressRef, {
    id: progressRef.id,
    studentId,
    trainerId,
    programId,
    subscriptionId: subscriptionRef.id,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Atualizar dados do aluno
  batch.update(db.collection('users').doc(studentId), {
    'purchases.activeSubscriptions': admin.firestore.FieldValue.arrayUnion(subscriptionRef.id),
    'purchases.purchasedPrograms': admin.firestore.FieldValue.arrayUnion(programId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Atualizar estatísticas do programa
  batch.update(db.collection('programs').doc(programId), {
    'stats.totalSales': admin.firestore.FieldValue.increment(1),
    'stats.activeStudents': admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Atualizar estatísticas do trainer
  batch.update(db.collection('users').doc(trainerId), {
    'store.totalSales': admin.firestore.FieldValue.increment(1),
    'store.totalStudents': admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Criar transação
  const transactionRef = db.collection('transactions').doc();
  const platformFee = Math.round(session.amount_total! * 0.15); // 15% default
  batch.set(transactionRef, {
    id: transactionRef.id,
    type: session.mode === 'subscription' ? 'subscription_payment' : 'one_time_purchase',
    studentId,
    trainerId,
    programId,
    subscriptionId: subscriptionRef.id,
    amount: session.amount_total,
    platformFee,
    trainerEarnings: session.amount_total! - platformFee,
    currency: session.currency?.toUpperCase(),
    status: 'completed',
    stripePaymentIntentId: session.payment_intent as string,
    description: `Compra do programa: ${programId}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  // Enviar notificações
  await sendNotification(trainerId, 'trainer', {
    type: 'new_subscriber',
    title: 'Novo Aluno!',
    body: 'Você tem um novo aluno no seu programa!',
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionRef.id,
  });

  await sendNotification(studentId, 'student', {
    type: 'new_content',
    title: 'Bem-vindo ao programa!',
    body: 'Seu treino está pronto para começar!',
    relatedEntityType: 'program',
    relatedEntityId: programId,
  });

  // Criar chat entre trainer e aluno
  await createChatRoom(trainerId, studentId, programId);
}

function calculatePeriodEnd(session: Stripe.Checkout.Session): admin.firestore.Timestamp {
  const now = new Date();
  if (session.mode === 'payment') {
    // Compra única - acesso vitalício
    now.setFullYear(now.getFullYear() + 100);
  } else {
    // Assinatura - próximo mês
    now.setMonth(now.getMonth() + 1);
  }
  return admin.firestore.Timestamp.fromDate(now);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionsQuery = await db.collection('subscriptions')
    .where('stripeSubscriptionId', '==', invoice.subscription)
    .limit(1)
    .get();

  if (subscriptionsQuery.empty) return;

  const subscriptionDoc = subscriptionsQuery.docs[0];

  await subscriptionDoc.ref.update({
    status: 'active',
    'invoices': admin.firestore.FieldValue.arrayUnion({
      id: invoice.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      status: 'paid',
      paidAt: admin.firestore.Timestamp.fromMillis(invoice.status_transitions.paid_at! * 1000),
      invoiceURL: invoice.hosted_invoice_url,
      createdAt: admin.firestore.Timestamp.fromMillis(invoice.created * 1000),
    }),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionsQuery = await db.collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsQuery.empty) return;

  const subscriptionDoc = subscriptionsQuery.docs[0];

  await subscriptionDoc.ref.update({
    status: subscription.status === 'active' ? 'active' :
            subscription.status === 'past_due' ? 'past_due' : 'canceled',
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const subscriptionsQuery = await db.collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsQuery.empty) return;

  const subscriptionDoc = subscriptionsQuery.docs[0];
  const subData = subscriptionDoc.data();

  const batch = db.batch();

  // Atualizar assinatura
  batch.update(subscriptionDoc.ref, {
    status: 'canceled',
    canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Atualizar progresso
  const progressQuery = await db.collection('progress')
    .where('subscriptionId', '==', subscriptionDoc.id)
    .limit(1)
    .get();

  if (!progressQuery.empty) {
    batch.update(progressQuery.docs[0].ref, {
      status: 'abandoned',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Atualizar estatísticas do programa
  batch.update(db.collection('programs').doc(subData.programId), {
    'stats.activeStudents': admin.firestore.FieldValue.increment(-1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
}


// ============================================================
// 3. NOTIFICATIONS
// ============================================================

interface NotificationData {
  type: string;
  title: string;
  body: string;
  imageURL?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

async function sendNotification(
  userId: string,
  userRole: 'trainer' | 'student',
  data: NotificationData
) {
  const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();

  await notificationRef.set({
    id: notificationRef.id,
    userId,
    userRole,
    ...data,
    action: {
      type: 'navigate',
      destination: getNotificationDestination(data),
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // TODO: Enviar push notification via FCM
  // await sendPushNotification(userId, data);
}

function getNotificationDestination(data: NotificationData): string {
  switch (data.relatedEntityType) {
    case 'program':
      return `/programs/${data.relatedEntityId}`;
    case 'subscription':
      return `/subscriptions/${data.relatedEntityId}`;
    case 'message':
      return `/chats/${data.relatedEntityId}`;
    default:
      return '/';
  }
}

async function createChatRoom(trainerId: string, studentId: string, programId: string) {
  const chatRef = db.collection('chats').doc();

  await chatRef.set({
    id: chatRef.id,
    trainerId,
    studentId,
    programId,
    isActive: true,
    unreadCountTrainer: 0,
    unreadCountStudent: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Mensagem de boas-vindas automática
  await chatRef.collection('messages').add({
    roomId: chatRef.id,
    senderId: 'system',
    senderRole: 'system',
    type: 'text',
    content: 'Bem-vindo! Este é o seu canal de comunicação direta com o personal trainer. Qualquer dúvida, é só mandar mensagem!',
    status: 'sent',
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}


// ============================================================
// 4. SCHEDULED FUNCTIONS
// ============================================================

/**
 * Enviar lembretes de treino diários
 */
export const sendWorkoutReminders = functions.pubsub
  .schedule('0 7 * * *') // Todos os dias às 7h
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    const activeProgressQuery = await db.collection('progress')
      .where('status', '==', 'active')
      .get();

    const notifications: Promise<void>[] = [];

    for (const doc of activeProgressQuery.docs) {
      const progress = doc.data();

      // Verificar se já treinou hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastWorkout = progress.completedWorkouts?.slice(-1)[0];
      if (lastWorkout && lastWorkout.completedAt?.toDate() >= today) {
        continue; // Já treinou hoje
      }

      notifications.push(sendNotification(progress.studentId, 'student', {
        type: 'workout_reminder',
        title: 'Hora do treino!',
        body: `Semana ${progress.currentWeek}, Dia ${progress.currentDay} está esperando por você!`,
        relatedEntityType: 'program',
        relatedEntityId: progress.programId,
      }));
    }

    await Promise.all(notifications);
    console.log(`Sent ${notifications.length} workout reminders`);
  });

/**
 * Enviar lembretes de check-in semanal
 */
export const sendWeeklyCheckInReminders = functions.pubsub
  .schedule('0 9 * * 0') // Todo domingo às 9h
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    const activeProgressQuery = await db.collection('progress')
      .where('status', '==', 'active')
      .get();

    const notifications: Promise<void>[] = [];

    for (const doc of activeProgressQuery.docs) {
      const progress = doc.data();

      notifications.push(sendNotification(progress.studentId, 'student', {
        type: 'weekly_check_in_due',
        title: 'Check-in semanal',
        body: 'Hora de registrar seu progresso da semana!',
        relatedEntityType: 'program',
        relatedEntityId: progress.programId,
      }));
    }

    await Promise.all(notifications);
    console.log(`Sent ${notifications.length} check-in reminders`);
  });

/**
 * Calcular analytics diários dos trainers
 */
export const calculateDailyAnalytics = functions.pubsub
  .schedule('0 1 * * *') // Todo dia à 1h
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    const trainersQuery = await db.collection('users')
      .where('role', '==', 'trainer')
      .where('isActive', '==', true)
      .get();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const trainerDoc of trainersQuery.docs) {
      const trainerId = trainerDoc.id;

      // Buscar transações do dia
      const transactionsQuery = await db.collection('transactions')
        .where('trainerId', '==', trainerId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
        .get();

      const totalRevenue = transactionsQuery.docs.reduce((sum, doc) =>
        sum + (doc.data().trainerEarnings || 0), 0);

      // Buscar novos assinantes
      const newSubsQuery = await db.collection('subscriptions')
        .where('trainerId', '==', trainerId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
        .get();

      // Salvar analytics
      await db.collection('analytics')
        .doc(trainerId)
        .collection('daily')
        .doc(yesterday.toISOString().split('T')[0])
        .set({
          trainerId,
          period: 'daily',
          date: admin.firestore.Timestamp.fromDate(yesterday),
          sales: {
            totalRevenue,
            totalTransactions: transactionsQuery.size,
            newSubscribers: newSubsQuery.size,
            churnedSubscribers: 0,
            averageOrderValue: transactionsQuery.size > 0 ? totalRevenue / transactionsQuery.size : 0,
          },
          engagement: {
            profileViews: 0,
            programViews: {},
            contentViews: 0,
            messagesReceived: 0,
            checkInsReviewed: 0,
          },
          students: {
            totalActive: 0,
            completionRate: 0,
            averageProgress: 0,
            topPerformers: [],
          },
          content: {
            totalPrograms: 0,
            totalTips: 0,
            avgProgramRating: 0,
          },
        });
    }

    console.log(`Calculated analytics for ${trainersQuery.size} trainers`);
  });


// ============================================================
// 5. UTILITY FUNCTIONS
// ============================================================

/**
 * Buscar programas do trainer
 */
export const getTrainerPrograms = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { trainerId, status, limit = 20, lastDocId } = data;

  let query: FirebaseFirestore.Query = db.collection('programs')
    .where('trainerId', '==', trainerId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (status) {
    query = query.where('status', '==', status);
  }

  if (lastDocId) {
    const lastDoc = await db.collection('programs').doc(lastDocId).get();
    query = query.startAfter(lastDoc);
  }

  const snapshot = await query.get();

  return {
    programs: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    hasMore: snapshot.docs.length === limit,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
});

/**
 * Buscar alunos do trainer
 */
export const getTrainerStudents = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const trainerId = context.auth.uid;
  const { status, programId, limit = 20, lastDocId } = data;

  let query: FirebaseFirestore.Query = db.collection('subscriptions')
    .where('trainerId', '==', trainerId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (status) {
    query = query.where('status', '==', status);
  }

  if (programId) {
    query = query.where('programId', '==', programId);
  }

  if (lastDocId) {
    const lastDoc = await db.collection('subscriptions').doc(lastDocId).get();
    query = query.startAfter(lastDoc);
  }

  const snapshot = await query.get();

  // Enriquecer com dados do aluno
  const subscriptions = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const sub = doc.data();
      const studentDoc = await db.collection('users').doc(sub.studentId).get();
      const progressQuery = await db.collection('progress')
        .where('subscriptionId', '==', doc.id)
        .limit(1)
        .get();

      return {
        id: doc.id,
        ...sub,
        student: studentDoc.exists ? studentDoc.data() : null,
        progress: progressQuery.empty ? null : progressQuery.docs[0].data(),
      };
    })
  );

  return {
    subscriptions,
    hasMore: snapshot.docs.length === limit,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
});
