import { Dumbbell, Star, Users, TrendingUp } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-white font-sans antialiased">
      {/* Left side - Branding & Social Proof */}
      <div className="hidden lg:flex lg:w-[45%] bg-gray-950 p-16 flex-col justify-between relative overflow-hidden border-r border-white/10">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-transparent to-accent-600/10 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px] -ml-48 -mb-48" />

        <div className="relative z-10">
          <div className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 transition-transform group-hover:scale-110 duration-300">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white tracking-tight">
              FitToday<span className="text-primary-400">.</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-primary-400 uppercase tracking-widest">
            <Star className="w-3.5 h-3.5 fill-current" />
            Líder em Gestão Fitness
          </div>
          <h1 className="text-5xl font-display font-bold text-white leading-[1.1] tracking-tight">
            Escalabilidade para seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-300">Negócio Fitness</span>.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed font-medium">
            A plataforma completa para personal trainers profissionais que buscam excelência no acompanhamento de alunos e organização financeira.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 pt-12 border-t border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-400">
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Alunos Ativos</span>
            </div>
            <div className="text-3xl font-display font-bold text-white tracking-tight">20k+</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-accent-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Crescimento Médio</span>
            </div>
            <div className="text-3xl font-display font-bold text-white tracking-tight">45%</div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md relative z-10">
          {children}
        </div>
        
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
