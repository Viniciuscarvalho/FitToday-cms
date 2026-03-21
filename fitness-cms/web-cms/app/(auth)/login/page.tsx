import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Entrar — FitToday',
};

export default function LoginPage() {
  return <LoginForm />;
}
