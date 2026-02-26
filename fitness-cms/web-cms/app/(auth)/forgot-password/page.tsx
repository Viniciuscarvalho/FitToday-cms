'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dumbbell, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!auth) {
      setError('Serviço indisponível no momento. Tente novamente mais tarde.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, data.email);
      setSubmittedEmail(data.email);
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('user-not-found')) {
        // Don't reveal whether email exists — show success anyway
        setSubmittedEmail(data.email);
        setSent(true);
      } else if (message.includes('invalid-email')) {
        setError('Email inválido.');
      } else if (message.includes('too-many-requests')) {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Erro ao enviar email. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center gap-2 lg:hidden">
          <Dumbbell className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold">FitToday</span>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Email enviado</h1>
          <p className="text-gray-500">
            Se uma conta existir com o email{' '}
            <strong className="text-gray-700">{submittedEmail}</strong>, você
            receberá um link para redefinir sua senha em breve.
          </p>
          <p className="text-sm text-gray-400">
            Verifique também sua pasta de spam.
          </p>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-2 lg:hidden">
        <Dumbbell className="h-8 w-8 text-primary-600" />
        <span className="text-xl font-bold">FitToday</span>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Recuperar senha</h1>
        <p className="text-gray-500">
          Informe seu email e enviaremos um link para redefinir sua senha
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              {...register('email')}
              placeholder="seu@email.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar link de recuperação'
          )}
        </button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o login
      </Link>
    </div>
  );
}
