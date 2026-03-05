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
  title: 'FitToday - A Plataforma Definitiva para Personal Trainers',
  description:
    'Gerencie seus programas de treino, alunos e pagamentos em um único lugar. A plataforma completa para personal trainers profissionais que buscam escala e organização.',
  keywords: ['personal trainer', 'consultoria fitness', 'gestão de alunos', 'treino online', 'fitness cms', 'stripe for trainers'],
  openGraph: {
    title: 'FitToday - Plataforma para Personal Trainers',
    description: 'Gerencie seus treinos e alunos de forma profissional.',
    images: ['https://fittoday.me/og-image.png'],
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitToday - Plataforma para Personal Trainers',
    description: 'Tudo que você precisa para profissionalizar seu trabalho como personal.',
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
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <Image
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Interior de academia moderna"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-background/80 via-brand-background/60 to-brand-background" />

        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] rounded-full text-sm text-brand-secondary font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Plataforma completa para personal trainers
          </div>

          <h1 className="font-display animate-fade-in-up animation-delay-100 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[0.95] tracking-tight mb-6">
            Seus treinos.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
              Seu negócio.
            </span>
          </h1>

          <p className="animate-fade-in-up animation-delay-200 text-lg sm:text-xl text-brand-textSecondary max-w-2xl mx-auto leading-relaxed mb-10">
            Crie programas de treino, acompanhe seus alunos e receba
            pagamentos de forma segura. Tudo que você precisa para
            profissionalizar seu trabalho.
          </p>

          <div className="animate-fade-in-up animation-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 py-4 bg-brand-primary hover:bg-blue-600 text-white font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl shadow-brand-primary/30 hover:shadow-blue-600/40 hover:scale-[1.02]"
            >
              Comece Gratuitamente
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#como-funciona"
              className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white font-medium rounded-full hover:bg-white/[0.06] transition-all duration-300 text-center"
            >
              Saiba Mais
            </a>
          </div>

          <div className="animate-fade-in-up animation-delay-400 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-brand-textTertiary">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-primary" />
              Plano grátis disponível
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-primary" />
              Pagamentos via Stripe
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-primary" />
              Apps iOS e Android
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-background to-transparent" />
      </section>

      {/* ====== STATS ====== */}
      <section className="relative z-10 bg-brand-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard number="500+" label="Trainers Ativos" icon={<Users className="w-5 h-5" />} />
            <StatCard number="2.000+" label="Alunos Cadastrados" icon={<TrendingUp className="w-5 h-5" />} />
            <StatCard number="10K+" label="Treinos Enviados" icon={<Dumbbell className="w-5 h-5" />} />
            <StatCard number="R$ 1M+" label="Processados" icon={<Wallet className="w-5 h-5" />} />
          </div>
        </div>
      </section>

      {/* ====== TWO-FLOW EXPLAINER ====== */}
      <section className="py-24 sm:py-32 bg-brand-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-medium mb-4">
              <Repeat className="w-3.5 h-3.5" />
              Dois Fluxos, Uma Plataforma
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
              Entenda como o{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                FitToday funciona
              </span>
            </h2>
            <p className="text-brand-textSecondary text-lg max-w-2xl mx-auto">
              O FitToday opera com dois modelos de receita complementares,
              dando transparência total para trainers e alunos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {/* Flow 1: SaaS */}
            <div className="relative bg-brand-backgroundElevated border border-brand-outline rounded-3xl p-8 lg:p-10 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-[80px]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                  <CreditCard className="w-3.5 h-3.5" />
                  Fluxo 1 — Assinatura SaaS
                </div>

                <h3 className="font-display text-2xl font-bold mb-3">
                  Você assina, você usa
                </h3>
                <p className="text-brand-textSecondary leading-relaxed mb-8">
                  O personal trainer paga uma assinatura mensal para acessar
                  todas as ferramentas da plataforma. Esse valor vai direto
                  para a FitToday.
                </p>

                <div className="bg-brand-surface border border-brand-outlineVariant rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center border border-brand-primary/20">
                      <Users className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-brand-textSecondary">Personal Trainer</div>
                      <div className="font-semibold text-white">Paga R$ 97/mês</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center my-3">
                    <ArrowRight className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center border border-brand-accent/20">
                      <Dumbbell className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div>
                      <div className="text-sm text-brand-textSecondary">FitToday</div>
                      <div className="font-semibold text-white">Recebe R$ 94,56 líquido</div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2.5 text-sm text-brand-textSecondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    Relação direta: trainer → FitToday
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    Stripe Subscriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    Taxa Stripe: ~2,2% por transação
                  </li>
                </ul>
              </div>
            </div>

            {/* Flow 2: Marketplace */}
            <div className="relative bg-brand-surface border border-brand-outlineVariant rounded-3xl p-8 lg:p-10 text-white overflow-hidden">
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-accent/10 rounded-full blur-[80px]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                  <Wallet className="w-3.5 h-3.5" />
                  Fluxo 2 — Contratação
                </div>

                <h3 className="font-display text-2xl font-bold mb-3">
                  Aluno contrata, trainer recebe
                </h3>
                <p className="text-brand-textSecondary leading-relaxed mb-8">
                  Quando um aluno quer contratar um personal, ele é redirecionado
                  pelo app para entrar em contato via WhatsApp ou outro canal do
                  trainer. O pagamento é feito fora do app, de forma direta.
                </p>

                <div className="bg-brand-backgroundElevated border border-brand-outline rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center border border-brand-accent/20">
                      <Smartphone className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div>
                      <div className="text-sm text-brand-textSecondary">Aluno no App</div>
                      <div className="font-semibold text-white">Vê perfil do personal</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center my-3">
                    <ArrowRight className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center border border-brand-primary/20">
                      <MessageSquare className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-brand-textSecondary">Contato direto</div>
                      <div className="font-semibold text-white">Via WhatsApp ou canal do trainer</div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2.5 text-sm text-brand-textSecondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    Aluno não faz pagamento pelo app
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    Contato direto via WhatsApp ou link
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    Trainer define seu próprio canal de contato
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="funcionalidades" className="py-24 sm:py-32 bg-brand-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-medium mb-4">
              <Star className="w-3.5 h-3.5" />
              Funcionalidades
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Tudo que você precisa,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                nada que não precisa
              </span>
            </h2>
          </div>

          {/* Feature 1: Programs */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10">
              <Image
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Personal trainer orientando aluna"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <FileText className="w-3.5 h-3.5" />
                Programas de Treino
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                Monte treinos profissionais em minutos
              </h3>
              <p className="text-brand-textSecondary text-lg leading-relaxed mb-8">
                Crie programas completos com exercícios, séries, repetições e envie
                PDFs personalizados. Seus alunos acessam tudo pelo app.
              </p>
              <ul className="space-y-4">
                <FeatureBullet icon={<Dumbbell className="w-4 h-4" />} text="Programas com exercícios personalizados" />
                <FeatureBullet icon={<FileText className="w-4 h-4" />} text="Envio de treinos em PDF" />
                <FeatureBullet icon={<Smartphone className="w-4 h-4" />} text="Alunos recebem direto no app" />
                <FeatureBullet icon={<Clock className="w-4 h-4" />} text="Defina duração e periodização" />
              </ul>
            </div>
          </div>

          {/* Feature 2: Students (reversed) */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <Users className="w-3.5 h-3.5" />
                Gestão de Alunos
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                Acompanhe cada aluno de perto
              </h3>
              <p className="text-brand-textSecondary text-lg leading-relaxed mb-8">
                Visualize o progresso, histórico de treinos e mantenha
                comunicação direta com cada aluno pela plataforma.
              </p>
              <ul className="space-y-4">
                <FeatureBullet icon={<BarChart3 className="w-4 h-4" />} text="Dashboard de progresso individual" />
                <FeatureBullet icon={<MessageSquare className="w-4 h-4" />} text="Mensagens diretas com alunos" />
                <FeatureBullet icon={<TrendingUp className="w-4 h-4" />} text="Histórico completo de treinos" />
                <FeatureBullet icon={<Award className="w-4 h-4" />} text="Feedback e avaliação de treinos" />
              </ul>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10 order-1 lg:order-2">
              <Image
                src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Atleta treinando com determinação"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Feature 3: Payments */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10">
              <Image
                src="https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Pessoa treinando com intensidade"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <Wallet className="w-3.5 h-3.5" />
                Financeiro
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                Receba pagamentos sem complicação
              </h3>
              <p className="text-brand-textSecondary text-lg leading-relaxed mb-8">
                Pagamentos seguros via Stripe com suporte a Pix, boleto e cartão.
                Acompanhe receitas e repasses em tempo real.
              </p>
              <ul className="space-y-4">
                <FeatureBullet icon={<CreditCard className="w-4 h-4" />} text="Pix, boleto e cartão de crédito" />
                <FeatureBullet icon={<Shield className="w-4 h-4" />} text="Processado pelo Stripe com segurança" />
                <FeatureBullet icon={<TrendingUp className="w-4 h-4" />} text="Dashboard financeiro em tempo real" />
                <FeatureBullet icon={<Wallet className="w-4 h-4" />} text="Repasse automático na sua conta" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section id="como-funciona" className="py-24 sm:py-32 bg-brand-background relative overflow-hidden">
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

      {/* ====== PRICING (Arrows-style) ====== */}
      <section id="precos" className="py-24 sm:py-32 bg-brand-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-medium mb-4">
              <Star className="w-3.5 h-3.5" />
              Preços
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-brand-textSecondary text-lg max-w-xl mx-auto">
              Comece grátis e faça upgrade conforme seu negócio cresce.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
            {/* Starter Plan */}
            <div className="bg-brand-backgroundElevated rounded-3xl border border-brand-outline overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="px-8 pt-8 pb-6">
                <div className="text-sm font-semibold text-brand-textTertiary uppercase tracking-wider mb-3">Starter</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-4xl lg:text-5xl font-extrabold text-white">Grátis</span>
                </div>
                <p className="text-brand-textSecondary text-sm mb-2">+ 10% de comissão</p>
                <p className="text-brand-textTertiary text-xs mb-8">Para começar sem compromisso</p>
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 border border-brand-outlineVariant text-white font-semibold rounded-xl hover:bg-brand-surface transition-colors"
                >
                  Comece Grátis
                </Link>
              </div>
              <div className="px-8 pb-8">
                <div className="text-xs font-semibold text-brand-textTertiary uppercase tracking-wider mb-4 pt-6 border-t border-brand-outline">O que inclui</div>
                <ul className="space-y-3">
                  <PricingItem text="Até 5 alunos ativos" included />
                  <PricingItem text="Até 3 programas de treino" included />
                  <PricingItem text="Envio de treinos em PDF" included />
                  <PricingItem text="Dashboard básico" included />
                  <PricingItem text="Apps iOS e Android" included />
                  <PricingItem text="Analytics avançado" included={false} />
                  <PricingItem text="Alunos ilimitados" included={false} />
                  <PricingItem text="White-label" included={false} />
                </ul>
                <div className="mt-6 pt-4 border-t border-brand-outline">
                  <p className="text-xs text-brand-textSecondary">
                    <span className="font-semibold text-brand-accent">10% de comissão</span> sobre vendas de programas
                  </p>
                </div>
              </div>
            </div>

            {/* Pro Plan (highlighted) */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-b from-brand-primary via-brand-secondary to-brand-accent rounded-3xl" />
              <div className="relative bg-brand-surface rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-r from-brand-primary to-blue-600 px-8 py-2.5 text-center">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Recomendado</span>
                </div>
                <div className="px-8 pt-8 pb-6">
                  <div className="text-sm font-semibold text-brand-primary uppercase tracking-wider mb-3">Pro</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display text-4xl lg:text-5xl font-extrabold text-white">R$ 97</span>
                    <span className="text-brand-textSecondary text-sm font-medium">/mês</span>
                  </div>
                  <p className="text-brand-textSecondary text-sm mb-2">+ 5% de comissão</p>
                  <p className="text-brand-textTertiary text-xs mb-8">Para trainers que querem crescer</p>
                  <Link
                    href="/register"
                    className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-brand-primary/25 hover:shadow-blue-600/30"
                  >
                    Assinar Pro
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                <div className="px-8 pb-8">
                  <div className="text-xs font-semibold text-brand-textTertiary uppercase tracking-wider mb-4 pt-6 border-t border-brand-outline">Tudo do Starter, mais</div>
                  <ul className="space-y-3">
                    <PricingItem text="Alunos ilimitados" included highlight />
                    <PricingItem text="Programas ilimitados" included highlight />
                    <PricingItem text="Analytics avançado" included highlight />
                    <PricingItem text="Comissão reduzida (5%)" included highlight />
                    <PricingItem text="Chat direto com alunos" included highlight />
                    <PricingItem text="Acompanhamento de progresso" included />
                    <PricingItem text="White-label" included={false} />
                    <PricingItem text="Suporte prioritário" included={false} />
                  </ul>
                  <div className="mt-6 pt-4 border-t border-brand-outline">
                    <p className="text-xs text-brand-textSecondary">
                      <span className="font-semibold text-brand-primary">5% de comissão</span> sobre vendas de programas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Elite Plan */}
            <div className="bg-brand-backgroundElevated rounded-3xl border border-brand-outline overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="bg-brand-background px-8 py-2.5 text-center">
                <span className="text-xs font-bold text-brand-accent uppercase tracking-widest">Sem comissão</span>
              </div>
              <div className="px-8 pt-8 pb-6">
                <div className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Elite</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-4xl lg:text-5xl font-extrabold text-white">R$ 197</span>
                  <span className="text-brand-textSecondary text-sm font-medium">/mês</span>
                </div>
                <p className="text-brand-textSecondary text-sm mb-2">0% de comissão</p>
                <p className="text-brand-textTertiary text-xs mb-8">Para trainers que querem o máximo</p>
                <Link
                  href="/register"
                  className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-brand-background font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-white/10"
                >
                  Assinar Elite
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              <div className="px-8 pb-8">
                <div className="text-xs font-semibold text-brand-textTertiary uppercase tracking-wider mb-4 pt-6 border-t border-brand-outline">Tudo do Pro, mais</div>
                <ul className="space-y-3">
                  <PricingItem text="Zero comissão sobre vendas" included highlight />
                  <PricingItem text="White-label completo" included highlight />
                  <PricingItem text="Suporte prioritário" included highlight />
                  <PricingItem text="Alunos ilimitados" included />
                  <PricingItem text="Programas ilimitados" included />
                  <PricingItem text="Analytics avançado" included />
                  <PricingItem text="Chat direto com alunos" included />
                  <PricingItem text="Acompanhamento de progresso" included />
                </ul>
                <div className="mt-6 pt-4 border-t border-brand-outline">
                  <p className="text-xs text-brand-textSecondary">
                    <span className="font-semibold text-white">0% de comissão</span> — você fica com tudo
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-brand-textTertiary mt-8 max-w-lg mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
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
            <div className="flex items-center gap-2 text-sm text-brand-textTertiary">
              <span>Pagamentos processados por</span>
              <span className="font-semibold text-white">Stripe</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ====== HELPER COMPONENTS ====== */

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
