'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  BookOpen,
  ClipboardList,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Firestore } from 'firebase/firestore';

const navigation = [
  { name: 'Dashboard', href: '/cms', icon: LayoutDashboard },
  { name: 'Treinos', href: '/cms/programs', icon: Dumbbell },
  { name: 'Submissões', href: '/cms/workouts', icon: ClipboardList },
  { name: 'Exercícios', href: '/cms/exercises', icon: BookOpen },
  { name: 'Alunos', href: '/cms/students', icon: Users },
  { name: 'Solicitações', href: '/cms/connections', icon: UserPlus, badge: true },
  { name: 'Mensagens', href: '/cms/messages', icon: MessageSquare, eliteOnly: true },
  { name: 'Analytics', href: '/cms/analytics', icon: BarChart3 },
  { name: 'Financeiro', href: '/cms/finances', icon: Wallet },
  { name: 'Configurações', href: '/cms/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, trainer, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | undefined;

    import('@/lib/firebase').then(({ db }) => {
      if (!db) return;
      const q = query(
        collection(db as Firestore, 'trainerStudents'),
        where('trainerId', '==', user.uid),
        where('status', '==', 'pending')
      );
      unsubscribe = onSnapshot(q, (snap) => {
        setPendingCount(snap.size);
      });
    });

    return () => unsubscribe?.();
  }, [user]);

  const isActive = (href: string) => {
    if (href === '/cms') return pathname === '/cms';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-72'
      } bg-gray-950 flex flex-col transition-all duration-500 ease-in-out relative border-r border-white/5`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/[0.05] relative z-10">
        <Link href="/cms" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-display font-bold text-white tracking-tight">
              FitToday<span className="text-primary-400">.</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto relative z-10 scrollbar-hide">
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 px-3">
            Menu Principal
          </p>
        )}
        {navigation.map((item) => {
          const active = isActive(item.href);
          const trainerPlan = trainer?.subscription?.plan || 'starter';
          const isLocked = item.eliteOnly && trainerPlan !== 'elite';
          const hasBadge = item.badge && pendingCount > 0;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 relative group ${
                active
                  ? 'bg-primary-500/10 text-white border border-primary-500/20 shadow-lg shadow-primary-500/5'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <div className="relative flex-shrink-0">
                <item.icon
                  className={`h-5 w-5 transition-transform duration-300 ${
                    active ? 'text-primary-400 scale-110' : 'text-gray-500 group-hover:scale-110'
                  }`}
                />
                {collapsed && hasBadge && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border border-gray-950">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="flex-1 flex items-center justify-between">
                  <span className="tracking-wide">{item.name}</span>
                  {isLocked && (
                    <div className="flex items-center gap-1 bg-gray-800 px-1.5 py-0.5 rounded text-[10px] text-gray-400 border border-white/5 uppercase tracking-tighter">
                      <Lock className="h-2.5 w-2.5" />
                      Elite
                    </div>
                  )}
                  {hasBadge && (
                    <span className="flex items-center justify-center h-5 min-w-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </span>
              )}
              {active && (
                <div className="absolute left-0 w-1 h-6 bg-primary-500 rounded-full -ml-4" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-6 border-t border-white/[0.05] relative z-10 bg-gray-950/50 backdrop-blur-md">
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05]`}
        >
          <div className="relative">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Avatar'}
                className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary-500/20"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/10">
                <span className="text-white font-bold text-sm">
                  {(trainer?.displayName || user?.displayName || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-950 rounded-full shadow-lg" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {trainer?.displayName || user?.displayName || 'Usuário'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">
                  {trainer?.subscription?.plan || 'Starter'}
                </span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut()}
          className={`mt-4 w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-red-500/20 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="font-medium">Encerrar Sessão</span>}
        </button>
      </div>
    </aside>
  );
}
