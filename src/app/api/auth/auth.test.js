import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { startMongo, stopMongo, clearMongo, weeklySchedule } from '@/test/mongo';
import User from '@/models/User';
import Therapist from '@/models/Therapist';
import Appointment from '@/models/Appointment';
import Client from '@/models/Client';
import { resetLoginAttempts } from '@/lib/auth';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';
import { POST as login } from './login/route';
import { POST as logout } from './logout/route';
import * as appointments from '../appointments/route';
import * as clients from '../clients/route';
import * as users from '../admin/users/route';
import { GET as therapistsGet } from '../therapists/route';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

const PASSWORD = 'contraseña-de-prueba-123';
let admin, carlaUser, carla, luis, appointmentCarla, appointmentLuis;

beforeAll(async () => {
  process.env.AUTH_SECRET = 's'.repeat(40);
  await startMongo();
});
afterAll(stopMongo);

beforeEach(async () => {
  await clearMongo();
  resetLoginAttempts();
  const schedule = weeklySchedule(['monday'], ['09:00']);
  carla = await Therapist.create({ firstName: 'Carla', lastName: 'Soto', email: 'c@aped.cl', phone: '+56911111111', specialties: ['fonoaudiologia'], schedule });
  luis = await Therapist.create({ firstName: 'Luis', lastName: 'Díaz', email: 'l@aped.cl', phone: '+56922222222', specialties: ['psicologia'], schedule });
  admin = await User.create({ name: 'Admin', email: 'admin@aped.cl', password: PASSWORD, role: 'admin' });
  carlaUser = await User.create({ name: 'Carla Soto', email: 'carla@aped.cl', password: PASSWORD, role: 'therapist', therapistId: carla._id });

  const client = await Client.create({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com', phone: '+56933333333', dateOfBirth: new Date('2015-03-25') });
  const base = { clientId: client._id, date: new Date('2026-11-02'), startTime: '09:00', endTime: '09:30' };
  appointmentCarla = await Appointment.create({ ...base, therapistId: carla._id, specialty: 'fonoaudiologia' });
  appointmentLuis = await Appointment.create({ ...base, therapistId: luis._id, specialty: 'psicologia' });
});

function json(url, { method = 'GET', body, cookie } = {}) {
  return new Request(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

async function cookieFor(user) {
  const token = await createSessionToken({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    therapistId: user.therapistId,
  });
  return `${SESSION_COOKIE}=${token}`;
}

describe('POST /api/auth/login', () => {
  it('inicia sesión de administrador y deja la cookie HttpOnly', async () => {
    const res = await login(json('/api/auth/login', { method: 'POST', body: { email: 'ADMIN@aped.cl ', password: PASSWORD } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, data: { role: 'admin', redirect: '/admin' } });
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toMatch(new RegExp(`^${SESSION_COOKIE}=`));
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('el terapeuta va a su panel, aunque pida otro destino', async () => {
    const res = await login(json('/api/auth/login', { method: 'POST', body: { email: 'carla@aped.cl', password: PASSWORD, next: '/admin' } }));
    expect((await res.json()).data.redirect).toBe('/terapeuta');
  });

  it('rechaza contraseña incorrecta, email desconocido, cuentas inactivas y roles sin panel', async () => {
    await User.create({ name: 'Staff', email: 'staff@aped.cl', password: PASSWORD, role: 'staff' });
    await User.updateOne({ _id: carlaUser._id }, { active: false });
    for (const body of [
      { email: 'admin@aped.cl', password: 'otra-clave-123' },
      { email: 'nadie@aped.cl', password: PASSWORD },
      { email: 'carla@aped.cl', password: PASSWORD },
      { email: 'staff@aped.cl', password: PASSWORD },
      { email: '', password: '' },
    ]) {
      const res = await login(json('/api/auth/login', { method: 'POST', body }));
      expect(res.status, body.email).toBe(401);
      expect(res.headers.get('set-cookie')).toBeNull();
      expect((await res.json()).error).toBe('Email o contraseña incorrectos');
    }
  });

  it('bloquea el email tras 5 intentos fallidos, incluso con la clave correcta', async () => {
    for (let i = 0; i < 5; i++) {
      await login(json('/api/auth/login', { method: 'POST', body: { email: 'admin@aped.cl', password: 'mala-clave-123' } }));
    }
    const res = await login(json('/api/auth/login', { method: 'POST', body: { email: 'admin@aped.cl', password: PASSWORD } }));
    expect(res.status).toBe(429);
  });
});

describe('POST /api/auth/logout', () => {
  it('borra la cookie', async () => {
    const res = await logout();
    expect(res.headers.get('set-cookie')).toMatch(new RegExp(`^${SESSION_COOKIE}=;.*Max-Age=0`));
  });
});

describe('APIs protegidas', () => {
  it('sin sesión: 401 en citas y pacientes', async () => {
    expect((await appointments.GET(json('/api/appointments'))).status).toBe(401);
    expect((await clients.GET(json('/api/clients'))).status).toBe(401);
    expect((await users.POST(json('/api/admin/users', { method: 'POST', body: {} }))).status).toBe(401);
  });

  it('un terapeuta no puede ver pacientes ni crear cuentas', async () => {
    const cookie = await cookieFor(carlaUser);
    expect((await clients.GET(json('/api/clients', { cookie }))).status).toBe(403);
    expect((await users.POST(json('/api/admin/users', { method: 'POST', body: {}, cookie }))).status).toBe(403);
  });

  it('el administrador ve todas las citas; el terapeuta solo las suyas', async () => {
    const adminRes = await appointments.GET(json('/api/appointments?therapistId=' + luis._id, { cookie: await cookieFor(admin) }));
    expect((await adminRes.json()).data).toHaveLength(1);
    const allRes = await appointments.GET(json('/api/appointments', { cookie: await cookieFor(admin) }));
    expect((await allRes.json()).data).toHaveLength(2);

    // Aunque pida las de Luis, recibe solo las propias.
    const res = await appointments.GET(json('/api/appointments?therapistId=' + luis._id, { cookie: await cookieFor(carlaUser) }));
    const { data } = await res.json();
    expect(data.map((a) => String(a._id))).toEqual([String(appointmentCarla._id)]);
  });

  it('el terapeuta cambia el estado solo de sus citas y solo a estados permitidos', async () => {
    const cookie = await cookieFor(carlaUser);
    const patch = (id, body) => appointments.PATCH(json(`/api/appointments?id=${id}`, { method: 'PATCH', body, cookie }));

    expect((await patch(appointmentCarla._id, { status: 'completed' })).status).toBe(200);
    expect((await Appointment.findById(appointmentCarla._id)).status).toBe('completed');

    expect((await patch(appointmentLuis._id, { status: 'completed' })).status).toBe(404);
    expect((await patch(appointmentCarla._id, { status: 'cancelled' })).status).toBe(403);
    expect((await patch(appointmentCarla._id, { status: 'confirmed', startTime: '10:00' })).status).toBe(403);
    expect((await appointments.DELETE(json(`/api/appointments?id=${appointmentCarla._id}`, { method: 'DELETE', cookie }))).status).toBe(403);
  });

  it('una cuenta desactivada pierde el acceso aunque su cookie no haya expirado', async () => {
    const cookie = await cookieFor(carlaUser);
    await User.updateOne({ _id: carlaUser._id }, { active: false });
    expect((await appointments.GET(json('/api/appointments', { cookie }))).status).toBe(401);
  });

  it('el listado público de terapeutas no expone email ni teléfono', async () => {
    const { data } = await (await therapistsGet(json('/api/therapists'))).json();
    expect(data[0]).not.toHaveProperty('email');
    expect(data[0]).not.toHaveProperty('phone');
  });
});

describe('/api/admin/users', () => {
  const create = async (body) => users.POST(json('/api/admin/users', { method: 'POST', body, cookie: await cookieFor(admin) }));

  it('crea una cuenta de terapeuta vinculada a su ficha, que luego puede entrar', async () => {
    const res = await create({ name: 'Luis Díaz', email: 'luis@aped.cl', password: PASSWORD, role: 'therapist', therapistId: String(luis._id) });
    expect(res.status).toBe(201);
    expect(await res.json()).not.toHaveProperty('data.password');

    const loginRes = await login(json('/api/auth/login', { method: 'POST', body: { email: 'luis@aped.cl', password: PASSWORD } }));
    expect((await loginRes.json()).data.redirect).toBe('/terapeuta');
  });

  it('valida los datos', async () => {
    const valid = { name: 'X', email: 'x@aped.cl', password: PASSWORD, role: 'admin' };
    expect((await create({ ...valid, password: 'corta' })).status).toBe(400);
    expect((await create({ ...valid, role: 'staff' })).status).toBe(400);
    expect((await create({ ...valid, email: 'admin@aped.cl' })).status).toBe(409);
    expect((await create({ ...valid, role: 'therapist' })).status).toBe(400);
    expect((await create({ ...valid, role: 'therapist', therapistId: String(carla._id) })).status).toBe(409);
  });

  it('desactiva cuentas y restablece contraseñas, pero no se desactiva a sí mismo', async () => {
    const cookie = await cookieFor(admin);
    const patch = (id, body) => users.PATCH(json(`/api/admin/users?id=${id}`, { method: 'PATCH', body, cookie }));

    expect((await patch(carlaUser._id, { active: false })).status).toBe(200);
    expect((await patch(admin._id, { active: false })).status).toBe(400);

    expect((await patch(carlaUser._id, { password: 'nueva-clave-segura', active: true })).status).toBe(200);
    const res = await login(json('/api/auth/login', { method: 'POST', body: { email: 'carla@aped.cl', password: 'nueva-clave-segura' } }));
    expect(res.status).toBe(200);
  });
});

describe('middleware', () => {
  const visit = (path, cookie) =>
    middleware(new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} }));

  it('sin sesión redirige al login con el destino', async () => {
    const res = await visit('/admin');
    expect(res.headers.get('location')).toBe('http://localhost/login?next=%2Fadmin');
  });

  it('con otro rol redirige al panel propio', async () => {
    const res = await visit('/admin', await cookieFor(carlaUser));
    expect(res.headers.get('location')).toBe('http://localhost/terapeuta');
  });

  it('con el rol correcto deja pasar', async () => {
    const res = await visit('/terapeuta', await cookieFor(carlaUser));
    expect(res.headers.get('location')).toBeNull();
  });
});

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
