import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { startMongo, stopMongo, clearMongo, weeklySchedule } from '@/test/mongo';
import Therapist from '@/models/Therapist';
import Appointment from '@/models/Appointment';
import Client from '@/models/Client';
import ChatSession from '@/models/ChatSession';
import { GET, POST } from './route';

const SECRET = 'app-secret-de-prueba';
const FROM = '56987654321';
let sent;
let counter = 0;

beforeAll(startMongo);
afterAll(stopMongo);

beforeEach(async () => {
  await clearMongo();
  vi.stubEnv('WHATSAPP_APP_SECRET', SECRET);
  vi.stubEnv('WHATSAPP_TOKEN', 'token-de-prueba');
  vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', '1234567890');
  vi.stubEnv('WHATSAPP_VERIFY_TOKEN', 'verificar');
  vi.stubEnv('ANTHROPIC_API_KEY', '');

  // Simula la API de Meta y guarda lo que el bot envía.
  sent = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, init) => {
      sent.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
      return new Response(JSON.stringify({ messages: [{ id: 'wamid.out' }] }), { status: 200 });
    })
  );

  await Therapist.create({
    firstName: 'Carla',
    lastName: 'Soto',
    email: 'carla@aped.cl',
    phone: '+56911111111',
    specialties: ['fonoaudiologia'],
    // Todos los días, a última hora, para que siempre haya horas futuras.
    schedule: weeklySchedule(
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      ['23:00', '23:30']
    ),
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function webhook(message, { secret = SECRET } = {}) {
  const body = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              contacts: [{ wa_id: FROM, profile: { name: 'Ana' } }],
              messages: [{ id: message.id ?? `wamid.${++counter}`, from: FROM, ...message }],
            },
          },
        ],
      },
    ],
  });
  const signature = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  return new Request('http://localhost/api/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature },
    body,
  });
}

const text = (body, extra) => webhook({ type: 'text', text: { body }, ...extra });
const tap = (id, title) =>
  webhook({ type: 'interactive', interactive: { type: 'list_reply', list_reply: { id, title } } });

function lastSent() {
  return sent[sent.length - 1].body;
}

describe('GET /api/whatsapp (verificación del webhook)', () => {
  it('devuelve el challenge con el token correcto', async () => {
    const res = await GET(
      new Request('http://localhost/api/whatsapp?hub.mode=subscribe&hub.verify_token=verificar&hub.challenge=123')
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('123');
  });

  it('rechaza un token incorrecto', async () => {
    const res = await GET(
      new Request('http://localhost/api/whatsapp?hub.mode=subscribe&hub.verify_token=otro&hub.challenge=123')
    );
    expect(res.status).toBe(403);
  });
});

describe('POST /api/whatsapp', () => {
  it('rechaza mensajes sin firma válida y no responde', async () => {
    const res = await POST(webhook({ type: 'text', text: { body: 'hola' } }, { secret: 'falso' }));
    expect(res.status).toBe(401);
    expect(sent).toHaveLength(0);
  });

  it('responde 503 si faltan las credenciales', async () => {
    vi.stubEnv('WHATSAPP_TOKEN', '');
    expect((await POST(text('hola'))).status).toBe(503);
  });

  it('responde preguntas frecuentes con opciones en una lista', async () => {
    const res = await POST(text('¿dónde están?'));
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe('https://graph.facebook.com/v23.0/1234567890/messages');
    expect(sent[0].auth).toBe('Bearer token-de-prueba');
    expect(lastSent().to).toBe(FROM);
    expect(lastSent().interactive.body.text).toContain('La Capitanía #2516');
  });

  it('responde una sola vez aunque Meta reenvíe el mismo mensaje', async () => {
    await POST(text('hola', { id: 'wamid.repetido' }));
    await POST(text('hola', { id: 'wamid.repetido' }));
    expect(sent).toHaveLength(1);
  });

  it('pide texto cuando llega una imagen o un audio', async () => {
    await POST(webhook({ type: 'audio', audio: {} }));
    expect(lastSent().text.body).toContain('solo puedo leer mensajes de texto');
  });

  it('agenda una hora completa por WhatsApp contra la agenda real', async () => {
    await POST(text('Hola, quiero reservar una hora de fono'));
    let msg = lastSent();
    expect(msg.interactive.type).toBe('list');
    const day = msg.interactive.action.sections[0].rows[0];
    expect(day.id).toMatch(/^day:\d{4}-\d{2}-\d{2}$/);

    await POST(tap(day.id, day.title));
    msg = lastSent();
    const slot = msg.interactive.action.sections[0].rows[0];
    expect(slot.description).toBe('con Carla Soto');

    await POST(tap(slot.id, slot.title));
    await POST(text('Ana Pérez'));
    await POST(text('25-03-2015'));
    await POST(text('ana@example.com'));
    msg = lastSent();
    // El teléfono se toma del número de WhatsApp.
    expect(msg.interactive.body.text).toContain('Teléfono: +56987654321');
    expect(msg.interactive.type).toBe('button');

    await POST(webhook({ type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'confirm', title: 'Confirmar reserva' } } }));
    expect(lastSent().text.body).toContain('quedó reservada');

    const appointment = await Appointment.findOne().lean();
    expect(appointment).toMatchObject({
      specialty: 'fonoaudiologia',
      startTime: slot.title,
      notes: 'Reservada por WhatsApp',
    });
    expect(appointment.date.toISOString().slice(0, 10)).toBe(day.id.slice(4));
    expect(await Client.findOne({ email: 'ana@example.com' }).lean()).toMatchObject({ phone: '+56987654321' });

    const session = await ChatSession.findOne({ key: `whatsapp:${FROM}` }).lean();
    expect(session.booking).toBeNull();
    expect(session.history.at(-1).content).toContain('quedó reservada');
  });

  it('si falla el envío a Meta igual responde 200 para que no reintente', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockResolvedValueOnce(new Response('error', { status: 500 }));
    const res = await POST(text('hola'));
    expect(res.status).toBe(200);
    expect(console.error).toHaveBeenCalled();
  });
});
