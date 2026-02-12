'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface PlatformMetrics {
  trainers: {
    total: number;
    pending: number;
    active: number;
    suspended: number;
    rejected: number;
  };
  students: {
    total: number;
  };
  programs: {
    total: number;
    published: number;
    draft: number;
  };
  workouts: {
    total: number;
  };
  financial: {
    totalRevenue: number;
    pendingPayouts: number;
  };
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
  }[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/metrics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${diffDays}d`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-1">
          Visão geral da plataforma FitToday
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pending Trainers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aguardando Aprovação</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {metrics?.trainers.pending || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <Link
            href="/admin/trainers?status=pending"
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 mt-4"
          >
            Ver pendentes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Active Trainers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trainers Ativos</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {metrics?.trainers.active || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Total: {metrics?.trainers.total || 0} trainers
          </p>
        </div>

        {/* Total Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alunos na Plataforma</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {metrics?.students.total || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {metrics?.workouts.total || 0} treinos enviados
          </p>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics?.financial.totalRevenue || 0)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 mt-4">
            <TrendingUp className="h-4 w-4" />
            <span>Pendente: {formatCurrency(metrics?.financial.pendingPayouts || 0)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Trainers Aguardando Aprovação
              </h2>
              <Link
                href="/admin/trainers?status=pending"
                className="text-sm text-amber-600 hover:text-amber-700"
              >
                Ver todos
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {metrics?.recentActivity
              .filter((a) => a.type === 'pending_approval')
              .slice(0, 5)
              .map((activity, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    {activity.userId && (
                      <Link
                        href={`/admin/trainers/${activity.userId}`}
                        className="px-3 py-1.5 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100"
                      >
                        Revisar
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            {metrics?.trainers.pending === 0 && (
              <div className="p-8 text-center">
                <UserCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">Nenhum trainer aguardando aprovação</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Estatísticas</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Trainers Breakdown */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Status dos Trainers</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600">Ativos</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics?.trainers.active || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-sm text-gray-600">Pendentes</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics?.trainers.pending || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-600">Suspensos</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics?.trainers.suspended || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    <span className="text-sm text-gray-600">Rejeitados</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics?.trainers.rejected || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Programs */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Programas</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics?.programs.total || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Publicados</span>
                  <span className="text-sm font-medium text-green-600">
                    {metrics?.programs.published || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rascunhos</span>
                  <span className="text-sm font-medium text-gray-500">
                    {metrics?.programs.draft || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
