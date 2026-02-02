'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Users,
  Calendar,
  TrendingUp,
  Mail,
  MoreVertical,
  Eye,
  MessageCircle,
  UserX,
  ChevronLeft,
  ChevronRight,
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

interface StudentSubscription {
  id: string;
  studentId: string;
  programId: string;
  programTitle: string;
  status: 'active' | 'canceled' | 'past_due' | 'expired';
  startDate: Timestamp;
  currentPeriodEnd: Timestamp;
  student: {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
  };
  progress?: {
    completionPercentage: number;
    currentWeek: number;
    totalWeeks: number;
    lastActivity?: Timestamp;
  };
}

type StatusFilter = 'all' | 'active' | 'canceled' | 'past_due' | 'expired';

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [programs, setPrograms] = useState<{ id: string; title: string }[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchStudents() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { db } = await import('@/lib/firebase');
        if (!db) {
          console.warn('Firebase not configured');
          setLoading(false);
          return;
        }

        // Fetch trainer's programs
        const programsQuery = query(
          collection(db as Firestore, 'programs'),
          where('trainerId', '==', user.uid)
        );
        const programsSnapshot = await getDocs(programsQuery);
        const programsData = programsSnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || doc.data().name || 'Sem nome',
        }));
        setPrograms(programsData);

        // Fetch subscriptions for this trainer
        const subscriptionsQuery = query(
          collection(db as Firestore, 'subscriptions'),
          where('trainerId', '==', user.uid),
          orderBy('startDate', 'desc')
        );
        const subscriptionsSnapshot = await getDocs(subscriptionsQuery);

        // For each subscription, get student data
        const studentsData: StudentSubscription[] = [];
        for (const subDoc of subscriptionsSnapshot.docs) {
          const subData = subDoc.data();

          // Get student info from users collection
          const usersQuery = query(
            collection(db as Firestore, 'users'),
            where('uid', '==', subData.studentId)
          );
          const userSnapshot = await getDocs(usersQuery);
          const userData = userSnapshot.docs[0]?.data();

          // Get program title
          const program = programsData.find((p) => p.id === subData.programId);

          // Get progress if available
          const progressQuery = query(
            collection(db as Firestore, 'progress'),
            where('studentId', '==', subData.studentId),
            where('programId', '==', subData.programId)
          );
          const progressSnapshot = await getDocs(progressQuery);
          const progressData = progressSnapshot.docs[0]?.data();

          studentsData.push({
            id: subDoc.id,
            studentId: subData.studentId,
            programId: subData.programId,
            programTitle: program?.title || 'Programa removido',
            status: subData.status,
            startDate: subData.startDate,
            currentPeriodEnd: subData.currentPeriodEnd,
            student: {
              uid: subData.studentId,
              displayName: userData?.displayName || 'Aluno',
              email: userData?.email || '',
              photoURL: userData?.photoURL,
            },
            progress: progressData
              ? {
                  completionPercentage: progressData.completionPercentage || 0,
                  currentWeek: progressData.currentWeek || 1,
                  totalWeeks: progressData.totalWeeks || 1,
                  lastActivity: progressData.updatedAt,
                }
              : undefined,
          });
        }

        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching students:', error);
        // For demo, show empty state instead of error
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [user]);

  const filteredStudents = students.filter((sub) => {
    const matchesSearch =
      sub.student.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesProgram =
      programFilter === 'all' || sub.programId === programFilter;
    return matchesSearch && matchesStatus && matchesProgram;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      canceled: 'bg-red-100 text-red-700',
      past_due: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-gray-100 text-gray-600',
    };
    const labels = {
      active: 'Ativo',
      canceled: 'Cancelado',
      past_due: 'Pagamento pendente',
      expired: 'Expirado',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.expired}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 border-b border-gray-100 animate-pulse bg-gray-50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
        <p className="text-gray-500 mt-1">
          Gerencie seus alunos e acompanhe o progresso
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => s.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Alunos ativos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {students.length > 0
                  ? Math.round(
                      students.reduce(
                        (acc, s) => acc + (s.progress?.completionPercentage || 0),
                        0
                      ) / students.length
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-500">Média de conclusão</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {
                  students.filter(
                    (s) =>
                      s.startDate &&
                      new Date().getTime() -
                        (s.startDate.toDate
                          ? s.startDate.toDate()
                          : new Date(s.startDate as unknown as string)
                        ).getTime() <
                        7 * 24 * 60 * 60 * 1000
                  ).length
                }
              </p>
              <p className="text-sm text-gray-500">Novos esta semana</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => s.status === 'canceled').length}
              </p>
              <p className="text-sm text-gray-500">Cancelamentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="canceled">Cancelados</option>
            <option value="past_due">Pagamento pendente</option>
            <option value="expired">Expirados</option>
          </select>
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          >
            <option value="all">Todos os programas</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aluno
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Programa
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Início
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {sub.student.photoURL ? (
                        <img
                          src={sub.student.photoURL}
                          alt={sub.student.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {getInitials(sub.student.displayName)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {sub.student.displayName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {sub.student.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{sub.programTitle}</p>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                  <td className="px-6 py-4">
                    {sub.progress ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-24">
                          <div
                            className="h-2 bg-primary-600 rounded-full"
                            style={{
                              width: `${sub.progress.completionPercentage}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {sub.progress.completionPercentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(sub.startDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === sub.id ? null : sub.id)
                        }
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {openMenuId === sub.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <Link
                            href={`/students/${sub.studentId}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalhes
                          </Link>
                          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                            <MessageCircle className="h-4 w-4" />
                            Enviar mensagem
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                            <Mail className="h-4 w-4" />
                            Enviar email
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)}{' '}
                de {filteredStudents.length} alunos
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      currentPage === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all' || programFilter !== 'all'
              ? 'Nenhum aluno encontrado'
              : 'Nenhum aluno ainda'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all' || programFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Quando alunos se inscreverem nos seus programas, eles aparecerão aqui'}
          </p>
        </div>
      )}
    </div>
  );
}
