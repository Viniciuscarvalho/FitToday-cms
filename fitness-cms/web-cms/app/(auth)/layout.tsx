import { Dumbbell } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <Dumbbell className="h-10 w-10 text-white" />
          <span className="text-2xl font-bold text-white">FitToday</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Transforme sua carreira de Personal Trainer
          </h1>
          <p className="text-lg text-primary-100">
            Crie programas de treino, gerencie alunos e escale seu negócio com
            a plataforma mais completa do mercado fitness.
          </p>
        </div>

        <div className="flex items-center gap-8 text-primary-100">
          <div>
            <div className="text-3xl font-bold text-white">500+</div>
            <div className="text-sm">Personal Trainers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">10k+</div>
            <div className="text-sm">Alunos Ativos</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">R$ 1M+</div>
            <div className="text-sm">Vendas/mês</div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
