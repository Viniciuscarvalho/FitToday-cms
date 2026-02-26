import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Dumbbell className="h-10 w-10 text-primary-600" />
          <span className="text-2xl font-bold text-gray-900">FitToday</span>
        </div>

        {/* 404 */}
        <p className="text-8xl font-black text-primary-600 mb-4">404</p>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Página não encontrada
        </h1>
        <p className="text-gray-500 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/cms"
            className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-center"
          >
            Ir para o Dashboard
          </Link>
          <Link
            href="/site"
            className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors text-center"
          >
            Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
