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
    plan: 'starter' | 'pro' | 'elite';
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
  trainerId?: string;
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
  plan?: StudentPlan;
  purchases: {
    activeSubscriptions: string[];
    purchasedPrograms: string[];
    totalSpent: number;
  };
}

export interface StudentPlan {
  monthlyFee: number;
  billingDay: number;
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  stripeSubscriptionId?: string;
  status: 'active' | 'past_due' | 'cancelled';
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
  studentId?: string;
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
// REVIEW TYPES
// ============================================================

export interface TrainerReview {
  id: string;
  trainerId: string;
  studentId: string;
  studentName: string;
  studentPhotoURL?: string;
  rating: number;
  comment?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// PUBLIC API RESPONSE TYPES
// ============================================================

export interface PublicTrainerProfile {
  id: string;
  displayName: string;
  photoURL?: string;
  profile: {
    bio: string;
    specialties: string[];
    certifications: { name: string; institution: string; year: number }[];
    experience: number;
    socialMedia?: { instagram?: string; youtube?: string; tiktok?: string };
    coverPhotoURL?: string;
    location?: { city: string; state: string; country: string };
  };
  stats: {
    rating: number;
    totalReviews: number;
    totalStudents: number;
  };
}

export interface PublicTrainerListResponse {
  trainers: PublicTrainerProfile[];
  total: number;
  hasMore: boolean;
}

export interface TrainerReviewListResponse {
  reviews: Omit<TrainerReview, 'trainerId' | 'studentId' | 'updatedAt'>[];
  total: number;
  averageRating: number;
}

// ============================================================
// PROGRESS TRACKING TYPES
// ============================================================

export interface ProgressEntry {
  id: string;
  trainerId: string;
  studentId: string;
  date: Timestamp;
  measurements: {
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    rightArm?: number;
    leftArm?: number;
    rightThigh?: number;
    leftThigh?: number;
    rightCalf?: number;
    leftCalf?: number;
  };
  photos?: {
    front?: string;
    side?: string;
    back?: string;
  };
  notes?: string;
  registeredBy: 'trainer' | 'student';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// CHAT TYPES
// ============================================================

export interface Chat {
  id: string;
  participants: string[];
  trainerId: string;
  studentId: string;
  lastMessage?: {
    text: string;
    sentBy: string;
    sentAt: Timestamp;
  };
  unreadCount: Record<string, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  text: string;
  sentBy: string;
  sentAt: Timestamp;
  readAt?: Timestamp;
  type: 'text' | 'image' | 'file';
  mediaUrl?: string;
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface AnalyticsSnapshot {
  trainerId: string;
  month: string;
  activeStudents: number;
  newStudents: number;
  cancelledStudents: number;
  retentionRate: number;
  averageRating: number;
  revenue: number;
  churnRate: number;
}

export interface DashboardStats {
  activeStudents: number;
  activePrograms: number;
  monthlyRevenue: number;
  averageRating: number;
  revenueChange: number;
  studentsChange: number;
}
