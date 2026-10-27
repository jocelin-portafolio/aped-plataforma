'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFormState } from '@/hooks/useFormState';
import { Button, Alert } from '@/components/ui';
import { clinicalServices } from '@/config/services';
import { bookingConfig } from '@/config/booking';
import { contact } from '@/config/navigation';
import { formatDay, formatDayShort } from '@/lib/agendaTime';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';

const bookableServices = clinicalServices.filter((s) => bookingConfig.specialties.includes(s.id));

const EMPTY_PATIENT = { firstName: '', lastName: '', dateOfBirth: '', email: '', phone: '' };

export default function BookingForm() {
  const { values, loading, result, updateField, updateFields, submit } = useFormState({
    specialty: '',
    date: '',
    slotId: '',
    ...EMPTY_PATIENT,
  });
  const [slots, setSlots] = useState([]);
  const [agenda, setAgenda] = useState({ loading: false, error: null });
  const [booked, setBooked] = useState(null);

  // Consulta la agenda en el momento: horario de cada terapeuta menos citas tomadas.
  const loadSlots = useCallback(async (specialty) => {
    if (!specialty) {
      setSlots([]);
      return;
    }
    setAgenda({ loading: true, error: null });
    try {
      const res = await fetch(`/api/booking/availability?specialty=${specialty}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSlots(json.data.slots);
      setAgenda({ loading: false, error: null });
    } catch (err) {
      setSlots([]);
      setAgenda({ loading: false, error: err.message || 'No pudimos consultar la agenda' });
    }
  }, []);

  useEffect(() => {
    loadSlots(values.specialty);
  }, [values.specialty, loadSlots]);

  const days = [...new Set(slots.map((s) => s.date))];
  const daySlots = slots.filter((s) => s.date === values.date);
  const slotId = (s) => `${s.therapistId}|${s.date}|${s.startTime}`;
  const selected = slots.find((s) => slotId(s) === values.slotId);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected) return;
    const data = await submit('/api/booking', {
      body: JSON.stringify({
        specialty: values.specialty,
        therapistId: selected.therapistId,
        date: selected.date,
        startTime: selected.startTime,
        patient: {
          firstName: values.firstName,
          lastName: values.lastName,
          dateOfBirth: values.dateOfBirth,
          email: values.email,
          phone: values.phone,
        },
      }),
    });

    if (data.success) {
      setBooked(data.data);
      updateFields({ date: '', slotId: '', ...EMPTY_PATIENT });
    }
    // Tras reservar (o si la hora se tomó), la lista vuelve a reflejar la agenda.
    if (data.success || data.reason === 'taken') {
      updateField('slotId', '');
      loadSlots(values.specialty);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Formulario de reservas" className="form booking-form">
      {booked && (
        <Alert.Success>
          <CheckCircle2 size={18} aria-hidden="true" className="alert-icon" /> ¡Hora reservada! {bookableServices.find((s) => s.id === booked.specialty)?.name} el{' '}
          {formatDay(booked.date)} a las {booked.startTime}, con {booked.therapistName}. Si necesitas
          cambiarla, escríbenos por WhatsApp al {contact.phone.display}.
        </Alert.Success>
      )}

      <div className="form-group">
        <label htmlFor="specialty" className="form-step">
          <Step n={1} />
          ¿Qué especialidad necesitas?
        </label>
        <select
          id="specialty"
          required
          value={values.specialty}
          onChange={(e) => {
            setBooked(null);
            updateFields({ specialty: e.target.value, date: '', slotId: '' });
          }}
        >
          <option value="">Seleccionar...</option>
          {bookableServices.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <small className="form-hint">
          Para Terapia Conductual escríbenos por WhatsApp al {contact.phone.display}.
        </small>
      </div>

      {agenda.loading && <p className="form-hint" role="status">Consultando horas disponibles…</p>}
      {agenda.error && <Alert.Error>{agenda.error}. Intenta más tarde o escríbenos por WhatsApp.</Alert.Error>}

      {values.specialty && !agenda.loading && !agenda.error && days.length === 0 && (
        <Alert type="info">
          No hay horas libres en los próximos {bookingConfig.daysAhead} días. Escríbenos por WhatsApp al{' '}
          {contact.phone.display} y te avisamos cuando se libere una.
        </Alert>
      )}

      {days.length > 0 && (
        <fieldset className="form-group">
          <legend className="form-step">
            <Step n={2} />
            Elige el día
          </legend>
          <div className="slots-grid">
            {days.map((date) => (
              <label key={date} className="slot-option">
                <input
                  type="radio"
                  name="date"
                  value={date}
                  checked={values.date === date}
                  onChange={() => updateFields({ date, slotId: '' })}
                />
                {formatDayShort(date)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {daySlots.length > 0 && (
        <fieldset className="form-group">
          <legend className="form-step">
            <Step n={3} />
            Hora libre el {formatDay(values.date)}
          </legend>
          <div className="slots-grid slots-grid--wide">
            {daySlots.map((s) => (
              <label key={slotId(s)} className="slot-option">
                <input
                  type="radio"
                  name="slot"
                  value={slotId(s)}
                  checked={values.slotId === slotId(s)}
                  onChange={(e) => updateField('slotId', e.target.value)}
                />
                <span>
                  <strong>{s.startTime}</strong>
                  <br />
                  <small>{s.therapistName}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {selected && (
        <fieldset className="form-group booking-patient">
          <legend className="form-step">
            <Step n={4} />
            Datos del paciente
          </legend>
          <div className="form-row">
          {[
            ['firstName', 'Nombre', 'text', 'given-name'],
            ['lastName', 'Apellido', 'text', 'family-name'],
            ['dateOfBirth', 'Fecha de nacimiento', 'date', 'bday'],
            ['email', 'Email de contacto', 'email', 'email'],
            ['phone', 'Teléfono', 'tel', 'tel'],
          ].map(([field, label, type, autoComplete]) => (
            <div key={field} className="form-group">
              <label htmlFor={field}>{label}</label>
              <input
                id={field}
                type={type}
                required
                autoComplete={autoComplete}
                max={type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
                placeholder={field === 'phone' ? '+56 9 1234 5678' : undefined}
                value={values[field]}
                onChange={(e) => updateField(field, e.target.value)}
              />
            </div>
          ))}
          </div>
        </fieldset>
      )}

      <Button type="submit" disabled={loading || !selected} variant="primary" size="lg">
        <CalendarCheck size={20} aria-hidden="true" />
        {loading ? 'Reservando...' : 'Confirmar reserva'}
      </Button>

      {result && !result.success && <Alert.Error>{result.error || 'Error al reservar'}</Alert.Error>}
    </form>
  );
}

function Step({ n }) {
  return (
    <span className="form-step-number" aria-hidden="true">
      {n}
    </span>
  );
}
