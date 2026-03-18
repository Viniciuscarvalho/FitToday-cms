'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  TrendingUp,
  Dumbbell,
  Zap,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { SparklineChart } from '@/components/charts';

// ============================================================
// TYPES
// ============================================================

interface HealthSummary {
  strengthLoadTotal: number;
  resistanceLoadTotal: number;
  avgDailyCalories: number;
  sessionCount: number;
  completionRate: number;
  trendPercentage: number;
}

interface StudentRow {
  id: string;
  studentId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  objective: string;
  status: 'active' | 'canceled' | 'past_due' | 'expired';
  sessions: number;
  health?: HealthSummary;
  sparklineStrength: number[];
  sparklineResistance: number[];
  sparklineCalories: number[];
}

// ============================================================
// HELPERS
// ============================================================

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatLoad(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k kg`;
  return `${value} kg`;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'active' ? 'bg-green-500' :
    status === 'past_due' ? 'bg-yellow-500' : 'bg-red-500';
  return <span className={`w-2 h-2 rounded-full ${color} inline-block shrink-0`} />;
}

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  canceled: 'Inativo',
  past_due: 'Alerta',
  expired: 'Expirado',
};

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ label, value, sub, icon: Icon, iconColor }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex-1 min-w-[160px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`p-1.5 rounded-lg ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-green-600 font-medium mt-0.5">{sub}</p>}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function StudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [objectiveFilter, setObjectiveFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStudents = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      const { db } = await import('@/lib/firebase');
      if (!db) { setLoading(false); return; }

      const { collection, query, where, getDocs, orderBy, Firestore } = await import('firebase/firestore');

      // Fetch subscriptions for this trainer
      const subsQuery = query(
        collection(db as any, 'subscriptions'),
        where('trainerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const subsSnapshot = await getDocs(subsQuery);

      const rows: StudentRow[] = [];
      const token = await user.getIdToken();

      for (const subDoc of subsSnapshot.docs) {
        const subData = subDoc.data();
        const studentId = subData.studentId;

        // Get student info
        const userDoc = await getDocs(
          query(collection(db as any, 'users'), where('uid', '==', studentId))
        );
        const userData = userDoc.docs[0]?.data();

        // Fetch health summary from API
        let health: HealthSummary | undefined;
        let sparklineStrength: number[] = [];
        let sparklineResistance: number[] = [];
        let sparklineCalories: number[] = [];

        if (token) {
          try {
            const res = await fetch(`/api/students/${studentId}/health-summary?period=week`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              health = {
                strengthLoadTotal: data.strengthLoadTotal,
                resistanceLoadTotal: data.resistanceLoadTotal,
                avgDailyCalories: data.avgDailyCalories,
                sessionCount: data.sessionCount,
                completionRate: data.completionRate,
                trendPercentage: data.trendPercentage,
              };
              // Build sparkline from weekly breakdown
              if (data.weeklyBreakdown) {
                sparklineStrength = data.weeklyBreakdown.map((d: any) => d.strength);
                sparklineResistance = data.weeklyBreakdown.map((d: any) => d.resistance);
                sparklineCalories = data.weeklyBreakdown.map((d: any) => d.calories);
              }
            }
          } catch {
            // Health data not available yet — use empty
          }
        }

        // Determine objective from goals or program
        const objective = userData?.fitnessProfile?.goals?.[0] || subData.programTitle || 'Geral';

        rows.push({
          id: subDoc.id,
          studentId,
          displayName: userData?.displayName || 'Aluno',
          email: userData?.email || '',
          photoURL: userData?.photoURL,
          objective,
          status: subData.status || 'active',
          sessions: health?.sessionCount || 0,
          health,
          sparklineStrength,
          sparklineResistance,
          sparklineCalories,
        });
      }

      setStudents(rows);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Derived data
  const objectives = ['Todos', ...Array.from(new Set(students.map((s) => s.objective)))];
  const filtered = students.filter((s) => {
    const matchSearch = s.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchObj = objectiveFilter === 'Todos' || s.objective === objectiveFilter;
    return matchSearch && matchObj;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeCount = students.filter((s) => s.status === 'active').length;
  const avgCompletion = students.length > 0
    ? Math.round(students.reduce((a, s) => a + (s.health?.completionRate || 0), 0) / students.length)
    : 0;
  const avgStrength = students.length > 0
    ? Math.round(students.reduce((a, s) => a + (s.health?.strengthLoadTotal || 0), 0) / students.length)
    : 0;
  const avgResistance = students.length > 0
    ? Math.round(students.reduce((a, s) => a + (s.health?.resistanceLoadTotal || 0), 0) / students.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-500 mt-1">Gerencie e acompanhe métricas detalhadas de cada aluno</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Alunos ativos" value={activeCount} sub={`${students.length} total`} icon={Users} iconColor="bg-primary-100 text-primary-600" />
        <StatCard label="Média de conclusão" value={`${avgCompletion}%`} icon={TrendingUp} iconColor="bg-green-100 text-green-600" />
        <StatCard label="Carga média força" value={formatLoad(avgStrength)} icon={Dumbbell} iconColor="bg-blue-100 text-blue-600" />
        <StatCard label="Carga média resist." value={formatLoad(avgResistance)} icon={Zap} iconColor="bg-purple-100 text-purple-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
          />
        </div>
        <select
          value={objectiveFilter}
          onChange={(e) => { setObjectiveFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
        >
          {objectives.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Students Table */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Aluno', 'Objetivo', 'Sessões', 'Calorias', 'Carga Força', 'Carga Resist.', 'Tendência', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/cms/students/${s.studentId}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.photoURL ? (
                          <img src={s.photoURL} alt={s.displayName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{getInitials(s.displayName)}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{s.displayName}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Objective */}
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{s.objective}</span>
                    </td>

                    {/* Sessions */}
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.sessions}</td>

                    {/* Calories */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {s.health?.avgDailyCalories ? `${s.health.avgDailyCalories.toLocaleString('pt-BR')} kcal` : '-'}
                      </div>
                      {s.sparklineCalories.some((v) => v > 0) && (
                        <div className="mt-1">
                          <SparklineChart data={s.sparklineCalories} color="#F59E0B" />
                        </div>
                      )}
                    </td>

                    {/* Strength Load */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {s.health?.strengthLoadTotal ? formatLoad(s.health.strengthLoadTotal) : '-'}
                      </div>
                      {s.sparklineStrength.some((v) => v > 0) && (
                        <div className="mt-1">
                          <SparklineChart data={s.sparklineStrength} color="#3B82F6" />
                        </div>
                      )}
                    </td>

                    {/* Resistance Load */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {s.health?.resistanceLoadTotal ? formatLoad(s.health.resistanceLoadTotal) : '-'}
                      </div>
                      {s.sparklineResistance.some((v) => v > 0) && (
                        <div className="mt-1">
                          <SparklineChart data={s.sparklineResistance} color="#8B5CF6" />
                        </div>
                      )}
                    </td>

                    {/* Trend */}
                    <td className="px-4 py-3">
                      {s.health?.trendPercentage !== undefined ? (
                        <span className={`font-semibold ${s.health.trendPercentage >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {s.health.trendPercentage >= 0 ? '+' : ''}{s.health.trendPercentage}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={s.status} />
                        <span className="text-xs text-gray-500">{statusLabels[s.status] || s.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-7 h-7 rounded text-xs font-medium ${currentPage === i + 1 ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchQuery || objectiveFilter !== 'Todos' ? 'Nenhum aluno encontrado' : 'Nenhum aluno ainda'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchQuery || objectiveFilter !== 'Todos'
              ? 'Tente ajustar os filtros de busca'
              : 'Quando alunos se conectarem, eles aparecerão aqui com suas métricas'}
          </p>
        </div>
      )}
    </div>
  );
}
