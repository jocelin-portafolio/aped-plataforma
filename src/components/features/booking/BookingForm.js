'use client';

import { useState } from 'react';
import { useFormState } from '@/hooks/useFormState';
import { Button, Alert } from '@/components/ui';
import { clinicalServices } from '@/config/services';

export default function BookingForm() {
  const { values, loading, result, updateField, submit } = useFormState({
    clientEmail: '',
    specialty: '',
    date: '',
    startTime: '',
  });
  const [slots, setSlots] = useState([]);

  async function fetchAvailability() {
    if (!values.date || !values.specialty) return;
    try {
      const res = await fetch(
        `/api/availability?date=${values.date}&specialty=${values.specialty}`
      );
      const data = await res.json();
      if (data.success) setSlots(data.data.availableSlots);
    } catch {
      setSlots([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await submit('/api/appointments', {
      body: JSON.stringify({
        clientId: values.clientEmail,
        specialty: values.specialty,
        date: values.date,
        startTime: values.startTime,
        endTime: addMinutes(values.startTime, 30),
      }),
    });
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Formulario de reservas" className="form">
      <h2>Reservar Sesión Clínica</h2>

      <div className="form-group">
        <label htmlFor="clientEmail">Tu email</label>
        <input
          id="clientEmail"
          type="email"
          required
          value={values.clientEmail}
          onChange={(e) => updateField('clientEmail', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="specialty">Servicio</label>
        <select
          id="specialty"
          required
          value={values.specialty}
          onChange={(e) => {
            updateField('specialty', e.target.value);
          }}
        >
          <option value="">Seleccionar...</option>
          {clinicalServices.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="date">Fecha</label>
        <input
          id="date"
          type="date"
          required
          value={values.date}
          onChange={(e) => {
            updateField('date', e.target.value);
            fetchAvailability();
          }}
        />
      </div>

      {slots.length > 0 && (
        <fieldset className="form-group">
          <legend>Horarios disponibles</legend>
          <div className="slots-grid">
            {slots.map((slot) => (
              <label key={slot} className="slot-option">
                <input
                  type="radio"
                  name="startTime"
                  value={slot}
                  checked={values.startTime === slot}
                  onChange={(e) => updateField('startTime', e.target.value)}
                />
                {slot}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Button type="submit" disabled={loading || !values.startTime} variant="primary">
        {loading ? 'Reservando...' : 'Reservar'}
      </Button>

      {result && (
        result.success
          ? <Alert.Success>Reserva confirmada</Alert.Success>
          : <Alert.Error>{result.error || 'Error al reservar'}</Alert.Error>
      )}
    </form>
  );
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
