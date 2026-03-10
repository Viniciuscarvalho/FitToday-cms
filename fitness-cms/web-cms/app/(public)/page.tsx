import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dumbbell,
  Users,
  BarChart3,
  Wallet,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
  Star,
  TrendingUp,
  Smartphone,
  CreditCard,
  Award,
  Clock,
  FileText,
  MessageSquare,
  X,
  Repeat,
  UserPlus,
  Settings,
} from 'lucide-react';
import { AuthNavButtons } from '@/components/landing/AuthNavButtons';

export const metadata: Metadata = {
  title: 'FitToday - Software de Gestão para Personal Trainers',
  description:
    'A plataforma definitiva para personal trainers profissionais. Crie programas de treino, gerencie alunos e receba pagamentos com total controle e escalabilidade.',
  keywords: [
    'personal trainer',
    'gestão de alunos fitness',
    'app para personal trainer',
    'montar treinos online',
    'consultoria fitness online',
    'stripe para personal trainers',
    'fittoday',
  ],
  openGraph: {
    title: 'FitToday - Gestão Completa para Personal Trainers',
    description: 'Profissionalize seus treinos e escale sua consultoria fitness.',
    images: ['https://fittoday.me/og-image.png'],
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitToday - A Plataforma do Personal Trainer Moderno',
    description: 'Tudo o que você precisa para gerenciar sua consultoria em um só lugar.',
    images: ['https://fittoday.me/twitter-image.png'],
  },
};

