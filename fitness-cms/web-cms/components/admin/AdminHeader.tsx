'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export function AdminHeader() {
  const { user, admin, signOut } = useAuth();
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar trainers, relatórios..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notificações</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-2 border-amber-500">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Novo trainer</span> aguardando aprovação
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Há 5 minutos</p>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">João Silva</span> foi aprovado
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Há 1 hora</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <span className="text-amber-600 font-semibold text-sm">
                {(admin?.displayName || user?.displayName || 'A')[0].toUpperCase()}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {admin?.displayName || user?.displayName || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                >
                  <User className="h-4 w-4" />
                  Meu Perfil
                </button>
              </div>
              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
