'use client';

import { useEffect, useState, useRef } from 'react';
import { UserPlus, Check, X, Clock, Users, MessageCircle, RefreshCw, Ban } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { useAuth } from '@/providers/AuthProvider';
import { apiRequest } from '@/lib/api-client';

interface Student {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

interface ConnectionRequest {
  id: string;
  studentId: string;
  status: 'pending' | 'active' | 'rejected' | 'canceled';
  source: string;
  message: string | null;
  createdAt: { _seconds: number } | null;
  student: Student | null;
}

type TabStatus = 'pending' | 'active' | 'rejected' | 'canceled';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabStatus>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  async function fetchFromApi(status: TabStatus) {
    try {
      const data = await apiRequest<{ connections: ConnectionRequest[] }>(
        `/api/connections?status=${status}`
      );
      setConnections(data.connections ?? []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }

  // Real-time listener: re-fetches from REST API whenever the Firestore
  // trainerStudents collection changes for the current trainer + tab status.
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setConnections([]);

    // Unsubscribe from previous listener before setting up a new one
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    let active = true;

    const setupListener = async () => {
      const { db } = await import('@/lib/firebase');
      if (!db || !active) return;

      const q = query(
        collection(db, 'trainerStudents'),
        where('trainerId', '==', user.uid),
        where('status', '==', tab),
        orderBy('createdAt', 'desc')
      );

      unsubscribeRef.current = onSnapshot(q, () => {
        // Refetch enriched data (with student profiles) from the REST API
        fetchFromApi(tab);
      });
    };

    setupListener();

    return () => {
      active = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, tab]);

  async function handleAction(connectionId: string, action: 'accept' | 'reject') {
    setActionLoading(connectionId);
    try {
      await apiRequest(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      // Remove from current list after action
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (err) {
      console.error(`Error ${action}ing connection:`, err);
    } finally {
      setActionLoading(null);
    }
  }

  function formatRelativeTime(ts: { _seconds: number } | null): string {
    if (!ts) return '-';
    const date = new Date(ts._seconds * 1000);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const tabs: { label: string; value: TabStatus; icon: React.ReactNode }[] = [
    { label: 'Pendentes', value: 'pending', icon: <Clock className="h-4 w-4" /> },
    { label: 'Aceitas', value: 'active', icon: <Check className="h-4 w-4" /> },
    { label: 'Recusadas', value: 'rejected', icon: <X className="h-4 w-4" /> },
    { label: 'Canceladas', value: 'canceled', icon: <Ban className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitações de Conexão</h1>
          <p className="text-gray-500 mt-1">
            Alunos que querem se conectar com você pelo app
          </p>
        </div>
        <button
          onClick={() => fetchFromApi(tab)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {tab === 'pending' ? (
              <UserPlus className="h-8 w-8 text-gray-400" />
            ) : tab === 'active' ? (
              <Users className="h-8 w-8 text-gray-400" />
            ) : tab === 'canceled' ? (
              <Ban className="h-8 w-8 text-gray-400" />
            ) : (
              <X className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {tab === 'pending'
              ? 'Nenhuma solicitação pendente'
              : tab === 'active'
              ? 'Nenhuma conexão aceita ainda'
              : tab === 'canceled'
              ? 'Nenhuma conexão cancelada'
              : 'Nenhuma solicitação recusada'}
          </h3>
          <p className="text-sm text-gray-500">
            {tab === 'pending'
              ? 'Quando um aluno solicitar conexão pelo app, aparecerá aqui.'
              : tab === 'active'
              ? 'As conexões aceitas aparecem aqui e na lista de Alunos.'
              : tab === 'canceled'
              ? 'Conexões que foram canceladas aparecerão aqui.'
              : 'Solicitações que você recusou aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {conn.student?.photoURL ? (
                  <img
                    src={conn.student.photoURL}
                    alt={conn.student.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700">
                      {getInitials(conn.student?.displayName || 'A')}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">
                    {conn.student?.displayName || 'Aluno'}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatRelativeTime(conn.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{conn.student?.email}</p>
                {conn.message && (
                  <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-2 italic">
                    "{conn.message}"
                  </p>
                )}
              </div>

              {/* Actions */}
              {tab === 'pending' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAction(conn.id, 'reject')}
                    disabled={actionLoading === conn.id}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    <X className="h-4 w-4" />
                    Recusar
                  </button>
                  <button
                    onClick={() => handleAction(conn.id, 'accept')}
                    disabled={actionLoading === conn.id}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm shadow-primary-600/20"
                  >
                    {actionLoading === conn.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Aceitar
                  </button>
                </div>
              )}

              {tab === 'active' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    <Check className="h-3.5 w-3.5" />
                    Conectado
                  </span>
                  <a
                    href={`/cms/students/${conn.studentId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 transition-all"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Ver aluno
                  </a>
                  <a
                    href="/cms/messages"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Mensagem
                  </a>
                </div>
              )}

              {tab === 'rejected' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-full flex-shrink-0">
                  <X className="h-3.5 w-3.5" />
                  Recusado
                </span>
              )}

              {tab === 'canceled' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-full flex-shrink-0">
                  <Ban className="h-3.5 w-3.5" />
                  Cancelado
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
