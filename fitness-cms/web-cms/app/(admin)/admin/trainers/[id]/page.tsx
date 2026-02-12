'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Users,
  FileText,
  Dumbbell,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  AlertCircle,
  Instagram,
  Youtube,
} from 'lucide-react';
import Link from 'next/link';
import { TrainerStatus } from '@/types';

interface TrainerDetails {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  status: TrainerStatus;
  createdAt: string;
  updatedAt?: string;
  statusUpdatedAt?: string;
  rejectionReason?: string;
  profile?: {
    bio: string;
    specialties: string[];
    experience: number;
    socialMedia?: {
      instagram?: string;
      youtube?: string;
    };
  };
  financial?: {
    totalEarnings: number;
    pendingBalance: number;
    availableBalance: number;
  };
  stats: {
    studentsCount: number;
    programsCount: number;
    workoutsCount: number;
  };
}

const statusConfig: Record<TrainerStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: 'Pendente', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
  active: { label: 'Ativo', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  suspended: { label: 'Suspenso', color: 'text-red-600', bgColor: 'bg-red-50', icon: Ban },
  rejected: { label: 'Rejeitado', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: XCircle },
};

export default function TrainerDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const trainerId = params.id as string;

  const [trainer, setTrainer] = useState<TrainerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTrainerDetails();
  }, [user, trainerId]);

  const fetchTrainerDetails = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/trainers/${trainerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trainer details');
      }

      const data = await response.json();
      setTrainer(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    setActionLoading(true);

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

      fetchTrainerDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    const reason = prompt('Motivo da rejeição (opcional):');
    setActionLoading(true);

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

      fetchTrainerDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!user) return;
    const reason = prompt('Motivo da suspensão (opcional):');
    setActionLoading(true);

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

      fetchTrainerDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-6 w-48 bg-gray-200 rounded" />
        </div>
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-20 w-20 bg-gray-200 rounded-full" />
            <div>
              <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600">{error || 'Trainer não encontrado'}</p>
        <Link href="/admin/trainers" className="text-amber-600 hover:text-amber-700 mt-4">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const statusInfo = statusConfig[trainer.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/trainers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes do Trainer</h1>
            <p className="text-gray-600">Visualize e gerencie o trainer</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {trainer.status === 'pending' && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                Rejeitar
              </button>
            </>
          )}
          {trainer.status === 'active' && (
            <button
              onClick={handleSuspend}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              Suspender
            </button>
          )}
          {trainer.status === 'suspended' && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"
            >
              Reativar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-4">
              {trainer.photoURL ? (
                <img
                  src={trainer.photoURL}
                  alt={trainer.displayName}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-600 font-semibold">
                    {trainer.displayName?.[0]?.toUpperCase() || 'T'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {trainer.displayName || 'Sem nome'}
                  </h2>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
                  >
                    <StatusIcon className="h-4 w-4 inline mr-1" />
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{trainer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>Cadastrado em {formatDate(trainer.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {trainer.profile?.bio && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sobre</h3>
              <p className="text-gray-600">{trainer.profile.bio}</p>
            </div>
          )}

          {/* Specialties */}
          {trainer.profile?.specialties && trainer.profile.specialties.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Especialidades</h3>
              <div className="flex flex-wrap gap-2">
                {trainer.profile.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience & Social */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {trainer.profile?.experience !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Experiência</h3>
                  <p className="text-gray-600">{trainer.profile.experience} anos</p>
                </div>
              )}
              {trainer.profile?.socialMedia?.instagram && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Instagram</h3>
                  <a
                    href={`https://instagram.com/${trainer.profile.socialMedia.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Instagram className="h-4 w-4" />
                    @{trainer.profile.socialMedia.instagram}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-600">Alunos</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {trainer.stats?.studentsCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-gray-600">Programas</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {trainer.stats?.programsCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gray-600">Treinos Enviados</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {trainer.stats?.workoutsCount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Financial */}
          {trainer.financial && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financeiro</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Receita Total</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(trainer.financial.totalEarnings || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Disponível</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(trainer.financial.availableBalance || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pendente</span>
                  <span className="font-medium text-amber-600">
                    {formatCurrency(trainer.financial.pendingBalance || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {trainer.status === 'rejected' && trainer.rejectionReason && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Motivo da Rejeição</h3>
              <p className="text-red-700">{trainer.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
