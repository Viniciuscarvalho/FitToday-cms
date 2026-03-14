'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  Crown,
  Zap,
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
  Filter,
} from 'lucide-react';

interface TrainerSubscription {
  id: string;
  name: string;
  email: string;
  plan: 'starter' | 'pro' | 'elite';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | null;
  createdAt: string | null;
}

interface Summary {
  total: number;
  starter: number;
  pro: number;
  elite: number;
  pastDue: number;
  mrrCents: number;
}

type PlanFilter = 'all' | 'starter' | 'pro' | 'elite';
type StatusFilter = 'all' | 'active' | 'past_due' | 'canceled';

export default function AdminSubscriptionsPage() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<TrainerSubscription[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const res = await globalThis.fetch('/api/admin/subscriptions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch subscriptions');

        const data = await res.json();
        setTrainers(data.trainers);
        setSummary(data.summary);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const filtered = trainers.filter((t) => {
    if (planFilter !== 'all' && t.plan !== planFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && t.subscriptionStatus !== 'active') return false;
      if (statusFilter === 'past_due' && t.subscriptionStatus !== 'past_due') return false;
      if (statusFilter === 'canceled' && t.subscriptionStatus !== 'canceled') return false;
    }
    return true;
  });

  const planBadge = (plan: string) => {
    switch (plan) {
      case 'elite':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            <Crown className="h-3 w-3" />
            Elite
          </span>
        );
      case 'pro':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
            <Zap className="h-3 w-3" />
            Pro
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            Starter
          </span>
        );
    }
  };

  const statusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Ativo
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            <AlertCircle className="h-3 w-3" />
            Inadimplente
          </span>
        );
      case 'canceled':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-400 rounded-full">
            —
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assinaturas</h1>
        <p className="text-gray-500 mt-1">Visão geral das assinaturas de trainers na plataforma</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Total trainers</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary-500" />
              <span className="text-xs text-gray-500">Pro</span>
            </div>
            <p className="text-2xl font-bold text-primary-600">{summary.pro}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-gray-500">Elite</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{summary.elite}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500">MRR</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.mrrCents)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filtrar:</span>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'starter', 'pro', 'elite'] as PlanFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                planFilter === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'all' ? 'Todos os planos' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'active', 'past_due', 'canceled'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all'
                ? 'Todos os status'
                : s === 'past_due'
                ? 'Inadimplente'
                : s === 'active'
                ? 'Ativo'
                : 'Cancelado'}
            </button>
          ))}
        </div>
      </div>

      {/* Trainers table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">Trainer</th>
                <th className="text-left p-4 font-medium text-gray-600">Plano</th>
                <th className="text-left p-4 font-medium text-gray-600">Status</th>
                <th className="text-left p-4 font-medium text-gray-600">Membro desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    Nenhum trainer encontrado com os filtros selecionados
                  </td>
                </tr>
              ) : (
                filtered.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{trainer.name}</p>
                      <p className="text-xs text-gray-400">{trainer.email}</p>
                    </td>
                    <td className="p-4">{planBadge(trainer.plan)}</td>
                    <td className="p-4">{statusBadge(trainer.subscriptionStatus)}</td>
                    <td className="p-4 text-gray-500">
                      {trainer.createdAt
                        ? new Date(trainer.createdAt).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
