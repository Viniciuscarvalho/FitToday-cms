import { Timestamp } from 'firebase/firestore';

// ============================================================
// WORKOUT TYPES
// ============================================================

export type WorkoutStatus = 'active' | 'completed' | 'archived';
export type DifficultyRating = 'too_easy' | 'adequate' | 'too_hard';

export interface Workout {
  id: string;
  trainerId: string;
  studentId: string;
  title: string;
  description?: string;
  pdfUrl: string;
  pdfPath: string; // Firebase Storage path
  durationWeeks?: number;
  totalDays: number;
  startDate?: Timestamp;
  status: WorkoutStatus;
  viewedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkoutProgress {
  id: string;
  workoutId: string;
  studentId: string;
  completedDays: number[];
  totalDays: number;
  percentComplete: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkoutFeedback {
  id: string;
  workoutId: string;
  studentId: string;
  trainerId: string;
  dayNumber?: number;
  rating?: number; // 1-5 stars
  message: string;
  difficulty?: DifficultyRating;
  trainerResponse?: string;
  respondedAt?: Timestamp;
  createdAt: Timestamp;
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

export interface CreateWorkoutRequest {
  studentId: string;
  title: string;
  description?: string;
  durationWeeks?: number;
  totalDays?: number;
  startDate?: string; // ISO date string
}

export interface CreateWorkoutResponse {
  id: string;
  pdfUrl: string;
  createdAt: string;
}

export interface WorkoutWithProgress extends Workout {
  progress?: WorkoutProgress;
  feedbackCount?: number;
}

export interface WorkoutListResponse {
  workouts: WorkoutWithProgress[];
  total: number;
}

export interface WorkoutProgressResponse {
  workoutId: string;
  completedDays: number[];
  totalDays: number;
  percentComplete: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt?: string;
}

export interface WorkoutFeedbackListResponse {
  feedbacks: WorkoutFeedback[];
  total: number;
}

export interface FeedbackReplyRequest {
  response: string;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function calculatePercentComplete(completedDays: number[], totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((completedDays.length / totalDays) * 100);
}

export function calculateStreak(completedDays: number[]): { current: number; longest: number } {
  if (completedDays.length === 0) return { current: 0, longest: 0 };

  const sorted = [...completedDays].sort((a, b) => a - b);
  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Check if last completed day is recent (within last 2 days for current streak)
  const lastDay = sorted[sorted.length - 1];
  const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Simplified day number

  // For current streak, we need to track from the end
  currentStreak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}
