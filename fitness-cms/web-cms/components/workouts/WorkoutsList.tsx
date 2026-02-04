'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Loader2, Search, Filter } from 'lucide-react';
import { WorkoutCard } from './WorkoutCard';
import { UploadWorkoutModal } from './UploadWorkoutModal';
import { WorkoutWithProgress, WorkoutStatus } from '@/types/workout';

interface Student {
  id: string;
  displayName: string;
  email: string;
}

interface WorkoutsListProps {
  trainerId: string;
  student: Student;
}

export function WorkoutsList({ trainerId, student }: WorkoutsListProps) {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<WorkoutStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        trainerId,
        studentId: student.id,
      });

      const response = await fetch(`/api/workouts?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar treinos');
      }

      setWorkouts(data.workouts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, [trainerId, student.id]);

  const handleView = (workoutId: string) => {
    router.push(`/students/${student.id}/workouts/${workoutId}`);
  };

  const handleArchive = async (workoutId: string) => {
    if (!confirm('Tem certeza que deseja arquivar este treino?')) return;

    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao arquivar treino');
      }

      // Reload list
      loadWorkouts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (workoutId: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este treino? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/workouts/${workoutId}?hard=true`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir treino');
      }

      // Reload list
      loadWorkouts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter workouts
  const filteredWorkouts = workouts.filter((workout) => {
    // Status filter
    if (statusFilter !== 'all' && workout.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        workout.title.toLowerCase().includes(query) ||
        workout.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Treinos</h2>
          <p className="text-sm text-gray-500">
            {workouts.length} treino{workouts.length !== 1 ? 's' : ''} enviado{workouts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
        >
          <Plus className="h-5 w-5" />
          Novo Treino
        </button>
      </div>

      {/* Filters */}
      {workouts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar treinos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as WorkoutStatus | 'all')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none appearance-none bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="completed">Concluídos</option>
              <option value="archived">Arquivados</option>
            </select>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!error && filteredWorkouts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {workouts.length === 0
              ? 'Nenhum treino enviado'
              : 'Nenhum treino encontrado'}
          </h3>
          <p className="text-gray-500 mb-4">
            {workouts.length === 0
              ? `Envie o primeiro treino para ${student.displayName}`
              : 'Tente ajustar os filtros'}
          </p>
          {workouts.length === 0 && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
            >
              <Plus className="h-5 w-5" />
              Enviar Treino
            </button>
          )}
        </div>
      )}

      {/* Workouts Grid */}
      {filteredWorkouts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onView={handleView}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadWorkoutModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={loadWorkouts}
        trainerId={trainerId}
        student={student}
      />
    </div>
  );
}
