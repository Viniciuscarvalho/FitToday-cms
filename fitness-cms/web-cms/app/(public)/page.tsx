import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Outfit } from 'next/font/google';
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
} from 'lucide-react';

const display = Outfit({ subsets: ['latin'], display: 'swap' });
const d = display.className;

export const metadata: Metadata = {
  title: 'FitToday - Plataforma para Personal Trainers',
  description:
    'Gerencie seus programas de treino, alunos e pagamentos em um único lugar. A plataforma completa para personal trainers profissionais.',
};

export default function SitePage() {
  return (
    <div className="min-h-screen bg-white antialiased overflow-x-hidden">
      {/* ====== HEADER ====== */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-gray-950/60 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className={`${d} text-xl font-bold text-white tracking-tight`}>
                  FitToday
                </span>
              </Link>

              <nav className="hidden lg:flex items-center gap-8">
                <a href="#funcionalidades" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">
                  Funcionalidades
                </a>
                <a href="#como-funciona" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">
                  Como Funciona
                </a>
                <a href="#precos" className="text-sm text-gray-300 hover:text-white transition-colors duration-200">
                  Preços
                </a>
              </nav>

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
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950" />

        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] rounded-full text-sm text-primary-300 font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Plataforma completa para personal trainers
          </div>

          <h1 className={`${d} animate-fade-in-up animation-delay-100 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[0.95] tracking-tight mb-6`}>
            Seus treinos.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-300 to-amber-400">
              Seu negócio.
            </span>
          </h1>

          <p className="animate-fade-in-up animation-delay-200 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Crie programas de treino, acompanhe seus alunos e receba
            pagamentos de forma segura. Tudo que você precisa para
            profissionalizar seu trabalho.
          </p>

          <div className="animate-fade-in-up animation-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl shadow-primary-500/30 hover:shadow-primary-400/40 hover:scale-[1.02]"
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

          <div className="animate-fade-in-up animation-delay-400 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-400" />
              Plano grátis disponível
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-400" />
              Pagamentos via Stripe
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-400" />
              Apps iOS e Android
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ====== STATS ====== */}
      <section className="relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard number="500+" label="Trainers Ativos" icon={<Users className="w-5 h-5" />} />
            <StatCard number="2.000+" label="Alunos Cadastrados" icon={<TrendingUp className="w-5 h-5" />} />
            <StatCard number="10K+" label="Treinos Enviados" icon={<Dumbbell className="w-5 h-5" />} />
            <StatCard number="R$ 1M+" label="Processados" icon={<Wallet className="w-5 h-5" />} />
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="funcionalidades" className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium mb-4">
              <Star className="w-3.5 h-3.5" />
              Funcionalidades
            </div>
            <h2 className={`${d} text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight`}>
              Tudo que você precisa,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-amber-500">
                nada que não precisa
              </span>
            </h2>
          </div>

          {/* Feature 1: Programs */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80">
              <Image
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Personal trainer orientando aluna"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <FileText className="w-3.5 h-3.5" />
                Programas de Treino
              </div>
              <h3 className={`${d} text-2xl sm:text-3xl font-bold text-gray-900 mb-4`}>
                Monte treinos profissionais em minutos
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Crie programas completos com exercícios, séries, repetições e envie
                PDFs personalizados diretamente para seus alunos pelo app.
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <Users className="w-3.5 h-3.5" />
                Gestão de Alunos
              </div>
              <h3 className={`${d} text-2xl sm:text-3xl font-bold text-gray-900 mb-4`}>
                Acompanhe cada aluno de perto
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
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
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80 order-1 lg:order-2">
              <Image
                src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Atleta treinando com determinacao"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Feature 3: Payments */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80">
              <Image
                src="https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Pessoa treinando com intensidade"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <Wallet className="w-3.5 h-3.5" />
                Financeiro
              </div>
              <h3 className={`${d} text-2xl sm:text-3xl font-bold text-gray-900 mb-4`}>
                Receba pagamentos sem complicação
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
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
      <section id="como-funciona" className="py-24 sm:py-32 bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/[0.05] rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.06] text-primary-400 rounded-full text-sm font-medium mb-4 border border-white/[0.08]">
              Como Funciona
            </div>
            <h2 className={`${d} text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight`}>
              Comece em{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-400">
                3 passos simples
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <StepCard
              number="01"
              title="Crie sua Conta"
              description="Cadastre-se gratuitamente, configure seu perfil com especialidades e comece a usar em minutos."
              icon={<Users className="w-6 h-6" />}
            />
            <StepCard
              number="02"
              title="Monte seus Programas"
              description="Crie treinos com exercícios, defina preços e publique para seus alunos acessarem pelo app."
              icon={<Dumbbell className="w-6 h-6" />}
            />
            <StepCard
              number="03"
              title="Receba Pagamentos"
              description="Alunos pagam diretamente pelo app. Você recebe automaticamente na sua conta via Stripe."
              icon={<Wallet className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* ====== PRICING ====== */}
      <section id="precos" className="py-24 sm:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium mb-4">
              <Star className="w-3.5 h-3.5" />
              Preços
            </div>
            <h2 className={`${d} text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4`}>
              Escolha o plano ideal para você
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Comece grátis e faça upgrade conforme seu negócio cresce.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start">
            {/* Starter */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="px-6 py-8">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Starter</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`${d} text-4xl font-extrabold text-gray-900`}>Grátis</span>
                </div>
                <p className="text-primary-600 font-medium text-sm mb-6">+ 10% por transação</p>
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Comece Grátis
                </Link>
              </div>
              <div className="px-6 pb-8">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">O que inclui</div>
                <ul className="space-y-3">
                  <PricingItem text="Até 5 alunos" />
                  <PricingItem text="Até 3 programas de treino" />
                  <PricingItem text="Envio de treinos em PDF" />
                  <PricingItem text="Pagamentos via Stripe" />
                  <PricingItem text="Dashboard básico" />
                  <PricingItem text="Apps iOS e Android" />
                </ul>
              </div>
            </div>

            {/* Pro (highlighted) */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-b from-primary-400 via-primary-500 to-amber-500 rounded-2xl" />
              <div className="relative bg-white rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-6 py-2 text-center">
                  <span className="text-xs font-bold text-primary-300 uppercase tracking-widest">Mais Popular</span>
                </div>
                <div className="px-6 py-8">
                  <div className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Pro</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`${d} text-4xl font-extrabold text-gray-900`}>R$ 97</span>
                    <span className="text-gray-500 text-sm">/mes</span>
                  </div>
                  <p className="text-primary-600 font-medium text-sm mb-6">+ 5% por transação</p>
                  <Link
                    href="/register"
                    className="group w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-primary-400/30"
                  >
                    Assinar Pro
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                <div className="px-6 pb-8">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tudo do Starter, mais</div>
                  <ul className="space-y-3">
                    <PricingItem text="Alunos ilimitados" highlight />
                    <PricingItem text="Programas ilimitados" highlight />
                    <PricingItem text="Analytics avançado" />
                    <PricingItem text="Comissão reduzida (5%)" />
                    <PricingItem text="Acompanhamento de progresso" />
                    <PricingItem text="Suporte por email" />
                  </ul>
                </div>
              </div>
            </div>

            {/* Elite */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="px-6 py-8">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Elite</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`${d} text-4xl font-extrabold text-gray-900`}>R$ 197</span>
                  <span className="text-gray-500 text-sm">/mes</span>
                </div>
                <p className="text-green-600 font-medium text-sm mb-6">Sem comissão</p>
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Assinar Elite
                </Link>
              </div>
              <div className="px-6 pb-8">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tudo do Pro, mais</div>
                <ul className="space-y-3">
                  <PricingItem text="0% de comissão" highlight />
                  <PricingItem text="Chat direto com alunos" highlight />
                  <PricingItem text="Suporte prioritário" />
                  <PricingItem text="White-label (sua marca)" />
                  <PricingItem text="Branding personalizado" />
                  <PricingItem text="Tudo ilimitado" />
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TRUST / SECURITY ====== */}
      <section className="py-20 sm:py-24 bg-gray-950 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary-500/20">
            <Shield className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className={`${d} text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4`}>
            Pagamentos seguros com Stripe
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
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
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/90 via-primary-500/85 to-amber-500/80" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`${d} text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6`}>
            Pronto para profissionalizar seu trabalho?
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
            Junte-se a personal trainers que ja usam o FitToday para gerenciar
            treinos e receber pagamentos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-2xl"
            >
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-all text-center"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-gray-950 text-gray-400 py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className={`${d} text-xl font-bold text-white`}>FitToday</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                Plataforma completa para personal trainers gerenciarem
                programas de treino, alunos e pagamentos.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Plataforma</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#funcionalidades" className="hover:text-white transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#precos" className="hover:text-white transition-colors">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#como-funciona" className="hover:text-white transition-colors">
                    Como Funciona
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contato</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="mailto:contato@fittoday.me"
                    className="hover:text-white transition-colors"
                  >
                    contato@fittoday.me
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} FitToday. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Pagamentos processados por</span>
              <span className="font-semibold text-gray-400">Stripe</span>
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
    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 text-center hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
      <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-50 text-primary-500 rounded-xl mb-3">
        {icon}
      </div>
      <div className={`${d} text-2xl sm:text-3xl font-bold text-gray-900`}>{number}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function FeatureBullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-8 h-8 bg-primary-50 text-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-gray-700">{text}</span>
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
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
        <div className={`${d} text-5xl font-extrabold text-primary-500/20 mb-6`}>{number}</div>
        <div className="w-12 h-12 bg-primary-500/10 text-primary-400 rounded-xl flex items-center justify-center mb-4 border border-primary-500/20">
          {icon}
        </div>
        <h3 className={`${d} text-xl font-bold text-white mb-3`}>{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function PricingItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${highlight ? 'text-primary-500' : 'text-gray-300'}`} />
      <span className={highlight ? 'text-gray-900 font-medium' : 'text-gray-600'}>{text}</span>
    </li>
  );
}

function TrustBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] rounded-full border border-white/[0.08]">
      <CheckCircle className="w-4 h-4 text-green-400" />
      <span className="text-gray-300 text-sm">{text}</span>
    </div>
  );
}
