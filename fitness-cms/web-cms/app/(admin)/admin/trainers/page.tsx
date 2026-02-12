'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  ChevronDown,
  AlertCircle,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { TrainerStatus } from '@/types';

interface TrainerListItem {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  status: TrainerStatus;
  createdAt: string;
  statusUpdatedAt?: string;
  profile?: {
    bio: string;
    specialties: string[];
    experience: number;
  };
  store?: {
    totalStudents: number;
    totalSales: number;
  };
}

interface TrainerListResponse {
  trainers: TrainerListItem[];
  total: number;
  pending: number;
  active: number;
  suspended: number;
}

type FilterStatus = 'all' | TrainerStatus;

const statusConfig: Record<TrainerStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: 'Pendente', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
  active: { label: 'Ativo', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  suspended: { label: 'Suspenso', color: 'text-red-600', bgColor: 'bg-red-50', icon: Ban },
  rejected: { label: 'Rejeitado', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: XCircle },
};

export default function TrainersPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [trainers, setTrainers] = useState<TrainerListItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, active: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(
    (searchParams.get('status') as FilterStatus) || 'all'
  );
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainers();
  }, [user, filterStatus]);

  const fetchTrainers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }

      const response = await fetch(`/api/admin/trainers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trainers');
      }

      const data: TrainerListResponse = await response.json();
      setTrainers(data.trainers);
      setCounts({
        total: data.total,
        pending: data.pending,
        active: data.active,
        suspended: data.suspended,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (trainerId: string) => {
    if (!user) return;
    setActionLoading(trainerId);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/trainers/${trainerId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve trainer');
      }

      fetchTrainers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (trainerId: string) => {
    if (!user) return;
    const reason = prompt('Motivo da rejeição (opcional):');
    setActionLoading(trainerId);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/trainers/${trainerId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject trainer');
      }

      fetchTrainers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (trainerId: string) => {
    if (!user) return;
    const reason = prompt('Motivo da suspensão (opcional):');
    setActionLoading(trainerId);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/trainers/${trainerId}/suspend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to suspend trainer');
      }

      fetchTrainers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTrainers = trainers.filter((trainer) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      trainer.displayName?.toLowerCase().includes(search) ||
      trainer.email?.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Trainers</h1>
        <p className="text-gray-600 mt-1">
          Aprove, rejeite ou suspenda personal trainers
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filterStatus === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos ({counts.total})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filterStatus === 'pending'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
          }`}
        >
          Pendentes ({counts.pending})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filterStatus === 'active'
              ? 'bg-green-500 text-white'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          Ativos ({counts.active})
        </button>
        <button
          onClick={() => setFilterStatus('suspended')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filterStatus === 'suspended'
              ? 'bg-red-500 text-white'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          Suspensos ({counts.suspended})
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Trainers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-48 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhum trainer encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTrainers.map((trainer) => {
              const statusInfo = statusConfig[trainer.status];
              const StatusIcon = statusInfo.icon;

              return (
                <div key={trainer.uid} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {trainer.photoURL ? (
                        <img
                          src={trainer.photoURL}
                          alt={trainer.displayName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            {trainer.displayName?.[0]?.toUpperCase() || 'T'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {trainer.displayName || 'Sem nome'}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{trainer.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Cadastrado em {formatDate(trainer.createdAt)}
                          {trainer.profile?.specialties && trainer.profile.specialties.length > 0 && (
                            <span> · {trainer.profile.specialties.slice(0, 2).join(', ')}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {trainer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(trainer.uid)}
                            disabled={actionLoading === trainer.uid}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(trainer.uid)}
                            disabled={actionLoading === trainer.uid}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                      {trainer.status === 'active' && (
                        <button
                          onClick={() => handleSuspend(trainer.uid)}
                          disabled={actionLoading === trainer.uid}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                        >
                          Suspender
                        </button>
                      )}
                      {trainer.status === 'suspended' && (
                        <button
                          onClick={() => handleApprove(trainer.uid)}
                          disabled={actionLoading === trainer.uid}
                          className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"
                        >
                          Reativar
                        </button>
                      )}
                      <Link
                        href={`/admin/trainers/${trainer.uid}`}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
