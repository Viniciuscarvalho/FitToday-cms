import { serverTimestamp } from 'firebase/firestore';
import { PersonalTrainer } from '@/types';
import { PLANS } from '@/lib/constants';

export function createTrainerDefaults(
  uid: string,
  email: string,
  displayName: string,
  photoURL: string
): Partial<PersonalTrainer> {
  return {
    uid,
    email,
    displayName,
    photoURL,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    isActive: true,
    role: 'trainer',
    status: 'pending',
    profile: {
      bio: '',
      specialties: [],
      certifications: [],
      experience: 0,
    },
    store: {
      slug: '',
      isVerified: false,
      rating: 0,
      totalReviews: 0,
      totalSales: 0,
      totalStudents: 0,
    },
    financial: {
      totalEarnings: 0,
      pendingBalance: 0,
      availableBalance: 0,
    },
    subscription: {
      plan: 'starter',
      status: 'active',
      features: PLANS.starter.features,
    },
  };
}
