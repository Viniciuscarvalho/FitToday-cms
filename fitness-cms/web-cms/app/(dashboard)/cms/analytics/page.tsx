'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Activity,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Firestore,
  Timestamp,
} from 'firebase/firestore';

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  students: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  programs: {
    total: number;
    published: number;
    avgRating: number;
    completionRate: number;
  };
  engagement: {
    activeUsers: number;
    avgSessionDuration: number;
    workoutsCompleted: number;
    checkIns: number;
  };
  topPrograms: {
    id: string;
    name: string;
    students: number;
    revenue: number;
    rating: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
  }[];
  studentsByMonth: {
    month: string;
    count: number;
  }[];
}

const periodOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '12m', label: 'Últimos 12 meses' },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
    students: { total: 0, active: 0, newThisMonth: 0, growth: 0 },
    programs: { total: 0, published: 0, avgRating: 0, completionRate: 0 },
    engagement: { activeUsers: 0, avgSessionDuration: 0, workoutsCompleted: 0, checkIns: 0 },
    topPrograms: [],
    revenueByMonth: [],
    studentsByMonth: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, [user, period]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { db } = await import('@/lib/firebase');
      if (!db) return;

      // Load programs
      const programsRef = collection(db as Firestore, 'programs');
      const programsQuery = query(
        programsRef,
        where('trainerId', '==', user.uid)
      );
      const programsSnapshot = await getDocs(programsQuery);
      const programs = programsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Load subscriptions
      const subsRef = collection(db as Firestore, 'subscriptions');
      const subsQuery = query(
        subsRef,
        where('trainerId', '==', user.uid)
      );
      const subsSnapshot = await getDocs(subsQuery);
      const subscriptions = subsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate analytics
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Revenue calculations
      const totalRevenue = subscriptions.reduce((acc: number, sub: any) => {
        return acc + (sub.price || 0);
      }, 0);

      const thisMonthRevenue = subscriptions
        .filter((sub: any) => {
          const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
          return subDate >= thisMonthStart;
        })
        .reduce((acc: number, sub: any) => acc + (sub.price || 0), 0);

      const lastMonthRevenue = subscriptions
        .filter((sub: any) => {
          const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
          return subDate >= lastMonthStart && subDate <= lastMonthEnd;
        })
        .reduce((acc: number, sub: any) => acc + (sub.price || 0), 0);

      const revenueGrowth = lastMonthRevenue
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

      // Student calculations
      const uniqueStudents = new Set(subscriptions.map((s: any) => s.studentId));
      const activeStudents = subscriptions.filter(
        (s: any) => s.status === 'active'
      ).length;
      const newStudentsThisMonth = subscriptions.filter((sub: any) => {
        const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
        return subDate >= thisMonthStart;
      }).length;

      const lastMonthStudents = subscriptions.filter((sub: any) => {
        const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
        return subDate >= lastMonthStart && subDate <= lastMonthEnd;
      }).length;

      const studentGrowth = lastMonthStudents
        ? ((newStudentsThisMonth - lastMonthStudents) / lastMonthStudents) * 100
        : 0;

      // Program stats
      const publishedPrograms = programs.filter((p: any) => p.status === 'published');
      const avgRating =
        programs.reduce((acc: number, p: any) => acc + (p.stats?.averageRating || 0), 0) /
          (programs.length || 1);
      const avgCompletion =
        programs.reduce((acc: number, p: any) => acc + (p.stats?.completionRate || 0), 0) /
          (programs.length || 1);

      // Top programs
      const topPrograms = programs
        .map((p: any) => ({
          id: p.id,
          name: p.title || p.name || 'Programa',
          students: p.stats?.activeStudents || 0,
          revenue: p.stats?.totalSales || 0,
          rating: p.stats?.averageRating || 0,
        }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 5);

      // Revenue by month (last 6 months)
      const revenueByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthRevenue = subscriptions
          .filter((sub: any) => {
            const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
            return subDate >= monthStart && subDate <= monthEnd;
          })
          .reduce((acc: number, sub: any) => acc + (sub.price || 0), 0);

        revenueByMonth.push({
          month: monthStart.toLocaleDateString('pt-BR', { month: 'short' }),
          revenue: monthRevenue,
        });
      }

      // Students by month (last 6 months)
      const studentsByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthStudents = subscriptions.filter((sub: any) => {
          const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
          return subDate >= monthStart && subDate <= monthEnd;
        }).length;

        studentsByMonth.push({
          month: monthStart.toLocaleDateString('pt-BR', { month: 'short' }),
          count: monthStudents,
        });
      }

      setAnalytics({
        revenue: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          growth: revenueGrowth,
        },
        students: {
          total: uniqueStudents.size,
          active: activeStudents,
          newThisMonth: newStudentsThisMonth,
          growth: studentGrowth,
        },
        programs: {
          total: programs.length,
          published: publishedPrograms.length,
          avgRating,
          completionRate: avgCompletion,
        },
        engagement: {
          activeUsers: activeStudents,
          avgSessionDuration: 45, // Placeholder
          workoutsCompleted: 0, // Would need workout completion collection
          checkIns: 0, // Would need check-in collection
        },
        topPrograms,
        revenueByMonth,
        studentsByMonth,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const maxRevenue = Math.max(...analytics.revenueByMonth.map((m) => m.revenue), 1);
  const maxStudents = Math.max(...analytics.studentsByMonth.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Acompanhe o desempenho dos seus programas
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {analytics.revenue.growth >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {formatPercentage(analytics.revenue.growth)}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(analytics.revenue.thisMonth)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Receita este mês</p>
          <p className="text-xs text-gray-400 mt-2">
            Total: {formatCurrency(analytics.revenue.total)}
          </p>
        </div>

        {/* Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                analytics.students.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {analytics.students.growth >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {formatPercentage(analytics.students.growth)}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {analytics.students.newThisMonth}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Novos alunos este mês</p>
          <p className="text-xs text-gray-400 mt-2">
            {analytics.students.active} ativos de {analytics.students.total} total
          </p>
        </div>

        {/* Programs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {analytics.programs.published}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Programas publicados</p>
          <p className="text-xs text-gray-400 mt-2">
            {analytics.programs.total} total
          </p>
        </div>

        {/* Engagement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {analytics.programs.avgRating.toFixed(1)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Avaliação média</p>
          <p className="text-xs text-gray-400 mt-2">
            {analytics.programs.completionRate.toFixed(0)}% taxa de conclusão
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Receita Mensal</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-48 flex items-end gap-2">
            {analytics.revenueByMonth.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                  style={{
                    height: `${(month.revenue / maxRevenue) * 100}%`,
                    minHeight: month.revenue > 0 ? '8px' : '0px',
                  }}
                />
                <span className="text-xs text-gray-500">{month.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Students Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Novos Alunos</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-48 flex items-end gap-2">
            {analytics.studentsByMonth.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{
                    height: `${(month.count / maxStudents) * 100}%`,
                    minHeight: month.count > 0 ? '8px' : '0px',
                  }}
                />
                <span className="text-xs text-gray-500">{month.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Programs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Programas Mais Populares</h3>
          <Target className="h-5 w-5 text-gray-400" />
        </div>
        {analytics.topPrograms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum programa encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 font-medium text-gray-500 text-sm">Programa</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm text-right">
                    Alunos
                  </th>
                  <th className="pb-3 font-medium text-gray-500 text-sm text-right">
                    Receita
                  </th>
                  <th className="pb-3 font-medium text-gray-500 text-sm text-right">
                    Avaliação
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.topPrograms.map((program, index) => (
                  <tr key={program.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{program.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-600">{program.students}</td>
                    <td className="py-3 text-right text-gray-600">
                      {formatCurrency(program.revenue)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-gray-600">
                        <span className="text-yellow-500">★</span>
                        {program.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <Calendar className="h-8 w-8 mb-4 opacity-80" />
          <h4 className="text-2xl font-bold">{analytics.engagement.avgSessionDuration}min</h4>
          <p className="text-primary-100 text-sm mt-1">Duração média de treino</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <Target className="h-8 w-8 mb-4 opacity-80" />
          <h4 className="text-2xl font-bold">{analytics.engagement.workoutsCompleted}</h4>
          <p className="text-green-100 text-sm mt-1">Treinos completados</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <Activity className="h-8 w-8 mb-4 opacity-80" />
          <h4 className="text-2xl font-bold">{analytics.engagement.activeUsers}</h4>
          <p className="text-blue-100 text-sm mt-1">Usuários ativos</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <BarChart3 className="h-8 w-8 mb-4 opacity-80" />
          <h4 className="text-2xl font-bold">{analytics.engagement.checkIns}</h4>
          <p className="text-purple-100 text-sm mt-1">Check-ins no mês</p>
        </div>
      </div>
    </div>
  );
}
