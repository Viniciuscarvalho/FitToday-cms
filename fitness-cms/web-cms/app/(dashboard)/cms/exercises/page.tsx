'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Dumbbell, LayoutGrid, List } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ExerciseFilters, ExerciseFilterState } from '@/components/exercises/ExerciseFilters';
import { ExerciseTable } from '@/components/exercises/ExerciseTable';
import { ExerciseCard } from '@/components/exercises/ExerciseCard';
import { apiRequest } from '@/lib/api-client';
import { Exercise } from '@/types';

const ITEMS_PER_PAGE = 20;

const DEFAULT_FILTERS: ExerciseFilterState = {
  search: '',
  category: 'all',
  equipment: 'all',
  source: 'all',
  isActive: 'all',
};

interface ExercisesResponse {
  exercises: Exercise[];
  total: number;
  page: number;
  limit: number;
}

function buildQueryString(
  filters: ExerciseFilterState,
  page: number,
  limit: number
): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.equipment !== 'all') params.set('equipment', filters.equipment);
  if (filters.source !== 'all') params.set('source', filters.source);
  if (filters.isActive === 'active') params.set('isActive', 'true');
  if (filters.isActive === 'inactive') params.set('isActive', 'false');
  return params.toString();
}

export default function ExercisesPage() {
  const [filters, setFilters] = useState<ExerciseFilterState>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const queryString = buildQueryString(filters, currentPage, ITEMS_PER_PAGE);

  const { data, isLoading, isError } = useQuery<ExercisesResponse>({
    queryKey: ['exercises', queryString],
    queryFn: () => apiRequest<ExercisesResponse>(`/api/exercises?${queryString}`),
    staleTime: 1000 * 30,
  });

  const handleFiltersChange = useCallback((newFilters: ExerciseFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const exercises = data?.exercises ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // ----------------------------------------------------------------
  // Loading skeleton
  // ----------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-52 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-44 animate-pulse" />
        </div>
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 border-b border-gray-100 animate-pulse bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Error state
  // ----------------------------------------------------------------
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Exercícios</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erro ao carregar exercícios
          </h3>
          <p className="text-gray-500">
            Não foi possível buscar os exercícios. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Main render
  // ----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Exercícios</h1>
          <p className="text-gray-500 mt-1">
            {totalCount > 0
              ? `${totalCount} exercício${totalCount !== 1 ? 's' : ''} no catálogo`
              : 'Gerencie os exercícios disponíveis para seus programas'}
          </p>
        </div>
        <Link
          href="/cms/exercises/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-5 w-5" />
          Adicionar Exercício
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <ExerciseFilters filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* View toggle + results info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {exercises.length > 0
            ? `Mostrando ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                currentPage * ITEMS_PER_PAGE,
                totalCount
              )} de ${totalCount}`
            : 'Nenhum resultado'}
        </p>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Visualização em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Exercise list / grid */}
      {viewMode === 'table' ? (
        <ExerciseTable
          exercises={exercises}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      ) : exercises.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>

          {/* Grid pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <p className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum exercício encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            Tente ajustar os filtros ou adicione um novo exercício ao catálogo.
          </p>
          <Link
            href="/cms/exercises/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Adicionar Exercício
          </Link>
        </div>
      )}
    </div>
  );
}
