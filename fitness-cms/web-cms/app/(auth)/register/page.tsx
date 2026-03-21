import type { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Criar Conta — FitToday',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
