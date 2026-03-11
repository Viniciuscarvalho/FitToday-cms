'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Plus,
  UserPlus,
  CheckCircle,
  Dumbbell,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/providers/AuthProvider';
import { apiRequest } from '@/lib/api-client';

export function Header() {
  const { user, trainer, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Real-time notifications listener
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: (() => void) | undefined;

    (async () => {
      const { db } = await import('@/lib/firebase');
      if (!db) return;

      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(5));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setNotifications(docs);
        setUnreadCount(docs.filter((n: any) => !n.isRead).length);
      });
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  async function handleNotificationClick(n: any) {
    try {
      await apiRequest(`/api/notifications/${n.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: true }),
      });
    } catch {
      // best-effort — don't block navigation on failure
    }
    if (n.action?.destination) {
      router.push(n.action.destination);
    }
    setShowNotifications(false);
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'connection_request':
        return <UserPlus className="h-5 w-5 text-blue-600" />;
      case 'workout_completed':
        return <Dumbbell className="h-5 w-5 text-primary-600" />;
      case 'payment':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  }

  function getNotificationIconBg(type: string) {
    switch (type) {
      case 'connection_request':
        return 'bg-blue-100';
      case 'workout_completed':
        return 'bg-primary-100';
      case 'payment':
        return 'bg-emerald-100';
      default:
        return 'bg-gray-100';
    }
  }

  function formatRelativeTime(createdAt: any): string {
    if (!createdAt) return '';
    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `Há ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Há ${diffH} hora${diffH > 1 ? 's' : ''}`;
    const diffD = Math.floor(diffH / 24);
    return `Há ${diffD} dia${diffD > 1 ? 's' : ''}`;
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm shadow-black/[0.02]">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar alunos, treinos ou mensagens..."
            disabled
            title="Busca em breve"
            className="w-full pl-12 pr-24 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 text-gray-500 outline-none text-sm cursor-not-allowed transition-all focus:bg-white focus:border-primary-200 focus:ring-4 focus:ring-primary-500/5"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Em breve</span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {/* Quick Actions Hidden on Mobile */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/cms/programs/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Novo Treino
          </Link>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-primary-600 transition-all group"
          >
            <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-primary-500 border-2 border-white rounded-full shadow-sm" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-96 bg-white rounded-3xl shadow-2xl shadow-black/10 border border-gray-100 py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-gray-900">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-full">{unreadCount} {unreadCount === 1 ? 'Nova' : 'Novas'}</span>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-400">Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`px-6 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors ${!n.isRead ? 'bg-primary-50/30' : ''}`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 ${getNotificationIconBg(n.type)} rounded-xl flex items-center justify-center shrink-0`}>
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-snug">{n.title}</p>
                          {n.body && (
                            <p className="text-sm text-gray-600 leading-snug mt-0.5 truncate">{n.body}</p>
                          )}
                          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-6 py-3 text-center">
                <Link
                  href="/cms/notifications"
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest"
                >
                  Ver todas as atividades
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all pr-3 group"
          >
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="h-9 w-9 rounded-xl object-cover ring-2 ring-primary-500/10 group-hover:ring-primary-500/30 transition-all"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {(trainer?.displayName || user?.displayName || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-none">
                {trainer?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Personal'}
              </p>
              <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mt-0.5">
                {trainer?.subscription?.plan || 'Starter'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl shadow-black/10 border border-gray-100 py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-900 leading-none">
                  {trainer?.displayName || user?.displayName || 'Usuário'}
                </p>
                <p className="text-xs font-medium text-gray-500 mt-1 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <Link
                  href="/cms/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all"
                >
                  <User className="h-4 w-4" />
                  Meu Perfil
                </Link>
                <Link
                  href="/cms/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all"
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </Link>
              </div>
              <div className="border-t border-gray-50 p-2 mt-1">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl w-full transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
