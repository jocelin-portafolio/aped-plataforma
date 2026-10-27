'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDay } from '@/lib/agendaTime';

const STATUS_LABELS = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  'no-show': 'No asistió',
};

const ACTION_LABELS = {
  confirmed: 'Confirmar',
  completed: 'Realizada',
  'no-show': 'No asistió',
  cancelled: 'Cancelar',
};

/**
 * Tabla de citas agrupada por día. `actions` son los estados que este rol
 * puede poner; `showTherapist` agrega la columna de profesional.
 */
export default function AppointmentTable({ appointments, actions, showTherapist = false }) {
  const router = useRouter();
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);

  async function setStatus(id, status) {
    if (status === 'cancelled' && !window.confirm('¿Cancelar esta cita? La hora quedará libre.')) return;
    setPending(id);
    setError(null);
    try {
      const res = await fetch(`/api/appointments?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.refresh();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la cita');
    } finally {
      setPending(null);
    }
  }

  if (!appointments.length) return <p className="panel-empty">No hay citas en este período.</p>;

  const days = [...new Set(appointments.map((a) => a.date))];

  return (
    <div className="panel-appointments">
      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}
      {days.map((day) => (
        <section key={day} className="panel-day">
          <h3>{formatDay(day)}</h3>
          <div className="panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th scope="col">Hora</th>
                  <th scope="col">Paciente</th>
                  <th scope="col">Especialidad</th>
                  {showTherapist && <th scope="col">Profesional</th>}
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments
                  .filter((a) => a.date === day)
                  .map((a) => {
                    const closed = ['cancelled', 'completed', 'no-show'].includes(a.status);
                    return (
                      <tr key={a.id} className={closed ? 'is-closed' : ''}>
                        <td>
                          {a.startTime}–{a.endTime}
                        </td>
                        <td>
                          {a.patient ? (
                            <>
                              <strong>{a.patient.name}</strong>
                              <br />
                              <small>
                                <a href={`tel:${a.patient.phone}`}>{a.patient.phone}</a> · {a.patient.email}
                              </small>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{a.specialty}</td>
                        {showTherapist && <td>{a.therapist}</td>}
                        <td>
                          <span className={`status status--${a.status}`}>{STATUS_LABELS[a.status]}</span>
                        </td>
                        <td className="panel-actions">
                          {!closed &&
                            actions
                              .filter((s) => s !== a.status)
                              .map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  className={`btn btn--sm ${status === 'cancelled' ? 'btn-danger' : 'btn-ghost'}`}
                                  disabled={pending === a.id}
                                  onClick={() => setStatus(a.id, status)}
                                >
                                  {ACTION_LABELS[status]}
                                </button>
                              ))}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
