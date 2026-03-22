import { z } from 'zod';

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const StatusFilterSchema = z.object({
  status: z.string().optional(),
});

export const WorkoutFiltersSchema = PaginationSchema.merge(StatusFilterSchema).extend({
  studentId: z.string().optional(),
});

export const ExerciseFiltersSchema = PaginationSchema.extend({
  category: z.string().optional(),
  equipment: z.string().optional(),
  level: z.string().optional(),
  source: z.enum(['system', 'trainer']).optional(),
  search: z.string().optional(),
});

export const ProgramFiltersSchema = PaginationSchema.extend({
  trainerId: z.string().optional(),
  studentId: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  visibility: z.string().optional(),
});

export const TrainerFiltersSchema = PaginationSchema.extend({
  city: z.string().optional(),
  specialty: z.string().optional(),
});
