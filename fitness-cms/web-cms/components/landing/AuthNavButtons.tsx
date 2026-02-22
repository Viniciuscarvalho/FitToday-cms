'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

export function AuthNavButtons() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-16 h-8 bg-white/10 rounded-full animate-pulse" />
      </div>
    );
  }

  if (user) {
    const dashboardHref = userRole === 'admin' ? '/admin' : '/cms';
    const label = userRole === 'admin' ? 'Painel Admin' : 'Meu Dashboard';

    return (
      <div className="flex items-center gap-3">
        <Link
          href={dashboardHref}
          className="px-5 py-2 bg-primary-500 hover:bg-primary-400 text-white text-sm font-semibold rounded-full transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-400/30"
        >
          {label}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="hidden sm:inline-flex text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        Entrar
      </Link>
      <Link
        href="/register"
        className="px-5 py-2 bg-primary-500 hover:bg-primary-400 text-white text-sm font-semibold rounded-full transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-400/30"
      >
        Criar Conta
      </Link>
    </div>
  );
}
