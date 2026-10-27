import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDB } from '@/config/db';
import { startMongo, stopMongo, clearMongo, disconnectMongo, weeklySchedule } from '@/test/mongo';
import Therapist from '@/models/Therapist';
import Appointment from '@/models/Appointment';
import { POST } from './route';
import { GET } from './availability/route';

let therapist;

beforeAll(startMongo);
afterAll(stopMongo);

beforeEach(async () => {
  await clearMongo();
  therapist = await Therapist.create({
    firstName: 'Pedro',
    lastName: 'Rojas',
    email: 'pedro@aped.cl',
    phone: '+56922222222',
    specialties: ['psicologia'],
    // Todos los días, a última hora, para que siempre haya horas futuras.
    schedule: weeklySchedule(
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      ['23:00', '23:30']
    ),
  });
});

const availability = (specialty) =>
  GET(new Request(`http://localhost/api/booking/availability?specialty=${specialty}`));

const book = (body) =>
  POST(
    new Request('http://localhost/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );

const patient = {
  firstName: 'Ana',
  lastName: 'Pérez',
  dateOfBirth: '2015-03-25',
  email: 'ana@example.com',
  phone: '+56 9 1234 5678',
};

async function firstSlot() {
  const json = await (await availability('psicologia')).json();
  return json.data.slots[0];
}

describe('GET /api/booking/availability', () => {
  it('devuelve los bloques libres de la especialidad', async () => {
    const res = await availability('psicologia');
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const { data } = await res.json();
    expect(data.slots.length).toBeGreaterThan(10);
    expect(data.slots[0]).toMatchObject({ therapistName: 'Pedro Rojas', therapistId: String(therapist._id) });
  });

  it('rechaza especialidades que no se agendan en línea', async () => {
    expect((await availability('terapia-conductual')).status).toBe(400);
    expect((await availability('')).status).toBe(400);
  });

  it('responde 503 si la base de datos no está configurada', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const uri = process.env.MONGODB_URI;
    // Simula un servidor sin conexión ni MONGODB_URI.
    await disconnectMongo();
    delete process.env.MONGODB_URI;
    try {
      expect((await availability('psicologia')).status).toBe(503);
    } finally {
      process.env.MONGODB_URI = uri;
      await connectDB();
      vi.restoreAllMocks();
    }
  });
});

describe('POST /api/booking', () => {
  it('reserva el bloque y lo saca de la disponibilidad', async () => {
    const slot = await firstSlot();
    const res = await book({ specialty: 'psicologia', ...slot, patient });
    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(data).toMatchObject({ date: slot.date, startTime: slot.startTime, therapistName: 'Pedro Rojas' });

    const appointment = await Appointment.findById(data.id).lean();
    expect(appointment.notes).toBe('Reservada por formulario web');
    const { data: after } = await (await availability('psicologia')).json();
    expect(after.slots.some((s) => s.date === slot.date && s.startTime === slot.startTime)).toBe(false);
  });

  it('responde 409 si la hora ya se tomó', async () => {
    const slot = await firstSlot();
    await book({ specialty: 'psicologia', ...slot, patient });
    const res = await book({ specialty: 'psicologia', ...slot, patient: { ...patient, email: 'otra@example.com' } });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ success: false, reason: 'taken' });
  });

  it('responde 400 con datos del paciente inválidos', async () => {
    const slot = await firstSlot();
    const res = await book({ specialty: 'psicologia', ...slot, patient: { ...patient, email: 'x', firstName: 42 } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('email');
    expect(json.error).toContain('nombre');
  });

  it.each([
    ['JSON inválido', '{no'],
    ['sin terapeuta', { specialty: 'psicologia', date: '2026-11-03', startTime: '23:00', patient }],
    ['fecha mal formada', { specialty: 'psicologia', therapistId: 'a'.repeat(24), date: '3/11', startTime: '23:00', patient }],
  ])('responde 400: %s', async (_, body) => {
    expect((await book(body)).status).toBe(400);
  });
});
