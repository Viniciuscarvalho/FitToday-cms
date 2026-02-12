import { Timestamp } from 'firebase/firestore';

// ============================================================
// USER TYPES
// ============================================================

export type UserRole = 'student' | 'trainer' | 'admin';
export type TrainerStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface BaseUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface PersonalTrainer extends BaseUser {
  role: 'trainer';
  status: TrainerStatus;
  statusUpdatedAt?: Timestamp;
  statusUpdatedBy?: string;
  rejectionReason?: string;
  profile: {
    bio: string;
    specialties: string[];
    certifications: Certification[];
    experience: number;
    socialMedia?: {
      instagram?: string;
      youtube?: string;
      tiktok?: string;
    };
    coverPhotoURL?: string;
    location?: {
      city: string;
      state: string;
      country: string;
    };
  };
  store: {
    slug: string;
    isVerified: boolean;
    rating: number;
    totalReviews: number;
    totalSales: number;
    totalStudents: number;
  };
  financial: {
    stripeAccountId?: string;
    totalEarnings: number;
    pendingBalance: number;
    availableBalance: number;
  };
  subscription: {
    plan: 'free' | 'pro' | 'premium';
    status: 'active' | 'canceled' | 'past_due';
    features: PlanFeatures;
  };
}

export interface Certification {
  name: string;
  institution: string;
  year: number;
  documentURL?: string;
  verified: boolean;
}

export interface PlanFeatures {
  maxPrograms: number;
  maxStudents: number;
  customBranding: boolean;
  analyticsAdvanced: boolean;
  prioritySupport: boolean;
  commissionRate: number;
}

export interface Student extends BaseUser {
  role: 'student';
  fitnessProfile: {
    height?: number;
    weight?: number;
    birthDate?: Timestamp;
    gender?: 'male' | 'female' | 'other';
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    goals: string[];
    injuries?: string[];
    availableEquipment: string[];
  };
  purchases: {
    activeSubscriptions: string[];
    purchasedPrograms: string[];
    totalSpent: number;
  };
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  permissions: {
    canApproveTrainers: boolean;
    canSuspendTrainers: boolean;
    canViewMetrics: boolean;
  };
}

export type AppUser = PersonalTrainer | Student | AdminUser;

// ============================================================
// PROGRAM TYPES
// ============================================================

export type ProgramCategory =
  | 'hypertrophy'
  | 'weight_loss'
  | 'strength'
  | 'functional'
  | 'calisthenics'
  | 'crossfit'
  | 'powerlifting'
  | 'bodybuilding'
  | 'home_workout'
  | 'rehabilitation';

export interface WorkoutProgram {
  id: string;
  trainerId: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImageURL: string;
  previewVideoURL?: string;
  category: ProgramCategory;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: {
    weeks: number;
    daysPerWeek: number;
    avgSessionMinutes: number;
  };
  requirements: {
    equipment: string[];
    fitnessLevel: string;
    prerequisites?: string;
  };
  content: {
    totalWorkouts: number;
    totalExercises: number;
    includesNutrition: boolean;
    includesSupplements: boolean;
    hasVideoGuides: boolean;
  };
  pricing: {
    type: 'one_time' | 'subscription';
    price: number;
    currency: 'BRL' | 'USD';
    originalPrice?: number;
    subscriptionInterval?: 'monthly' | 'quarterly' | 'yearly';
  };
  stats: {
    totalSales: number;
    activeStudents: number;
    completionRate: number;
    averageRating: number;
    totalReviews: number;
  };
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface ProgramWeek {
  weekNumber: number;
  title: string;
  description?: string;
  focus?: string;
  workouts: ProgramWorkout[];
  restDays: number[];
}

export interface ProgramWorkout {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  estimatedDuration: number;
  warmup?: WorkoutSection;
  mainWorkout: WorkoutSection;
  cooldown?: WorkoutSection;
  notes?: string;
  videoURL?: string;
}

export interface WorkoutSection {
  title: string;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps: string;
  restSeconds: number;
  techniques?: ExerciseTechnique[];
  tempo?: string;
  rpe?: number;
  percentageRM?: number;
  personalNotes?: string;
  substitutions?: string[];
}

export type ExerciseTechnique =
  | 'drop_set'
  | 'super_set'
  | 'giant_set'
  | 'rest_pause'
  | 'pyramid'
  | 'negative'
  | 'isometric'
  | 'cluster';

// ============================================================
// EXERCISE TYPES
// ============================================================

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'obliques'
  | 'lower_back'
  | 'traps'
  | 'lats'
  | 'rhomboids';

export interface Exercise {
  id: string;
  name: string;
  alternativeNames?: string[];
  description: string;
  muscleGroups: {
    primary: MuscleGroup[];
    secondary: MuscleGroup[];
  };
  category: string;
  equipment: string[];
  media: {
    thumbnailURL: string;
    gifURL?: string;
    videoURL?: string;
  };
  instructions: {
    setup: string;
    execution: string[];
    tips: string[];
    commonMistakes: string[];
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isCompound: boolean;
  source: 'system' | 'trainer';
  trainerId?: string;
}

// ============================================================
// SUBSCRIPTION & PROGRESS TYPES
// ============================================================

export interface Subscription {
  id: string;
  studentId: string;
  trainerId: string;
  programId: string;
  status: 'active' | 'canceled' | 'past_due' | 'expired';
  startDate: Timestamp;
  currentPeriodEnd: Timestamp;
  pricing: {
    amount: number;
    currency: string;
    interval: string;
  };
  createdAt: Timestamp;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  trainerId: string;
  programId: string;
  currentWeek: number;
  currentDay: number;
  completionPercentage: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  metrics: {
    totalWorkoutsCompleted: number;
    totalTimeSpent: number;
    currentStreak: number;
    longestStreak: number;
  };
  updatedAt: Timestamp;
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface DashboardStats {
  activeStudents: number;
  totalPrograms: number;
  monthlyRevenue: number;
  averageRating: number;
  revenueChange: number;
  studentsChange: number;
}
