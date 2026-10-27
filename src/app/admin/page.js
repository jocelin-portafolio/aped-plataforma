import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { upcomingAppointments, listTherapists, listUsers } from '@/lib/panel';
import { todayYmd, addDays } from '@/lib/agendaTime';
import { LogoutButton } from '@/components/features/auth';
import { AppointmentTable, UserManager } from '@/components/features/panel';

export const metadata = { title: 'Panel de administración', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // El middleware ya filtra, pero la página vuelve a comprobar (cuenta activa y rol).
  const session = await getSession();
  if (session?.role !== 'admin') redirect('/login?next=/admin');

  const [appointments, therapists, users] = await Promise.all([
    upcomingAppointments({ days: 30 }),
    listTherapists(),
    listUsers(),
  ]);

  const today = todayYmd();
  const weekEnd = addDays(today, 7);
  const active = appointments.filter((a) => a.status !== 'cancelled');
  const stats = [
    ['Citas hoy', active.filter((a) => a.date === today).length],
    ['Próximos 7 días', active.filter((a) => a.date < weekEnd).length],
    ['Por confirmar', active.filter((a) => a.status === 'scheduled').length],
    ['Terapeutas activos', therapists.filter((t) => t.active).length],
  ];

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <h1>Panel de administración</h1>
          <p className="section-subtitle">Hola, {session.name}</p>
        </div>
        <LogoutButton />
      </header>

      <dl className="panel-stats">
        {stats.map(([label, value]) => (
          <div key={label} className="panel-stat">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section className="panel-section" aria-labelledby="citas">
        <h2 id="citas">Próximas citas (30 días)</h2>
        <AppointmentTable
          appointments={appointments}
          actions={['confirmed', 'completed', 'no-show', 'cancelled']}
          showTherapist
        />
      </section>

      <section className="panel-section" aria-labelledby="equipo">
        <h2 id="equipo">Cuentas del equipo</h2>
        <UserManager users={users} therapists={therapists} currentUserId={session.id} />
      </section>
    </div>
  );
}
