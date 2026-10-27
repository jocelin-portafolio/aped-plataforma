import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { upcomingAppointments, therapistProfile } from '@/lib/panel';
import { todayYmd } from '@/lib/agendaTime';
import { LogoutButton } from '@/components/features/auth';
import { AppointmentTable } from '@/components/features/panel';
import { Alert } from '@/components/ui';

export const metadata = { title: 'Mi agenda', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const DAYS = [
  ['monday', 'Lunes'],
  ['tuesday', 'Martes'],
  ['wednesday', 'Miércoles'],
  ['thursday', 'Jueves'],
  ['friday', 'Viernes'],
  ['saturday', 'Sábado'],
];

export default async function TherapistPage() {
  const session = await getSession();
  if (session?.role !== 'therapist') redirect('/login?next=/terapeuta');

  const profile = session.therapistId ? await therapistProfile(session.therapistId) : null;
  if (!profile) {
    return (
      <div className="panel">
        <header className="panel-header">
          <h1>Mi agenda</h1>
          <LogoutButton />
        </header>
        <Alert.Error>Tu cuenta no está vinculada a una ficha de terapeuta. Pídele a un administrador que la revise.</Alert.Error>
      </div>
    );
  }

  const appointments = await upcomingAppointments({ therapistId: session.therapistId, days: 14 });
  const today = todayYmd();
  const todayCount = appointments.filter((a) => a.date === today && a.status !== 'cancelled').length;

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <h1>Mi agenda</h1>
          <p className="section-subtitle">
            {profile.name} · {profile.specialties.join(', ')}
          </p>
        </div>
        <LogoutButton />
      </header>

      <dl className="panel-stats">
        <div className="panel-stat">
          <dt>Citas hoy</dt>
          <dd>{todayCount}</dd>
        </div>
        <div className="panel-stat">
          <dt>Próximos 14 días</dt>
          <dd>{appointments.filter((a) => a.status !== 'cancelled').length}</dd>
        </div>
      </dl>

      <section className="panel-section" aria-labelledby="mis-citas">
        <h2 id="mis-citas">Mis citas (14 días)</h2>
        <AppointmentTable appointments={appointments} actions={['confirmed', 'completed', 'no-show']} />
        <p className="form-hint">Para cancelar o mover una cita, avisa a administración.</p>
      </section>

      <section className="panel-section" aria-labelledby="mi-horario">
        <h2 id="mi-horario">Mi horario semanal</h2>
        <div className="panel-table-wrap">
          <table className="panel-table">
            <tbody>
              {DAYS.map(([key, label]) => {
                const day = profile.schedule?.[key];
                return (
                  <tr key={key}>
                    <th scope="row">{label}</th>
                    <td>{day?.available ? (day.slots?.length ? day.slots.join(' · ') : 'Bloques por defecto') : 'No atiende'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="form-hint">Para cambiar tu horario, pídeselo a administración.</p>
      </section>
    </div>
  );
}
