import { redirect } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { Section } from '@/components/ui';
import { LoginForm } from '@/components/features/auth';
import { getSession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/session';

export const metadata = {
  title: 'Acceso equipo',
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }) {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role]);

  const { next } = await searchParams;
  return (
    <Section
      id="login"
      className="login-page"
      tinted
      eyebrow="Equipo APED"
      eyebrowIcon={LockKeyhole}
      title="Acceso del equipo"
      subtitle="Ingreso para administradores y terapeutas"
    >
      <LoginForm next={typeof next === 'string' ? next : ''} />
    </Section>
  );
}
