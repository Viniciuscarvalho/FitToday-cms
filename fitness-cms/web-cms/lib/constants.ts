import { PlanFeatures } from '@/types';

// Platform fee percentage (default, used as fallback)
export const PLATFORM_FEE_PERCENT = 10;

// -1 means unlimited
export type PlanId = 'starter' | 'pro' | 'elite';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthly: number; // BRL cents (0 = free)
  commissionRate: number; // percentage per transaction
  features: PlanFeatures;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 0,
    commissionRate: 10,
    features: {
      maxPrograms: 3,
      maxStudents: 5,
      customBranding: false,
      analyticsAdvanced: false,
      prioritySupport: false,
      commissionRate: 10,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9700, // R$97
    commissionRate: 5,
    features: {
      maxPrograms: -1,
      maxStudents: -1,
      customBranding: false,
      analyticsAdvanced: true,
      prioritySupport: false,
      commissionRate: 5,
    },
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    priceMonthly: 19700, // R$197
    commissionRate: 0,
    features: {
      maxPrograms: -1,
      maxStudents: -1,
      customBranding: true,
      analyticsAdvanced: true,
      prioritySupport: true,
      commissionRate: 0,
    },
  },
};

export function getPlanFeatures(planId: PlanId): PlanFeatures {
  return PLANS[planId]?.features ?? PLANS.starter.features;
}

export function isWithinStudentLimit(maxStudents: number, currentCount: number): boolean {
  return maxStudents === -1 || currentCount < maxStudents;
}

export function isWithinProgramLimit(maxPrograms: number, currentCount: number): boolean {
  return maxPrograms === -1 || currentCount < maxPrograms;
}
