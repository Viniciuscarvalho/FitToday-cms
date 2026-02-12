'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Trainers', href: '/admin/trainers', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut, admin, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-gray-900 flex flex-col transition-all duration-300`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-amber-500 flex-shrink-0" />
          {!collapsed && (
            <span className="text-xl font-bold text-white">FitToday Admin</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                active
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${
                  active ? 'text-amber-500' : 'text-gray-500'
                }`}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-500 font-semibold">
              {(admin?.displayName || user?.displayName || 'A')[0].toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {admin?.displayName || user?.displayName || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Administrador
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut()}
          className={`mt-3 flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors ${
            collapsed ? 'justify-center w-full' : ''
          }`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
