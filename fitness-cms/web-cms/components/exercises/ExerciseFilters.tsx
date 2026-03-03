'use client';

import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { ExerciseCategory } from '@/types';

export interface ExerciseFilterState {
  search: string;
  category: ExerciseCategory | 'all';
  equipment: string;
  source: 'all' | 'system' | 'trainer';
  isActive: 'all' | 'active' | 'inactive';
}

interface ExerciseFiltersProps {
  filters: ExerciseFilterState;
  onChange: (filters: ExerciseFilterState) => void;
}

const CATEGORY_OPTIONS: { value: ExerciseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'chest', label: 'Peitoral' },
  { value: 'back', label: 'Costas' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'forearms', label: 'Antebraços' },
  { value: 'core', label: 'Core/Abdômen' },
  { value: 'quadriceps', label: 'Quadríceps' },
  { value: 'hamstrings', label: 'Posterior de coxa' },
  { value: 'glutes', label: 'Glúteos' },
  { value: 'calves', label: 'Panturrilha' },
  { value: 'full_body', label: 'Corpo todo' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'stretching', label: 'Alongamento' },
];

const EQUIPMENT_OPTIONS = [
  { value: 'all', label: 'Todos os equipamentos' },
  { value: 'barbell', label: 'Barra' },
  { value: 'dumbbell', label: 'Halter' },
  { value: 'cable', label: 'Cabo/Polia' },
  { value: 'machine', label: 'Máquina' },
  { value: 'bodyweight', label: 'Peso corporal' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance_band', label: 'Elástico' },
  { value: 'pull-up bar', label: 'Barra fixa' },
];

export function ExerciseFilters({ filters, onChange }: ExerciseFiltersProps) {
  const update = (partial: Partial<ExerciseFilterState>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search + primary filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
          />
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <select
            value={filters.category}
            onChange={(e) => update({ category: e.target.value as ExerciseCategory | 'all' })}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Equipment */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <select
            value={filters.equipment}
            onChange={(e) => update({ equipment: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
          >
            {EQUIPMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggle filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Source toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          {(['all', 'system', 'trainer'] as const).map((src) => {
            const labels = { all: 'Todos', system: 'Sistema', trainer: 'Personal' };
            return (
              <button
                key={src}
                onClick={() => update({ source: src })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filters.source === src
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {labels[src]}
              </button>
            );
          })}
        </div>

        {/* Active/inactive toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          {(['all', 'active', 'inactive'] as const).map((s) => {
            const labels = { all: 'Todos', active: 'Ativos', inactive: 'Inativos' };
            return (
              <button
                key={s}
                onClick={() => update({ isActive: s })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filters.isActive === s
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>

        {/* Clear filters */}
        {(filters.search ||
          filters.category !== 'all' ||
          filters.equipment !== 'all' ||
          filters.source !== 'all' ||
          filters.isActive !== 'all') && (
          <button
            onClick={() =>
              onChange({
                search: '',
                category: 'all',
                equipment: 'all',
                source: 'all',
                isActive: 'all',
              })
            }
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
