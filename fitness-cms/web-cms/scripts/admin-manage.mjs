#!/usr/bin/env node
/**
 * Admin management script for FitToday CMS.
 *
 * Usage (from web-cms/):
 *   node --env-file=.env.local scripts/admin-manage.mjs make-admin     <uid>
 *   node --env-file=.env.local scripts/admin-manage.mjs set-superuser  <uid>
 *   node --env-file=.env.local scripts/admin-manage.mjs approve        <uid>
 *   node --env-file=.env.local scripts/admin-manage.mjs reject         <uid> [reason]
 *   node --env-file=.env.local scripts/admin-manage.mjs suspend        <uid> [reason]
 *   node --env-file=.env.local scripts/admin-manage.mjs status         <uid>
 *   node --env-file=.env.local scripts/admin-manage.mjs list-pending
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

if (!serviceAccount.project_id) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY not found. Run with --env-file=.env.local');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const auth = getAuth();
const db = getFirestore();
const [, , command, uid, extra] = process.argv;

async function makeAdmin(uid) {
  const ref = db.collection('users').doc(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    console.error(`User ${uid} not found.`);
    process.exit(1);
  }

  await ref.update({
    role: 'admin',
    permissions: {
      canApproveTrainers: true,
      canSuspendTrainers: true,
      canViewMetrics: true,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  const data = doc.data();
  console.log(`User ${data.displayName || data.email} (${uid}) is now admin.`);
}

async function approve(uid) {
  const ref = db.collection('users').doc(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    console.error(`User ${uid} not found.`);
    process.exit(1);
  }

  const data = doc.data();

  if (data.status === 'active') {
    console.log(`Trainer ${data.displayName || data.email} is already active.`);
    return;
  }

  await ref.update({
    status: 'active',
    statusUpdatedAt: FieldValue.serverTimestamp(),
    statusUpdatedBy: 'script',
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Trainer ${data.displayName || data.email} (${uid}) approved.`);
}

async function reject(uid, reason) {
  const ref = db.collection('users').doc(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    console.error(`User ${uid} not found.`);
    process.exit(1);
  }

  await ref.update({
    status: 'rejected',
    rejectionReason: reason || '',
    statusUpdatedAt: FieldValue.serverTimestamp(),
    statusUpdatedBy: 'script',
    updatedAt: FieldValue.serverTimestamp(),
  });

  const data = doc.data();
  console.log(`Trainer ${data.displayName || data.email} (${uid}) rejected.`);
}

async function suspend(uid, reason) {
  const ref = db.collection('users').doc(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    console.error(`User ${uid} not found.`);
    process.exit(1);
  }

  await ref.update({
    status: 'suspended',
    suspensionReason: reason || '',
    statusUpdatedAt: FieldValue.serverTimestamp(),
    statusUpdatedBy: 'script',
    updatedAt: FieldValue.serverTimestamp(),
  });

  const data = doc.data();
  console.log(`Trainer ${data.displayName || data.email} (${uid}) suspended.`);
}

async function showStatus(uid) {
  const doc = await db.collection('users').doc(uid).get();

  if (!doc.exists) {
    console.error(`User ${uid} not found.`);
    process.exit(1);
  }

  const data = doc.data();
  console.log(`\nUser: ${data.displayName || '(no name)'}`);
  console.log(`Email: ${data.email}`);
  console.log(`Role: ${data.role}`);
  console.log(`Status: ${data.status || 'n/a'}`);
  console.log(`Plan: ${data.subscription?.plan || 'n/a'}`);
  console.log(`Created: ${data.createdAt?.toDate?.()?.toISOString() || 'n/a'}`);
}

async function listPending() {
  const snapshot = await db
    .collection('users')
    .where('role', '==', 'trainer')
    .where('status', '==', 'pending')
    .get();

  if (snapshot.empty) {
    console.log('No pending trainers.');
    return;
  }

  console.log(`\n${snapshot.size} pending trainer(s):\n`);
  snapshot.docs.forEach((doc) => {
    const d = doc.data();
    console.log(`  ${doc.id}  ${d.displayName || '(no name)'}  ${d.email}  ${d.createdAt?.toDate?.()?.toLocaleDateString() || ''}`);
  });
}

async function setSuperUser(uid) {
  const ref = db.collection('users').doc(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    console.error(`User ${uid} not found.`);
    process.exit(1);
  }

  // 1. Set Firebase Auth custom claims
  await auth.setCustomUserClaims(uid, {
    role: 'admin',
    superUser: true,
    plan: 'elite',
  });

  // 2. Update Firestore document with admin role + elite subscription
  await ref.update({
    role: 'admin',
    status: 'active',
    permissions: {
      canApproveTrainers: true,
      canSuspendTrainers: true,
      canViewMetrics: true,
    },
    subscription: {
      plan: 'elite',
      status: 'active',
      features: {
        maxPrograms: -1,
        maxStudents: -1,
        customBranding: true,
        analyticsAdvanced: true,
        prioritySupport: true,
        commissionRate: 0,
      },
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  const data = doc.data();
  console.log(`\nSuperuser configured for ${data.displayName || data.email} (${uid})`);
  console.log('  - Firebase Auth custom claims: role=admin, superUser=true, plan=elite');
  console.log('  - Firestore: role=admin, subscription=elite (all features unlocked)');
  console.log('\nIMPORTANT: The user must log out and log back in for custom claims to take effect.');
}

// Route command
switch (command) {
  case 'make-admin':
    if (!uid) { console.error('Usage: make-admin <uid>'); process.exit(1); }
    await makeAdmin(uid);
    break;
  case 'approve':
    if (!uid) { console.error('Usage: approve <uid>'); process.exit(1); }
    await approve(uid);
    break;
  case 'reject':
    if (!uid) { console.error('Usage: reject <uid> [reason]'); process.exit(1); }
    await reject(uid, extra);
    break;
  case 'suspend':
    if (!uid) { console.error('Usage: suspend <uid> [reason]'); process.exit(1); }
    await suspend(uid, extra);
    break;
  case 'status':
    if (!uid) { console.error('Usage: status <uid>'); process.exit(1); }
    await showStatus(uid);
    break;
  case 'list-pending':
    await listPending();
    break;
  case 'set-superuser':
    if (!uid) { console.error('Usage: set-superuser <uid>'); process.exit(1); }
    await setSuperUser(uid);
    break;
  default:
    console.log(`
FitToday Admin CLI

Commands:
  make-admin     <uid>           Set a user as admin
  set-superuser  <uid>           Admin + elite plan + custom claims (for testing)
  approve        <uid>           Approve a pending trainer
  reject         <uid> [reason]  Reject a trainer
  suspend        <uid> [reason]  Suspend a trainer
  status         <uid>           Show user info
  list-pending                   List all pending trainers

Run from web-cms/:
  node --env-file=.env.local scripts/admin-manage.mjs <command> <uid>
`);
}

process.exit(0);
