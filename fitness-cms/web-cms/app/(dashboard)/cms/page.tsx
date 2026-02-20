'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  collection,
  query,
  where,
  getDocs,
  Firestore,
} from 'firebase/firestore';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalPrograms: number;
  publishedPrograms: number;
  monthlyRevenue: number;
  revenueChange: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'completion' | 'signup';
  message: string;
  timestamp: Date;
}

export default function DashboardPage() {
  const { user, trainer } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalPrograms: 0,
    publishedPrograms: 0,
    monthlyRevenue: 0,
    revenueChange: 0,
    completionRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Dynamically import Firebase
        const { db } = await import('@/lib/firebase');
        if (!db) {
          console.warn('Firebase not configured');
          setLoading(false);
          return;
        }

        // Fetch programs
        const programsQuery = query(
          collection(db as Firestore, 'programs'),
          where('trainerId', '==', user.uid)
        );
        const programsSnapshot = await getDocs(programsQuery);
        const programs = programsSnapshot.docs.map((doc) => doc.data());
        const publishedPrograms = programs.filter(
          (p) => p.status === 'published'
        ).length;

        // Fetch subscriptions (students)
        const subsQuery = query(
          collection(db as Firestore, 'subscriptions'),
          where('trainerId', '==', user.uid)
        );
        const subsSnapshot = await getDocs(subsQuery);
        const subscriptions = subsSnapshot.docs.map((doc) => doc.data());
        const activeStudents = subscriptions.filter(
          (s) => s.status === 'active'
        ).length;

        // Fetch transactions for revenue
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const transactionsQuery = query(
          collection(db as Firestore, 'transactions'),
          where('trainerId', '==', user.uid),
          where('type', '==', 'sale'),
          where('createdAt', '>=', firstDayOfMonth)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const monthlyRevenue = transactionsSnapshot.docs.reduce(
          (acc, doc) => acc + (doc.data().trainerAmount || 0),
          0
        );

        setStats({
          totalStudents: subscriptions.length,
          activeStudents,
          totalPrograms: programs.length,
          publishedPrograms,
          monthlyRevenue,
          revenueChange: 12.5, // Placeholder - would need previous month data
          completionRate: 78, // Placeholder - would need workout completion data
        });

        // Mock recent activities for now
        setRecentActivities([
          {
            id: '1',
            type: 'sale',
            message: 'Maria Silva comprou "Treino de Hipertrofia 12 Semanas"',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
          },
          {
            id: '2',
            type: 'completion',
            message: 'João Santos completou o treino do dia',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          },
          {
            id: '3',
            type: 'signup',
            message: 'Ana Costa iniciou o programa "Definição 8 Semanas"',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
          },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `Há ${minutes} minutos`;
    if (hours < 24) return `Há ${hours} horas`;
    return `Há ${days} dias`;
  };

  const statCards = [
    {
      title: 'Alunos Ativos',
      value: stats.activeStudents,
      total: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Programas Publicados',
      value: stats.publishedPrograms,
      total: stats.totalPrograms,
      icon: FileText,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Receita do Mês',
      value: formatCurrency(stats.monthlyRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Taxa de Conclusão',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
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
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {trainer?.displayName || user?.displayName || 'Personal'}!
          </h1>
          <p className="text-gray-500 mt-1">
            Aqui está o resumo da sua plataforma
          </p>
        </div>
        <Link
          href="/cms/programs/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Criar Programa
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${stat.lightColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
              {stat.change !== undefined && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stat.title}
                {stat.total !== undefined && (
                  <span className="text-gray-400"> / {stat.total} total</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Atividade Recente
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === 'sale'
                        ? 'bg-green-50'
                        : activity.type === 'completion'
                          ? 'bg-blue-50'
                          : 'bg-purple-50'
                    }`}
                  >
                    {activity.type === 'sale' ? (
                      <DollarSign
                        className={`h-5 w-5 ${
                          activity.type === 'sale'
                            ? 'text-green-600'
                            : 'text-gray-600'
                        }`}
                      />
                    ) : activity.type === 'completion' ? (
                      <Activity className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Users className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                Nenhuma atividade recente
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/cms/activity"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver todas as atividades
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Ações Rápidas
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <Link
              href="/cms/programs/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="p-2 rounded-lg bg-primary-100 group-hover:bg-primary-200">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Criar Programa</p>
                <p className="text-xs text-gray-500">
                  Monte um novo programa de treino
                </p>
              </div>
            </Link>
            <Link
              href="/cms/messages"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Falar com Alunos</p>
                <p className="text-xs text-gray-500">
                  Acesse suas conversas
                </p>
              </div>
            </Link>
            <Link
              href="/cms/finances"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Ver Financeiro</p>
                <p className="text-xs text-gray-500">
                  Acompanhe suas vendas
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
