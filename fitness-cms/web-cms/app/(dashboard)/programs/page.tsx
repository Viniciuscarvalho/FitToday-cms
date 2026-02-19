'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Users,
  Calendar,
  Clock,
  FileText,
  Archive,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { apiRequest } from '@/lib/api-client';
import { WorkoutProgram } from '@/types';

type ProgramStatus = 'all' | 'draft' | 'published' | 'archived';

export default function ProgramsPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProgramStatus>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrograms() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest<{ programs: WorkoutProgram[]; total: number }>(
          `/api/programs?trainerId=${user.uid}`
        );
        setPrograms(data.programs);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, [user]);

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('Tem certeza que deseja arquivar este programa? Ele não ficará mais visível para alunos.')) return;

    try {
      setActionLoading(programId);
      await apiRequest(`/api/programs/${programId}`, { method: 'DELETE' });
      setPrograms(programs.map((p) =>
        p.id === programId ? { ...p, status: 'archived' as const } : p
      ));
      setOpenMenuId(null);
    } catch (error: any) {
      console.error('Error archiving program:', error);
      alert(error.message || 'Erro ao arquivar programa');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicateProgram = async (program: WorkoutProgram) => {
    try {
      setActionLoading(program.id);
      const data = await apiRequest(`/api/programs/${program.id}/duplicate`, {
        method: 'POST',
      });

      // Refetch programs to get the new duplicate
      if (user) {
        const refreshed = await apiRequest<{ programs: WorkoutProgram[]; total: number }>(
          `/api/programs?trainerId=${user.uid}`
        );
        setPrograms(refreshed.programs);
      }
      setOpenMenuId(null);
    } catch (error: any) {
      console.error('Error duplicating program:', error);
      alert(error.message || 'Erro ao duplicar programa');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (program: WorkoutProgram) => {
    const newStatus = program.status === 'published' ? 'draft' : 'published';

    try {
      setActionLoading(program.id);
      await apiRequest(`/api/programs/${program.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setPrograms(
        programs.map((p) =>
          p.id === program.id ? { ...p, status: newStatus } : p
        )
      );
      setOpenMenuId(null);
    } catch (error: any) {
      console.error('Error updating program status:', error);
      alert(error.message || 'Erro ao atualizar status do programa');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-600',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-yellow-100 text-yellow-700',
    };
    const labels = {
      draft: 'Rascunho',
      published: 'Publicado',
      archived: 'Arquivado',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programas</h1>
          <p className="text-gray-500 mt-1">
            Gerencie seus programas de treino
          </p>
        </div>
        <Link
          href="/programs/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Novo Programa
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar programas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProgramStatus)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          >
            <option value="all">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Cover Image */}
              <div className="h-40 bg-gradient-to-br from-primary-500 to-primary-700 relative">
                {program.coverImageURL && (
                  <img
                    src={program.coverImageURL}
                    alt={program.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 left-3">
                  {getStatusBadge(program.status)}
                </div>
                <div className="absolute top-3 right-3">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === program.id ? null : program.id
                        )
                      }
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </button>
                    {openMenuId === program.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <Link
                          href={`/programs/${program.id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDuplicateProgram(program)}
                          disabled={actionLoading === program.id}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full disabled:opacity-50"
                        >
                          {actionLoading === program.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          Duplicar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(program)}
                          disabled={actionLoading === program.id}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full disabled:opacity-50"
                        >
                          {program.status === 'published' ? (
                            <>
                              <Eye className="h-4 w-4" />
                              Despublicar
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Publicar
                            </>
                          )}
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => handleDeleteProgram(program.id)}
                          disabled={actionLoading === program.id}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full disabled:opacity-50"
                        >
                          {actionLoading === program.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                          Arquivar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {program.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {program.description || 'Sem descrição'}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {program.duration?.weeks || 0} semanas
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {program.duration?.daysPerWeek || 0}x/semana
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{program.stats?.activeStudents || 0} alunos</span>
                  </div>
                  <span className="font-semibold text-primary-600">
                    {formatCurrency(program.pricing?.price || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all'
              ? 'Nenhum programa encontrado'
              : 'Nenhum programa criado'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro programa de treino'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/programs/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Criar Programa
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
