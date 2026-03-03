'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { Exercise, ExerciseCategory } from '@/types';

interface ExerciseTableProps {
  exercises: Exercise[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
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

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export function ExerciseTable({
  exercises,
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
}: ExerciseTableProps) {
  const router = useRouter();

  if (exercises.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum exercício encontrado
        </h3>
        <p className="text-gray-500">
          Tente ajustar os filtros ou adicione um novo exercício ao catálogo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-14">
              Thumb
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome (PT)
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Categoria
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Equipamento
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Fonte
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
              Nível
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {exercises.map((exercise) => (
            <tr
              key={exercise.id}
              onClick={() => router.push(`/cms/exercises/${exercise.id}`)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* Thumbnail */}
              <td className="px-6 py-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {exercise.media?.thumbnailURL ? (
                    <img
                      src={exercise.media.thumbnailURL}
                      alt={exercise.name.pt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
              </td>

              {/* Name */}
              <td className="px-6 py-3">
                <div>
                  <p className="font-medium text-gray-900 text-sm leading-tight">
                    {exercise.name.pt}
                  </p>
                  {exercise.name.en && exercise.name.en !== exercise.name.pt && (
                    <p className="text-xs text-gray-400 mt-0.5">{exercise.name.en}</p>
                  )}
                </div>
              </td>

              {/* Category */}
              <td className="px-6 py-3 hidden md:table-cell">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                  {CATEGORY_LABELS[exercise.category] ?? exercise.category}
                </span>
              </td>

              {/* Equipment */}
              <td className="px-6 py-3 hidden lg:table-cell">
                <span className="text-sm text-gray-600">
                  {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
                </span>
              </td>

              {/* Source badge */}
              <td className="px-6 py-3 hidden lg:table-cell">
                {exercise.source === 'system' ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Sistema
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Personal
                  </span>
                )}
              </td>

              {/* Level */}
              <td className="px-6 py-3 hidden xl:table-cell">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    LEVEL_COLORS[exercise.level] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {LEVEL_LABELS[exercise.level] ?? exercise.level}
                </span>
              </td>

              {/* Status */}
              <td className="px-6 py-3">
                {exercise.isActive ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Ativo
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    Inativo
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} exercícios
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPageChange(currentPage - 1);
              }}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageChange(page);
                  }}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPageChange(currentPage + 1);
              }}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
