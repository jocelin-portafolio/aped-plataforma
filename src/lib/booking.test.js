import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startMongo, stopMongo, clearMongo, weeklySchedule } from '@/test/mongo';
import Therapist from '@/models/Therapist';
import Appointment from '@/models/Appointment';
import Client from '@/models/Client';
import { getAvailability, bookAppointment } from './booking';
import { todayYmd, addDays, weekday, ymdToDate } from './agendaTime';

// Lunes 2 de noviembre de 2026, 09:00 en Santiago (UTC-3 en horario de verano).
const NOW = new Date('2026-11-02T12:00:00Z');
const TODAY = todayYmd(NOW);

const patient = {
  firstName: 'Ana',
  lastName: 'Pérez',
  dateOfBirth: '2015-03-25',
  email: 'ana@example.com',
  phone: '+56912345678',
};

let fono;
let psico;

beforeAll(startMongo);
afterAll(stopMongo);

beforeEach(async () => {
  await clearMongo();
  fono = await Therapist.create({
    firstName: 'Carla',
    lastName: 'Soto',
    email: 'carla@aped.cl',
    phone: '+56911111111',
    specialties: ['fonoaudiologia'],
    schedule: weeklySchedule(['monday', 'wednesday'], ['09:00', '09:30', '10:00', '15:00']),
  });
  psico = await Therapist.create({
    firstName: 'Pedro',
    lastName: 'Rojas',
    email: 'pedro@aped.cl',
    phone: '+56922222222',
    specialties: ['psicologia'],
    schedule: weeklySchedule(['tuesday'], []),
  });
});

function book(overrides = {}) {
  return bookAppointment({
    specialty: 'fonoaudiologia',
    therapistId: String(fono._id),
    date: TODAY,
    startTime: '15:00',
    patient,
    now: NOW,
    ...overrides,
  });
}

describe('getAvailability', () => {
  it('cruza el horario semanal con los próximos 14 días', async () => {
    expect(weekday(TODAY)).toBe('monday');
    const slots = await getAvailability('fonoaudiologia', { now: NOW });

    const days = [...new Set(slots.map((s) => s.date))];
    expect(days).toEqual([TODAY, addDays(TODAY, 2), addDays(TODAY, 7), addDays(TODAY, 9)]);
    expect(slots.every((s) => s.therapistName === 'Carla Soto')).toBe(true);
    expect(slots[0]).toMatchObject({ therapistId: String(fono._id), endTime: '10:30' });
  });

  it('hoy omite las horas que ya pasaron o están a menos de una hora', async () => {
    const today = (await getAvailability('fonoaudiologia', { now: NOW })).filter((s) => s.date === TODAY);
    expect(today.map((s) => s.startTime)).toEqual(['10:00', '15:00']);
  });

  it('usa los bloques por defecto si el terapeuta no definió horas', async () => {
    const slots = await getAvailability('psicologia', { now: NOW });
    expect(slots.filter((s) => s.date === addDays(TODAY, 1))).toHaveLength(12);
  });

  it('descuenta las citas tomadas, pero no las canceladas', async () => {
    const base = { clientId: psico._id, therapistId: fono._id, specialty: 'fonoaudiologia', endTime: '10:30' };
    await Appointment.create({ ...base, date: ymdToDate(addDays(TODAY, 2)), startTime: '09:00' });
    await Appointment.create({ ...base, date: ymdToDate(addDays(TODAY, 2)), startTime: '09:30', status: 'cancelled' });

    const times = (await getAvailability('fonoaudiologia', { now: NOW }))
      .filter((s) => s.date === addDays(TODAY, 2))
      .map((s) => s.startTime);
    expect(times).toEqual(['09:30', '10:00', '15:00']);
  });

  it('ignora terapeutas inactivos y especialidades que no se agendan por chat', async () => {
    await Therapist.updateOne({ _id: fono._id }, { active: false });
    expect(await getAvailability('fonoaudiologia', { now: NOW })).toEqual([]);
    expect(await getAvailability('terapia-conductual', { now: NOW })).toEqual([]);
  });
});

describe('bookAppointment', () => {
  it('crea el paciente y la cita, y el bloque deja de estar disponible', async () => {
    const result = await book();
    expect(result).toMatchObject({
      ok: true,
      appointment: { therapistName: 'Carla Soto', date: TODAY, startTime: '15:00', endTime: '15:30' },
    });

    expect(await Client.countDocuments({ email: 'ana@example.com' })).toBe(1);
    const appointment = await Appointment.findById(result.appointment.id).lean();
    expect(appointment).toMatchObject({ status: 'scheduled', specialty: 'fonoaudiologia', notes: 'Reservada por chat' });

    const slots = await getAvailability('fonoaudiologia', { now: NOW });
    expect(slots.some((s) => s.date === TODAY && s.startTime === '15:00')).toBe(false);
  });

  it('rechaza una hora ya tomada', async () => {
    await book();
    const second = await book({ patient: { ...patient, email: 'otro@example.com', firstName: 'Luis' } });
    expect(second).toMatchObject({ ok: false, reason: 'taken' });
  });

  it('si dos personas reservan el mismo bloque a la vez, solo una lo consigue', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => book({ patient: { ...patient, email: `p${i}@example.com` } }))
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => r.reason === 'taken')).toHaveLength(4);
    expect(await Appointment.countDocuments({ startTime: '15:00' })).toBe(1);
  });

  it('rechaza horas fuera del horario, pasadas o de otra especialidad', async () => {
    expect(await book({ startTime: '12:00' })).toMatchObject({ ok: false, reason: 'taken' });
    expect(await book({ startTime: '09:00' })).toMatchObject({ ok: false, reason: 'taken' });
    expect(await book({ specialty: 'psicologia' })).toMatchObject({ ok: false, reason: 'taken' });
  });

  it('reutiliza el paciente si el email y el nombre coinciden', async () => {
    await book();
    await book({ startTime: '10:00' });
    expect(await Client.countDocuments()).toBe(1);
    expect(await Appointment.countDocuments()).toBe(2);
  });

  it('no mezcla pacientes distintos con el mismo email', async () => {
    await book();
    const other = await book({ startTime: '10:00', patient: { ...patient, firstName: 'Tomás' } });
    expect(other).toMatchObject({ ok: false, reason: 'email-in-use' });
  });

  it('valida los datos del paciente', async () => {
    const result = await book({ patient: { ...patient, email: 'no-es-email', dateOfBirth: '2099-01-01' } });
    expect(result).toMatchObject({ ok: false, reason: 'invalid' });
    expect(result.message).toContain('email');
    expect(result.message).toContain('fecha de nacimiento');
    expect(await Appointment.countDocuments()).toBe(0);
  });
});