export default function SitePage() {
  return (
    <div className="min-h-screen bg-brand-background text-white antialiased overflow-x-hidden">
      {/* ====== HEADER ====== */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-brand-background/60 backdrop-blur-2xl border-b border-brand-outline">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:shadow-brand-primary/40 transition-shadow">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-xl font-bold text-white tracking-tight">
                  FitToday
                </span>
              </Link>

              <nav className="hidden lg:flex items-center gap-8">
                <a href="#funcionalidades" className="text-sm text-brand-textSecondary hover:text-white transition-colors duration-200">
                  Funcionalidades
                </a>
                <a href="#como-funciona" className="text-sm text-brand-textSecondary hover:text-white transition-colors duration-200">
                  Como Funciona
                </a>
                <a href="#precos" className="text-sm text-brand-textSecondary hover:text-white transition-colors duration-200">
                  Preços
                </a>
              </nav>

              <AuthNavButtons />
            </div>
          </div>
        </div>
      </header>

      {/* ====== HERO ====== */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 px-4">
        {/* Animated Glow Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-brand-primary/10 rounded-full blur-[140px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.05] backdrop-blur-md border border-white/[0.08] rounded-full text-sm text-brand-secondary font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-brand-secondary animate-pulse" />
            O Sistema Operacional para sua Consultoria Fitness
          </div>

          <h1 className="font-display animate-fade-in-up animation-delay-100 text-5xl sm:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-8 max-w-5xl mx-auto">
            Escale sua consultoria.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
              Domine seu mercado.
            </span>
          </h1>

          <p className="animate-fade-in-up animation-delay-200 text-lg sm:text-xl text-brand-textSecondary max-w-2xl mx-auto leading-relaxed mb-12">
            A plataforma completa para personal trainers que buscam 
            profissionalismo e eficiência. Crie treinos ilimitados, gerencie 
            alunos e automatize seus ganhos em um só lugar.
          </p>

          <div className="animate-fade-in-up animation-delay-300 flex flex-col sm:flex-row items-center justify-center gap-5 mb-24">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-10 py-5 bg-brand-primary hover:bg-blue-600 text-white font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:scale-[1.02]"
            >
              Começar Agora — Grátis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#funcionalidades"
              className="w-full sm:w-auto px-10 py-5 bg-white/[0.03] border border-white/[0.08] text-white font-semibold rounded-2xl hover:bg-white/[0.06] transition-all duration-300 text-center"
            >
              Ver Funcionalidades
            </a>
          </div>

          {/* Product Preview / Dashboard Peek */}
          <div className="animate-fade-in-up animation-delay-400 relative max-w-5xl mx-auto mt-20">
            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-[32px] pointer-events-none" />
            <div className="relative bg-brand-backgroundElevated/50 backdrop-blur-sm border border-white/[0.08] rounded-[32px] p-2 sm:p-4 overflow-hidden shadow-2xl">
              <div className="bg-brand-background rounded-[24px] overflow-hidden border border-white/[0.05] aspect-[16/10] sm:aspect-video relative group">
                 <Image
                  src="https://images.unsplash.com/photo-1593079831268-3381b0db4a77?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=90"
                  alt="Dashboard Preview"
                  fill
                  className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-background via-transparent to-transparent opacity-60" />
                
                {/* Float Elements for "Dashboard feel" */}
                <div className="absolute top-8 left-8 p-4 bg-brand-surface/90 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] text-brand-textTertiary uppercase font-bold tracking-widest">Crescimento Mensal</div>
                      <div className="text-lg font-bold text-white">+24% este mês</div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-8 right-8 p-4 bg-brand-surface/90 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-accent/20 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div>
                      <div className="text-[10px] text-brand-textTertiary uppercase font-bold tracking-widest">Atividade Alunos</div>
                      <div className="text-lg font-bold text-white">12 Treinos hoje</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CORE BENEFITS (Replaces Stats) ====== */}
      <section className="relative z-10 bg-brand-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BenefitCard 
              title="Escalabilidade Real" 
              description="Gerencie 10 ou 1000 alunos com a mesma facilidade. Nossos processos automatizados eliminam o trabalho manual."
              icon={<TrendingUp className="w-6 h-6" />}
            />
            <BenefitCard 
              title="Profissionalismo" 
              description="Sua marca elevada com uma interface premium para seus alunos acessarem treinos e acompanharem o progresso."
              icon={<Award className="w-6 h-6" />}
            />
            <BenefitCard 
              title="Controle Financeiro" 
              description="Dashboard completo para acompanhar suas receitas, planos e comissões de forma transparente e segura."
              icon={<Wallet className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* ====== PAYMENT FLOWS EXPLAINED ====== */}
      <section id="como-funciona" className="py-24 sm:py-32 bg-brand-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">
              Transparência total nos <span className="text-brand-primary">pagamentos</span>
            </h2>
            <p className="text-brand-textSecondary text-lg max-w-2xl mx-auto leading-relaxed">
              Entenda como funciona a relação financeira entre você, seus alunos e a plataforma. Sem taxas escondidas, sem complicação.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Flow 1: Subscription */}
            <div className="group relative bg-brand-backgroundElevated border border-white/5 rounded-[40px] p-10 hover:border-brand-primary/20 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors" />
              
              <div className="relative">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-brand-primary/20">
                  <Repeat className="w-7 h-7 text-brand-primary" />
                </div>

                <h3 className="font-display text-2xl font-bold text-white mb-4">Sua Assinatura FitToday</h3>
                <p className="text-brand-textSecondary leading-relaxed mb-8">
                  Você paga uma mensalidade fixa para utilizar a plataforma. O processamento é feito via <strong>Stripe</strong> com total segurança.
                </p>

                <div className="space-y-4 mb-10">
                  <FlowStep icon={<CheckCircle className="w-4 h-4 text-brand-primary" />} text="Assinatura mensal ou anual" />
                  <FlowStep icon={<CheckCircle className="w-4 h-4 text-brand-primary" />} text="Pagamento via Cartão ou Pix" />
                  <FlowStep icon={<CheckCircle className="w-4 h-4 text-brand-primary" />} text="Acesso imediato a todas as ferramentas" />
                </div>

                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="text-sm font-semibold text-brand-textTertiary uppercase tracking-widest">Processado por</div>
                  <div className="flex items-center gap-2 opacity-60">
                    <span className="text-white font-bold">stripe</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow 2: Direct */}
            <div className="group relative bg-brand-backgroundElevated border border-white/5 rounded-[40px] p-10 hover:border-brand-accent/20 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-3xl group-hover:bg-brand-accent/10 transition-colors" />
              
              <div className="relative">
                <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center mb-8 border border-brand-accent/20">
                  <UserPlus className="w-7 h-7 text-brand-accent" />
                </div>

                <h3 className="font-display text-2xl font-bold text-white mb-4">Pagamento Direto do Aluno</h3>
                <p className="text-brand-textSecondary leading-relaxed mb-8">
                  Seus alunos contratam você diretamente. Você define como quer receber (WhatsApp, Pix, etc). <strong>Taxa zero</strong> de intermediação para você.
                </p>

                <div className="space-y-4 mb-10">
                  <FlowStep icon={<CheckCircle className="w-4 h-4 text-brand-accent" />} text="O aluno te encontra no app" />
                  <FlowStep icon={<CheckCircle className="w-4 h-4 text-brand-accent" />} text="Contato direto via seu link preferido" />
                  <FlowStep icon={<CheckCircle className="w-4 h-4 text-brand-accent" />} text="Você recebe 100% do valor do treino" />
                </div>

                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="text-sm font-semibold text-brand-textTertiary uppercase tracking-widest">Relacionamento</div>
                  <div className="text-white font-bold text-sm">Direto com você</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== THE PLATFORM (TRAINER) ====== */}
      <section id="funcionalidades" className="py-24 sm:py-32 bg-brand-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                Para o Trainer
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mb-8">
                Sua Central de Comando <span className="text-brand-primary">Completa</span>
              </h2>
              <p className="text-brand-textSecondary text-lg leading-relaxed mb-10">
                Gerencie sua consultoria com ferramentas de nível empresarial. 
                Do cadastro de alunos ao recebimento de pagamentos, tudo em uma interface intuitiva.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-brand-backgroundElevated rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h4 className="text-white font-bold mb-2">Programas Dinâmicos</h4>
                  <p className="text-brand-textSecondary text-sm">Crie treinos com mídias e instruções detalhadas.</p>
                </div>
                <div className="p-6 bg-brand-backgroundElevated rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h4 className="text-white font-bold mb-2">Analytics Real</h4>
                  <p className="text-brand-textSecondary text-sm">Acompanhe faturamento e engajamento dos alunos.</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-brand-primary/20 rounded-[40px] blur-3xl opacity-20" />
              <div className="relative aspect-video bg-brand-surface rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Trainer Dashboard"
                  fill
                  className="object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== THE APP (STUDENT) ====== */}
      <section className="py-24 sm:py-32 bg-brand-backgroundElevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative flex justify-center">
               <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-[120px] opacity-20" />
               <div className="relative w-full max-w-[320px] aspect-[9/19] bg-[#000] rounded-[60px] border-[8px] border-[#1A1A1A] overflow-hidden shadow-[0_0_100px_-20px_rgba(251,113,133,0.3)]">
                 <Image
                    src="https://images.unsplash.com/photo-1510017803434-a899398421b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Student App Mobile"
                    fill
                    className="object-cover opacity-80"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                 <div className="absolute bottom-10 left-6 right-6">
                    <div className="text-white font-bold text-xl mb-1">Seu Treino de Hoje</div>
                    <div className="text-brand-accent text-sm font-medium">Peito & Tríceps • 45 min</div>
                 </div>
               </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/10 text-brand-accent rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                Para o Aluno
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mb-8">
                Uma Experiência <span className="text-brand-accent">Premium</span> no Bolso
              </h2>
              <p className="text-brand-textSecondary text-lg leading-relaxed mb-10">
                Seus alunos recebem um aplicativo moderno para acompanhar os treinos, 
                ver vídeos de execução e registrar progresso. É a sua consultoria, no celular deles.
              </p>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-brand-accent/20">
                    <Smartphone className="w-6 h-6 text-brand-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Acesso Offline</h4>
                    <p className="text-brand-textSecondary text-sm">Visualize treinos mesmo sem conexão com a internet na academia.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-brand-accent/20">
                    <MessageSquare className="w-6 h-6 text-brand-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Feedback em Tempo Real</h4>
                    <p className="text-brand-textSecondary text-sm">Seus alunos podem enviar feedbacks logo após cada sessão de treino.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="py-24 sm:py-32 bg-brand-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-backgroundElevated text-brand-primary rounded-full text-sm font-medium mb-4 border border-brand-outline">
              Como Funciona
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Comece em{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
                3 passos simples
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <StepCard
              number="01"
              title="Crie sua Conta"
              description="Cadastre-se gratuitamente, configure seu perfil com especialidades e comece a usar em minutos."
              icon={<UserPlus className="w-6 h-6" />}
            />
            <StepCard
              number="02"
              title="Monte seus Programas"
              description="Crie treinos com exercícios, séries e repetições. Publique programas para seus alunos visualizarem pelo app."
              icon={<Settings className="w-6 h-6" />}
            />
            <StepCard
              number="03"
              title="Conecte-se com Alunos"
              description="Alunos encontram seu perfil no app e entram em contato via WhatsApp ou pelo canal que você preferir."
              icon={<Wallet className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* ====== PRICING ====== */}
      <section id="precos" className="py-24 sm:py-32 bg-brand-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
              Planos que crescem com <span className="text-brand-primary">você</span>
            </h2>
            <p className="text-brand-textSecondary text-lg max-w-xl mx-auto">
              Comece sem custos e profissionalize sua consultoria conforme sua base de alunos aumenta.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {/* Starter Plan */}
            <div className="bg-brand-backgroundElevated/50 backdrop-blur-sm rounded-[32px] border border-white/5 p-8 flex flex-col h-full">
              <div className="mb-8">
                <div className="text-brand-textTertiary text-sm font-bold uppercase tracking-widest mb-4">Starter</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">Grátis</span>
                </div>
                <p className="text-brand-textSecondary text-sm mt-2">+ 10% de taxa por transação</p>
              </div>
              
              <ul className="space-y-4 mb-10 flex-grow">
                <PricingItem text="Até 5 alunos ativos" included />
                <PricingItem text="Programas ilimitados" included />
                <PricingItem text="App para alunos" included />
                <PricingItem text="Dashboard básico" included />
              </ul>

              <Link
                href="/register"
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all text-center border border-white/5"
              >
                Começar Grátis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-brand-surface rounded-[40px] p-8 border border-brand-primary/30 flex flex-col h-full shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] scale-105 z-10">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                Mais Popular
              </div>
              <div className="mb-8">
                <div className="text-brand-primary text-sm font-bold uppercase tracking-widest mb-4">Pro</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-brand-textSecondary">R$</span>
                  <span className="text-5xl font-bold text-white">97</span>
                  <span className="text-brand-textSecondary font-medium">/mês</span>
                </div>
                <p className="text-brand-textSecondary text-sm mt-2">+ 5% de taxa por transação</p>
              </div>
              
              <ul className="space-y-4 mb-10 flex-grow">
                <PricingItem text="Alunos ilimitados" included highlight />
                <PricingItem text="Analytics avançado" included highlight />
                <PricingItem text="Suporte prioritário" included highlight />
                <PricingItem text="Sem limites de programas" included />
                <PricingItem text="Chat direto no app" included />
              </ul>

              <Link
                href="/register"
                className="w-full py-4 bg-brand-primary hover:bg-blue-600 text-white font-bold rounded-2xl transition-all text-center shadow-lg shadow-brand-primary/20"
              >
                Assinar Pro
              </Link>
            </div>

            {/* Elite Plan */}
            <div className="bg-brand-backgroundElevated/50 backdrop-blur-sm rounded-[32px] border border-white/5 p-8 flex flex-col h-full">
              <div className="mb-8">
                <div className="text-brand-accent text-sm font-bold uppercase tracking-widest mb-4">Elite</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-brand-textSecondary">R$</span>
                  <span className="text-5xl font-bold text-white">197</span>
                  <span className="text-brand-textSecondary font-medium">/mês</span>
                </div>
                <p className="text-brand-textSecondary text-sm mt-2">0% de taxa adicional</p>
              </div>
              
              <ul className="space-y-4 mb-10 flex-grow">
                <PricingItem text="Tudo do plano Pro" included highlight />
                <PricingItem text="Taxa zero da plataforma" included highlight />
                <PricingItem text="White-label completo" included />
                <PricingItem text="Gerente de conta" included />
              </ul>

              <Link
                href="/register"
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all text-center border border-white/5"
              >
                Falar com Consultor
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-brand-textTertiary mt-12 max-w-lg mx-auto">
            Todos os planos incluem apps iOS e Android para seus alunos.
            Alunos não fazem pagamentos pelo app — contratam diretamente com o personal.
          </p>
        </div>
      </section>

      {/* ====== TRUST / SECURITY ====== */}
      <section className="py-20 sm:py-24 bg-brand-backgroundElevated relative overflow-hidden border-y border-brand-outline">
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-brand-primary/20">
            <Shield className="w-8 h-8 text-brand-primary" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Pagamentos seguros com Stripe
          </h2>
          <p className="text-brand-textSecondary text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Todos os pagamentos são processados pelo Stripe, líder mundial em
            pagamentos online. Seus dados e os dos seus alunos estão protegidos
            com criptografia de nível bancário.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <TrustBadge text="Criptografia SSL/TLS" />
            <TrustBadge text="PCI DSS Compliant" />
            <TrustBadge text="Proteção contra fraudes" />
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Treino intenso"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-background via-brand-background/90 to-brand-primary/40" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
            Pronto para profissionalizar seu trabalho?
          </h2>
          <p className="text-brand-textSecondary text-lg max-w-2xl mx-auto mb-10">
            Junte-se a personal trainers que já usam o FitToday para gerenciar
            treinos e receber pagamentos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 py-4 bg-brand-primary text-white font-semibold rounded-full hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-brand-primary/25"
            >
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white font-medium rounded-full hover:bg-white/10 transition-all text-center"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-brand-background text-brand-textSecondary py-16 border-t border-brand-outline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-blue-600 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-xl font-bold text-white">FitToday</span>
              </div>
              <p className="text-sm leading-relaxed text-brand-textTertiary">
                Plataforma completa para personal trainers gerenciarem
                programas de treino, alunos e pagamentos.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Plataforma</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#precos" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/politica-privacidade" className="hover:text-white transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/termos-de-uso" className="hover:text-white transition-colors">
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contato</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:contato@fittoday.me" className="hover:text-white transition-colors">contato@fittoday.me</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-brand-outline flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-brand-textTertiary">
              &copy; {new Date().getFullYear()} FitToday. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-brand-textTertiary">
              <Link href="/politica-privacidade" className="hover:text-white transition-colors">
                Privacidade
              </Link>
              <Link href="/termos-de-uso" className="hover:text-white transition-colors">
                Termos
              </Link>
              <span className="flex items-center gap-2">
                <span>Pagamentos por</span>
                <span className="font-semibold text-white">Stripe</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ====== HELPER COMPONENTS ====== */

function BenefitCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-brand-backgroundElevated/50 backdrop-blur-sm rounded-[32px] p-8 border border-white/[0.05] hover:border-brand-primary/20 transition-all group">
      <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-brand-primary/20">
        <div className="text-brand-primary">{icon}</div>
      </div>
      <h3 className="font-display text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-brand-textSecondary leading-relaxed">{description}</p>
    </div>
  );
}

function FlowStep({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">{icon}</div>
      <span className="text-brand-textSecondary text-sm font-medium">{text}</span>
    </div>
  );
}

function StatCard({
  number,
  label,
  icon,
}: {
  number: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-brand-surface rounded-2xl p-6 shadow-xl border border-brand-outline text-center hover:border-brand-primary/50 transition-all duration-300">
      <div className="inline-flex items-center justify-center w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl mb-3">
        {icon}
      </div>
      <div className="font-display text-2xl sm:text-3xl font-bold text-white">{number}</div>
      <div className="text-sm text-brand-textSecondary mt-1">{label}</div>
    </div>
  );
}

function FeatureBullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-brand-textSecondary">{text}</span>
    </li>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group">
      <div className="bg-brand-surface/50 backdrop-blur-sm border border-brand-outline rounded-2xl p-8 hover:bg-brand-surface hover:border-brand-primary/30 transition-all duration-300">
        <div className="font-display text-5xl font-extrabold text-brand-primary/20 mb-6">{number}</div>
        <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center mb-4 border border-brand-primary/20">
          {icon}
        </div>
        <h3 className="font-display text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-brand-textSecondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function PricingItem({ text, included = true, highlight }: { text: string; included?: boolean; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      {included ? (
        <CheckCircle className={`w-5 h-5 flex-shrink-0 ${highlight ? 'text-brand-primary' : 'text-brand-textTertiary'}`} />
      ) : (
        <X className="w-5 h-5 flex-shrink-0 text-brand-outlineVariant" />
      )}
      <span className={
        !included
          ? 'text-brand-textTertiary line-through'
          : highlight
          ? 'text-white font-medium'
          : 'text-brand-textSecondary'
      }>{text}</span>
    </li>
  );
}

function TrustBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] rounded-full border border-white/[0.08]">
      <CheckCircle className="w-4 h-4 text-green-400" />
      <span className="text-brand-textSecondary text-sm">{text}</span>
    </div>
  );
}
