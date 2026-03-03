'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Dumbbell,
  DollarSign,
  Star,
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
  activePrograms: number;
  totalPrograms: number;
  monthlyRevenue: number;
  revenueChange: number;
  avgRating: number;
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
    activePrograms: 0,
    totalPrograms: 0,
    monthlyRevenue: 0,
    revenueChange: 0,
    avgRating: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) {
        setLoading(false);
        return;
      }

      // Dynamically import Firebase
      const { db } = await import('@/lib/firebase');
      if (!db) {
        console.warn('Firebase not configured');
        setLoading(false);
        return;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let programs: any[] = [];
        let activePrograms = 0;
        let avgRating = 0;

        // Fetch programs
        try {
          const programsQuery = query(
            collection(db as Firestore, 'programs'),
            where('trainerId', '==', user.uid)
          );
          const programsSnapshot = await getDocs(programsQuery);
          programs = programsSnapshot.docs.map((doc) => doc.data());
          activePrograms = programs.filter(
            (p) => p.status === 'published' || p.status === 'active'
          ).length;
          avgRating =
            programs.reduce((acc, p: any) => acc + (p.stats?.averageRating || 0), 0) /
            (programs.length || 1);
        } catch (err) {
          console.warn('Error fetching programs:', err);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let subscriptions: any[] = [];
        let activeStudents = 0;

        // Fetch subscriptions (students)
        try {
          const subsQuery = query(
            collection(db as Firestore, 'subscriptions'),
            where('trainerId', '==', user.uid)
          );
          const subsSnapshot = await getDocs(subsQuery);
          subscriptions = subsSnapshot.docs.map((doc) => doc.data());
          activeStudents = subscriptions.filter((s) => s.status === 'active').length;
        } catch (err) {
          console.warn('Error fetching subscriptions:', err);
        }

        let monthlyRevenue = 0;

        // Fetch transactions for revenue
        try {
          const now = new Date();
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const transactionsQuery = query(
            collection(db as Firestore, 'transactions'),
            where('trainerId', '==', user.uid),
            where('type', '==', 'sale'),
            where('createdAt', '>=', firstDayOfMonth)
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);
          monthlyRevenue = transactionsSnapshot.docs.reduce(
            (acc, doc) => acc + (doc.data().trainerAmount || 0),
            0
          );
        } catch (err) {
          console.warn('Error fetching transactions:', err);
        }

        setStats({
          totalStudents: subscriptions.length,
          activeStudents,
          activePrograms,
          totalPrograms: programs.length,
          monthlyRevenue,
          revenueChange: 12.5,
          avgRating: avgRating || 4.8, // Default to 4.8 if none exists
        });

        // Mock recent activities for now
        setRecentActivities([
          {
            id: '1',
            type: 'sale',
            message: 'Maria Silva — pagamento confirmado R$ 250,00',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
          },
          {
            id: '2',
            type: 'completion',
            message: 'João Santos completou o Treino A — Peito e Tríceps',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          },
          {
            id: '3',
            type: 'signup',
            message: 'Ana Costa — nova avaliação registrada',
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

    if (minutes < 60) return `Há ${minutes}m`;
    if (hours < 24) return `Há ${hours}h`;
    return `Há ${days}d`;
  };

  const statCards = [
    {
      title: 'Alunos Ativos',
      value: stats.activeStudents,
      total: stats.totalStudents,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      title: 'Treinos Ativos',
      value: stats.activePrograms,
      icon: Dumbbell,
      gradient: 'from-purple-500 to-fuchsia-600',
      shadow: 'shadow-purple-500/20',
    },
    {
      title: 'Receita do Mês',
      value: formatCurrency(stats.monthlyRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      title: 'Nota Média',
      value: stats.avgRating.toFixed(1),
      icon: Star,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-gray-100 rounded-3xl" />
          <div className="h-96 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Olá, {trainer?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Personal'} 👋
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Aqui está o que está acontecendo no seu negócio hoje.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
            <Activity className="h-5 w-5" />
          </button>
          <Link
            href="/cms/programs/new"
            className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            Criar Treino
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className={`group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-[0.03] rounded-bl-[80px] group-hover:opacity-[0.06] transition-opacity`} />
            
            <div className="flex items-start justify-between relative z-10">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-6 w-6" />
              </div>
              {stat.change !== undefined && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                    stat.change >= 0 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {stat.change >= 0 ? '+' : ''}{stat.change}%
                </div>
              )}
            </div>
            
            <div className="mt-5 relative z-10">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-display font-extrabold text-gray-900 tracking-tight">
                  {stat.value}
                </p>
                {stat.total !== undefined && (
                  <p className="text-sm font-bold text-gray-400">
                    / {stat.total}
                  </p>
                )}
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1 opacity-70">
                {stat.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-gray-900">
                Atividade Recente
              </h2>
            </div>
            <Link
              href="/cms/activity"
              className="text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Ver Tudo
            </Link>
          </div>
          <div className="divide-y divide-gray-50 flex-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-5 flex items-center gap-5 hover:bg-gray-50/50 transition-all group"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      activity.type === 'sale'
                        ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                        : activity.type === 'completion'
                          ? 'bg-blue-50 text-blue-600 shadow-sm'
                          : 'bg-purple-50 text-purple-600 shadow-sm'
                    }`}
                  >
                    {activity.type === 'sale' ? (
                      <DollarSign className="h-6 w-6" />
                    ) : activity.type === 'completion' ? (
                      <Dumbbell className="h-6 w-6" />
                    ) : (
                      <Star className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {activity.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                      <span className="w-1 h-1 bg-gray-200 rounded-full" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {activity.type}
                      </p>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white rounded-xl border border-gray-100 transition-all">
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-400 font-medium">
                Nenhuma atividade registrada hoje.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gray-950 rounded-3xl p-6 text-white shadow-2xl shadow-gray-950/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[60px] group-hover:bg-primary-500/20 transition-all" />
            
            <h2 className="text-xl font-display font-bold mb-6 relative z-10">Ações Rápidas</h2>
            
            <div className="space-y-4 relative z-10">
              <Link
                href="/cms/programs/new"
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group/item"
              >
                <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center border border-primary-500/30 group-hover/item:scale-110 transition-transform">
                  <Plus className="h-5 w-5 text-primary-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">Novo Treino</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">Criar programa individual</p>
                </div>
              </Link>

              <Link
                href="/cms/messages"
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group/item"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover/item:scale-110 transition-transform">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">Mensagens</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">Chat com alunos elite</p>
                </div>
              </Link>

              <Link
                href="/cms/finances"
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group/item"
              >
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 group-hover/item:scale-110 transition-transform">
                  <Wallet className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">Financeiro</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">Gestão de faturamento</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Upgrade Card (if not elite) */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                <Star className="h-6 w-6 text-amber-300" />
              </div>
              <h3 className="text-xl font-display font-bold leading-tight mb-2">Seja um Personal Elite</h3>
              <p className="text-sm text-indigo-100 font-medium mb-6 opacity-90">
                Libere o chat em tempo real, white-label e analytics avançados para seus alunos.
              </p>
              <button className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-xl shadow-black/10 hover:bg-indigo-50 transition-all active:scale-95">
                Fazer Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
