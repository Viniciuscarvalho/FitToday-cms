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
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export function Header() {
  const { user, trainer, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

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
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-primary-500 border-2 border-white rounded-full shadow-sm" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-96 bg-white rounded-3xl shadow-2xl shadow-black/10 border border-gray-100 py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-gray-900">Notificações</h3>
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-full">3 Novas</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                      <Plus className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 leading-snug">
                        <span className="font-bold">Maria Silva</span> confirmou o pagamento da mensalidade.
                      </p>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Há 5 minutos</p>
                    </div>
                  </div>
                </div>
                {/* ... more notifications ... */}
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
