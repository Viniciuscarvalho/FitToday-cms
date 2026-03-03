'use client';

import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { Exercise, ExerciseCategory } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: 'Peitoral',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  core: 'Core/Abdômen',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posterior',
  glutes: 'Glúteos',
  calves: 'Panturrilha',
  full_body: 'Corpo todo',
  cardio: 'Cardio',
  stretching: 'Alongamento',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Halter',
  cable: 'Cabo/Polia',
  machine: 'Máquina',
  bodyweight: 'Peso corporal',
  kettlebell: 'Kettlebell',
  resistance_band: 'Elástico',
  'pull-up bar': 'Barra fixa',
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peitoral',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posterior',
  glutes: 'Glúteos',
  calves: 'Panturrilha',
  abs: 'Abdômen',
  obliques: 'Oblíquos',
  lower_back: 'Lombar',
  traps: 'Trapézio',
  lats: 'Latíssimo',
  rhomboids: 'Romboides',
  full_body: 'Corpo todo',
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const primaryMuscles = exercise.muscleGroups?.primary?.slice(0, 2) ?? [];

  return (
    <Link
      href={`/cms/exercises/${exercise.id}`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:border-primary-200 group block"
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {exercise.media?.thumbnailURL ? (
          <img
            src={exercise.media.thumbnailURL}
            alt={exercise.name.pt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : exercise.media?.gifURL ? (
          <img
            src={exercise.media.gifURL}
            alt={exercise.name.pt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Source badge overlay */}
        <div className="absolute top-2 left-2">
          {exercise.source === 'system' ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/90 text-white backdrop-blur-sm">
              Sistema
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/90 text-white backdrop-blur-sm">
              Personal
            </span>
          )}
        </div>

        {/* Active/inactive */}
        {!exercise.isActive && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800/80 text-gray-300 backdrop-blur-sm">
              Inativo
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 group-hover:text-primary-600 transition-colors">
          {exercise.name.pt}
        </h3>
        {exercise.name.en && exercise.name.en !== exercise.name.pt && (
          <p className="text-xs text-gray-400 mb-2 truncate">{exercise.name.en}</p>
        )}

        {/* Category badge */}
        <div className="mb-3">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
            {CATEGORY_LABELS[exercise.category] ?? exercise.category}
          </span>
        </div>

        {/* Equipment & muscles row */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Dumbbell className="h-3 w-3" />
            {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
          </span>
          {primaryMuscles.length > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="truncate max-w-[120px]">
                {primaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m).join(', ')}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
