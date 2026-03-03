'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Loader2, Search, Filter, Users } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { apiRequest } from '@/lib/api-client';
import { UploadWorkoutModal } from '@/components/workouts/UploadWorkoutModal';
import { WorkoutWithProgress, WorkoutStatus } from '@/types/workout';

interface Student {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

interface WorkoutWithStudent extends WorkoutWithProgress {
  studentName?: string;
  studentEmail?: string;
}

const STATUS_LABELS: Record<WorkoutStatus, string> = {
  active: 'Ativo',
  completed: 'Concluído',
  archived: 'Arquivado',
};

const STATUS_STYLES: Record<WorkoutStatus, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-600',
};

export default function WorkoutsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutWithStudent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<WorkoutStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const [workoutsData, studentsData] = await Promise.all([
        apiRequest<{ workouts: WorkoutWithProgress[] }>('/api/workouts'),
        apiRequest<{ students: Student[] }>('/api/students'),
      ]);

      const studentsMap = new Map(
        (studentsData.students || []).map((s) => [s.id, s])
      );

      const enriched: WorkoutWithStudent[] = (workoutsData.workouts || []).map((w) => {
        const student = studentsMap.get(w.studentId);
        return {
          ...w,
          studentName: student?.displayName || 'Aluno',
          studentEmail: student?.email,
        };
      });

      setWorkouts(enriched);
      setStudents(studentsData.students || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar treinos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredWorkouts = workouts.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        w.title.toLowerCase().includes(q) ||
        w.studentName?.toLowerCase().includes(q) ||
        w.studentEmail?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treinos Enviados</h1>
          <p className="text-sm text-gray-500 mt-1">
            {workouts.length} treino{workouts.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
        >
          <Plus className="h-5 w-5" />
          Enviar Treino
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por treino ou aluno..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
        </div>
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

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && filteredWorkouts.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {workouts.length === 0 ? 'Nenhum treino enviado ainda' : 'Nenhum treino encontrado'}
          </h3>
          <p className="text-gray-500 mb-4">
            {workouts.length === 0
              ? 'Envie o primeiro treino para um aluno'
              : 'Tente ajustar os filtros de busca'}
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

      {/* Workouts Table */}
      {filteredWorkouts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Treino
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Aluno
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Progresso
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Enviado em
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredWorkouts.map((workout) => (
                <tr
                  key={workout.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/cms/students/${workout.studentId}/workouts/${workout.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{workout.title}</p>
                        {workout.durationWeeks && (
                          <p className="text-xs text-gray-500">{workout.durationWeeks} semanas</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{workout.studentName}</p>
                        {workout.studentEmail && (
                          <p className="text-xs text-gray-400">{workout.studentEmail}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {workout.progress ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${workout.progress.percentComplete}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {workout.progress.percentComplete}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[workout.status] || STATUS_STYLES.active}`}
                    >
                      {STATUS_LABELS[workout.status] || workout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {workout.createdAt
                      ? new Date(workout.createdAt as any).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/cms/students/${workout.studentId}/workouts/${workout.id}`);
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadWorkoutModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={loadData}
        trainerId={user?.uid || ''}
        students={students}
      />
    </div>
  );
}
