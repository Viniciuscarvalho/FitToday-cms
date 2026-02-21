'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Lock,
  Sparkles,
  Star,
  UserMinus,
  UserPlus,
  Percent,
  Dumbbell,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import {
  collection,
  query,
  where,
  getDocs,
  Firestore,
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
    churned: number;
    retentionRate: number;
    churnRate: number;
  };
  programs: {
    total: number;
    active: number;
    avgRating: number;
    completionRate: number;
  };
  topPrograms: {
    id: string;
    name: string;
    students: number;
    revenue: number;
    rating: number;
  }[];
  revenueByMonth: { month: string; revenue: number }[];
  studentsByMonth: { month: string; newStudents: number; churned: number; active: number }[];
}

const periodOptions = [
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '12m', label: 'Últimos 12 meses' },
];

export default function AnalyticsPage() {
  const { user, trainer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
    students: { total: 0, active: 0, newThisMonth: 0, growth: 0, churned: 0, retentionRate: 0, churnRate: 0 },
    programs: { total: 0, active: 0, avgRating: 0, completionRate: 0 },
    topPrograms: [],
    revenueByMonth: [],
    studentsByMonth: [],
  });

  const trainerPlan = trainer?.subscription?.plan || 'starter';
  const hasAdvancedAnalytics = trainerPlan === 'pro' || trainerPlan === 'elite';

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
      const programsQuery = query(
        collection(db as Firestore, 'programs'),
        where('trainerId', '==', user.uid)
      );
      const programsSnapshot = await getDocs(programsQuery);
      const programs = programsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Load subscriptions
      const subsQuery = query(
        collection(db as Firestore, 'subscriptions'),
        where('trainerId', '==', user.uid)
      );
      const subsSnapshot = await getDocs(subsQuery);
      const subscriptions = subsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Revenue calculations
      const totalRevenue = subscriptions.reduce((acc: number, sub: any) => acc + (sub.price || 0), 0);

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
      const activeSubs = subscriptions.filter((s: any) => s.status === 'active');
      const canceledSubs = subscriptions.filter(
        (s: any) => s.status === 'canceled' || s.status === 'cancelled'
      );

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

      // Retention and Churn
      const totalEver = uniqueStudents.size || 1;
      const churnedCount = canceledSubs.length;
      const retentionRate = totalEver > 0 ? ((totalEver - churnedCount) / totalEver) * 100 : 100;
      const churnRate = totalEver > 0 ? (churnedCount / totalEver) * 100 : 0;

      // Program stats
      const activePrograms = programs.filter((p: any) => p.status === 'published' || p.status === 'draft');
      const avgRating =
        programs.reduce((acc: number, p: any) => acc + (p.stats?.averageRating || 0), 0) / (programs.length || 1);
      const avgCompletion =
        programs.reduce((acc: number, p: any) => acc + (p.stats?.completionRate || 0), 0) / (programs.length || 1);

      // Top programs
      const topPrograms = programs
        .map((p: any) => ({
          id: p.id,
          name: p.title || p.name || 'Treino',
          students: p.stats?.activeStudents || 0,
          revenue: p.stats?.totalSales || 0,
          rating: p.stats?.averageRating || 0,
        }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 5);

      // Monthly data (last 6 months)
      const revenueByMonth = [];
      const studentsByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthLabel = monthStart.toLocaleDateString('pt-BR', { month: 'short' });

        const monthRevenue = subscriptions
          .filter((sub: any) => {
            const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
            return subDate >= monthStart && subDate <= monthEnd;
          })
          .reduce((acc: number, sub: any) => acc + (sub.price || 0), 0);

        const monthNew = subscriptions.filter((sub: any) => {
          const subDate = sub.createdAt?.toDate?.() || new Date(sub.createdAt);
          return subDate >= monthStart && subDate <= monthEnd;
        }).length;

        const monthChurned = canceledSubs.filter((sub: any) => {
          const cancelDate = sub.canceledAt?.toDate?.() || sub.updatedAt?.toDate?.() || new Date();
          return cancelDate >= monthStart && cancelDate <= monthEnd;
        }).length;

        revenueByMonth.push({ month: monthLabel, revenue: monthRevenue });
        studentsByMonth.push({
          month: monthLabel,
          newStudents: monthNew,
          churned: monthChurned,
          active: activeSubs.length, // Approximation
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
          active: activeSubs.length,
          newThisMonth: newStudentsThisMonth,
          growth: studentGrowth,
          churned: churnedCount,
          retentionRate,
          churnRate,
        },
        programs: {
          total: programs.length,
          active: activePrograms.length,
          avgRating,
          completionRate: avgCompletion,
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatPercentage = (value: number) =>
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Acompanhe o desempenho do seu negócio</p>
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

      {/* Key Metrics - Always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          value={formatCurrency(analytics.revenue.thisMonth)}
          label="Receita este mês"
          subtext={`Total: ${formatCurrency(analytics.revenue.total)}`}
          growth={analytics.revenue.growth}
        />
        <MetricCard
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          value={String(analytics.students.active)}
          label="Alunos ativos"
          subtext={`${analytics.students.newThisMonth} novos este mês`}
          growth={analytics.students.growth}
        />
        <MetricCard
          icon={Dumbbell}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          value={String(analytics.programs.active)}
          label="Treinos ativos"
          subtext={`${analytics.programs.total} total`}
        />
        <MetricCard
          icon={Star}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          value={analytics.programs.avgRating.toFixed(1)}
          label="Nota média"
          subtext={`${analytics.programs.completionRate.toFixed(0)}% taxa de conclusão`}
        />
      </div>

      {/* Revenue Chart - Always visible */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Receita Mensal</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="revenue" name="Receita" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advanced Analytics - Pro/Elite only */}
      {hasAdvancedAnalytics ? (
        <>
          {/* Retention & Churn Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Percent}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              value={`${analytics.students.retentionRate.toFixed(1)}%`}
              label="Taxa de retenção"
              subtext="Alunos que permanecem"
            />
            <MetricCard
              icon={UserMinus}
              iconBg="bg-red-100"
              iconColor="text-red-600"
              value={`${analytics.students.churnRate.toFixed(1)}%`}
              label="Taxa de churn"
              subtext={`${analytics.students.churned} cancelamentos`}
            />
            <MetricCard
              icon={UserPlus}
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
              value={String(analytics.students.newThisMonth)}
              label="Novos alunos"
              subtext="Este mês"
              growth={analytics.students.growth}
            />
            <MetricCard
              icon={Activity}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              value={`${analytics.programs.completionRate.toFixed(0)}%`}
              label="Taxa de conclusão"
              subtext="Média dos treinos"
            />
          </div>

          {/* Students Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Evolução de Alunos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.studentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="newStudents"
                    name="Novos"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="churned"
                    name="Cancelados"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        /* Upsell for Starter plan */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics Avançado</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Acompanhe taxa de retenção, churn, evolução de alunos e métricas detalhadas de
            desempenho. Disponível nos planos Pro e Elite.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {['Taxa de Retenção', 'Taxa de Churn', 'Evolução de Alunos', 'Gráficos Detalhados'].map(
              (feature) => (
                <span
                  key={feature}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {feature}
                </span>
              )
            )}
          </div>
          <Link
            href="/cms/settings"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            Fazer Upgrade
          </Link>
        </div>
      )}

      {/* Top Programs - Always visible */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Treinos Mais Populares</h3>
        {analytics.topPrograms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum treino encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 font-medium text-gray-500 text-sm">Treino</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm text-right">Alunos</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm text-right">Receita</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm text-right">Avaliação</th>
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
    </div>
  );
}

// ============================================================
// METRIC CARD COMPONENT
// ============================================================

function MetricCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  subtext,
  growth,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  subtext?: string;
  growth?: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {growth != null && (
          <span
            className={`flex items-center gap-0.5 text-sm font-medium ${
              growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {growth >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}
