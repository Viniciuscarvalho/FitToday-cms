/**
 * Firestore Security Rules Tests — User Profile Write Protection
 *
 * These tests verify that Firestore security rules correctly enforce
 * that only the authenticated user can update their own profile document.
 *
 * Prerequisites:
 *   npm install --save-dev @firebase/rules-unit-testing firebase vitest
 *   firebase emulators:start --only firestore
 *
 * Run:
 *   npx vitest run backend/__tests__/firestore-rules-profile.test.ts
 */

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'fittoday-rules-test',
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('User Profile Security Rules', () => {
  const USER_A = 'user-a-uid';
  const USER_B = 'user-b-uid';

  async function seedUser(uid: string, data: Record<string, unknown>) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', uid), {
        uid,
        role: 'trainer',
        displayName: 'Test User',
        email: `${uid}@test.com`,
        ...data,
      });
    });
  }

  describe('Owner can update own profile', () => {
    it('allows owner to update displayName', async () => {
      await seedUser(USER_A, {});
      const db = testEnv.authenticatedContext(USER_A).firestore();

      await assertSucceeds(
        updateDoc(doc(db, 'users', USER_A), {
          displayName: 'New Name',
        })
      );
    });

    it('allows owner to update profile fields', async () => {
      await seedUser(USER_A, {});
      const db = testEnv.authenticatedContext(USER_A).firestore();

      await assertSucceeds(
        updateDoc(doc(db, 'users', USER_A), {
          'profile.bio': 'Updated bio',
          'profile.specialties': ['Musculação', 'HIIT'],
          'profile.experience': 5,
          'profile.socialMedia.instagram': '@newhandle',
          'profile.location.city': 'São Paulo',
          'profile.location.state': 'SP',
        })
      );
    });

    it('allows owner to update photoURL', async () => {
      await seedUser(USER_A, {});
      const db = testEnv.authenticatedContext(USER_A).firestore();

      await assertSucceeds(
        updateDoc(doc(db, 'users', USER_A), {
          photoURL: 'https://storage.example.com/avatar.jpg',
        })
      );
    });
  });

  describe('Non-owner cannot update another user profile', () => {
    it('denies user B from updating user A profile', async () => {
      await seedUser(USER_A, {});
      const db = testEnv.authenticatedContext(USER_B).firestore();

      await assertFails(
        updateDoc(doc(db, 'users', USER_A), {
          displayName: 'Hacked Name',
        })
      );
    });

    it('denies user B from updating user A profile fields', async () => {
      await seedUser(USER_A, {});
      const db = testEnv.authenticatedContext(USER_B).firestore();

      await assertFails(
        updateDoc(doc(db, 'users', USER_A), {
          'profile.bio': 'Injected bio',
        })
      );
    });
  });

  describe('Unauthenticated user cannot access profiles', () => {
    it('denies unauthenticated read', async () => {
      await seedUser(USER_A, {});
      const db = testEnv.unauthenticatedContext().firestore();

      await assertFails(getDoc(doc(db, 'users', USER_A)));
    });

    it('denies unauthenticated update', async () => {
      await seedUser(USER_A, {});
      const db = testEnv.unauthenticatedContext().firestore();

      await assertFails(
        updateDoc(doc(db, 'users', USER_A), {
          displayName: 'Anonymous',
        })
      );
    });
  });

  describe('Delete is always denied', () => {
    it('denies owner from deleting own profile', async () => {
      await seedUser(USER_A, {});
      const db = testEnv.authenticatedContext(USER_A).firestore();

      await assertFails(deleteDoc(doc(db, 'users', USER_A)));
    });
  });

  describe('Authenticated user can read any profile', () => {
    it('allows user B to read user A profile', async () => {
      await seedUser(USER_A, {});
      const db = testEnv.authenticatedContext(USER_B).firestore();

      await assertSucceeds(getDoc(doc(db, 'users', USER_A)));
    });
  });
});

describe('User Notifications Security Rules', () => {
  const USER_A = 'user-a-uid';
  const USER_B = 'user-b-uid';

  async function seedUserWithNotification(uid: string) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', uid), {
        uid,
        role: 'student',
        displayName: 'Test Student',
      });
      await setDoc(doc(db, 'users', uid, 'notifications', 'notif-1'), {
        id: 'notif-1',
        type: 'connection_accepted',
        title: 'Conexão aceita',
        body: 'Seu personal aceitou.',
        isRead: false,
      });
    });
  }

  it('allows owner to read own notifications', async () => {
    await seedUserWithNotification(USER_A);
    const db = testEnv.authenticatedContext(USER_A).firestore();

    await assertSucceeds(
      getDoc(doc(db, 'users', USER_A, 'notifications', 'notif-1'))
    );
  });

  it('denies other user from reading notifications', async () => {
    await seedUserWithNotification(USER_A);
    const db = testEnv.authenticatedContext(USER_B).firestore();

    await assertFails(
      getDoc(doc(db, 'users', USER_A, 'notifications', 'notif-1'))
    );
  });

  it('allows owner to mark notification as read', async () => {
    await seedUserWithNotification(USER_A);
    const db = testEnv.authenticatedContext(USER_A).firestore();

    await assertSucceeds(
      updateDoc(doc(db, 'users', USER_A, 'notifications', 'notif-1'), {
        isRead: true,
      })
    );
  });

  it('denies other user from modifying notifications', async () => {
    await seedUserWithNotification(USER_A);
    const db = testEnv.authenticatedContext(USER_B).firestore();

    await assertFails(
      updateDoc(doc(db, 'users', USER_A, 'notifications', 'notif-1'), {
        isRead: true,
      })
    );
  });
});
