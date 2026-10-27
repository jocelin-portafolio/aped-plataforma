import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleBooking, wantsBooking, pickOption } from './bookingFlow';

const SLOTS = [
  { therapistId: 't1', therapistName: 'Carla Soto', date: '2026-11-03', startTime: '09:00', endTime: '09:30' },
  { therapistId: 't1', therapistName: 'Carla Soto', date: '2026-11-03', startTime: '09:30', endTime: '10:00' },
  { therapistId: 't2', therapistName: 'Luis Díaz', date: '2026-11-03', startTime: '09:30', endTime: '10:00' },
  { therapistId: 't1', therapistName: 'Carla Soto', date: '2026-11-05', startTime: '15:00', endTime: '15:30' },
];

let deps;

beforeEach(() => {
  deps = {
    getAvailability: vi.fn(async () => SLOTS),
    bookAppointment: vi.fn(async (data) => ({
      ok: true,
      appointment: { id: 'a1', specialty: data.specialty, therapistName: 'Carla Soto', date: data.date, startTime: data.startTime },
    })),
  };
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Envía varios mensajes seguidos y devuelve la última respuesta.
async function chat(inputs, { state = null, context = {} } = {}) {
  let result;
  for (const input of inputs) {
    result = await handleBooking(input, state, context, deps);
    state = result.state;
  }
  return result;
}

describe('wantsBooking', () => {
  it.each([
    ['Quiero reservar una hora', true],
    ['¿Cómo reservo una hora?', true],
    ['kiero agendar fono', true],
    ['necesito una cita con psicología', true],
    ['¿Qué horario tienen?', false],
    ['¿A qué hora abren?', false],
    ['quiero cancelar mi hora', false],
    ['¿cuánto cuesta reservar?', false],
  ])('"%s" → %s', (text, expected) => {
    expect(wantsBooking(text)).toBe(expected);
  });
});

describe('pickOption', () => {
  const options = [
    { id: 'a', label: 'Mar 3 nov', match: ['martes'] },
    { id: 'b', label: '09:30', match: ['09:30', '0930'] },
  ];
  it('reconoce id, número, texto del botón y palabras clave', () => {
    expect(pickOption('a', options).id).toBe('a');
    expect(pickOption('2', options).id).toBe('b');
    expect(pickOption('mar 3 NOV', options).id).toBe('a');
    expect(pickOption('el martes', options).id).toBe('a');
    expect(pickOption('0930', options).id).toBe('b');
    expect(pickOption('jueves', options)).toBeNull();
  });
});

describe('reserva completa', () => {
  it('pregunta especialidad, día, hora y datos, y reserva', async () => {
    let r = await chat(['Quiero reservar una hora']);
    expect(r.reply).toContain('especialidad');
    expect(r.options.map((o) => o.label)).toEqual(['Terapia Ocupacional', 'Fonoaudiología', 'Psicología']);

    r = await chat(['Fonoaudiología'], { state: r.state });
    expect(deps.getAvailability).toHaveBeenCalledWith('fonoaudiologia');
    expect(r.options.map((o) => o.id)).toEqual(['day:2026-11-03', 'day:2026-11-05']);
    expect(r.options[0]).toMatchObject({ label: 'Mar 3 nov', description: '3 horas libres' });

    r = await chat(['martes'], { state: r.state });
    expect(r.reply).toContain('martes 3 de noviembre');
    expect(r.options.map((o) => `${o.label} ${o.description ?? ''}`.trim())).toEqual([
      '09:00 con Carla Soto',
      '09:30 con Carla Soto',
      '09:30 con Luis Díaz',
      'Otro día',
    ]);

    r = await chat(['3', 'Ana María Pérez', '25/03/2015', 'Ana@Example.com', '9 1234 5678'], { state: r.state });
    expect(r.reply).toContain('Profesional: Luis Díaz');
    expect(r.reply).toContain('Paciente: Ana María Pérez');
    expect(r.reply).toContain('Teléfono: +56912345678');
    expect(r.options.map((o) => o.id)).toEqual(['confirm', 'change', 'cancel']);

    r = await chat(['Confirmar reserva'], { state: r.state, context: { source: 'chat web' } });
    expect(deps.bookAppointment).toHaveBeenCalledWith({
      specialty: 'fonoaudiologia',
      therapistId: 't2',
      date: '2026-11-03',
      startTime: '09:30',
      source: 'chat web',
      patient: {
        firstName: 'Ana',
        lastName: 'María Pérez',
        dateOfBirth: '2015-03-25',
        email: 'ana@example.com',
        phone: '+56912345678',
      },
    });
    expect(r.reply).toContain('quedó reservada para el martes 3 de noviembre a las 09:30');
    expect(r.state).toBeNull();
  });

  it('si escribe una hora en que atienden dos profesionales, pregunta con quién', async () => {
    let r = await chat(['reservar fono', '1', '09:30']);
    expect(r.reply).toContain('atienden Carla Soto y Luis Díaz');
    expect(r.state.step).toBe('time');

    r = await chat(['slot:t2:09:30'], { state: r.state });
    expect(r.state.slot.therapistName).toBe('Luis Díaz');
  });

  it('el id del botón distingue horas con el mismo texto', async () => {
    const r = await chat(['reservar fono', '1', 'slot:t2:09:30']);
    expect(r.state.slot).toMatchObject({ therapistId: 't2', startTime: '09:30' });
  });

  it('salta la pregunta de especialidad si viene en el mensaje', async () => {
    const r = await chat(['kiero agendar hora de fono']);
    expect(deps.getAvailability).toHaveBeenCalledWith('fonoaudiologia');
    expect(r.state.step).toBe('day');
  });

  it('en WhatsApp usa el número de la conversación y no pregunta el teléfono', async () => {
    const r = await chat(['reservar psicología', '1', '1', 'Ana Pérez', '25-03-2015', 'ana@example.com'], {
      context: { phone: '+56987654321' },
    });
    expect(r.state.step).toBe('confirm');
    expect(r.reply).toContain('Teléfono: +56987654321');
  });

  it('vuelve a pedir datos que no son válidos', async () => {
    let r = await chat(['reservar fono', '1', '1', 'Ana']);
    expect(r.reply).toContain('al menos un apellido');
    r = await chat(['Ana Pérez', '31-02-2015'], { state: r.state });
    expect(r.reply).toContain('No entendí la fecha');
    r = await chat(['25-03-2015', 'ana@'], { state: r.state });
    expect(r.reply).toContain('no parece válido');
    expect(r.state.step).toBe('email');
  });

  it('muestra horarios por páginas', async () => {
    deps.getAvailability.mockResolvedValue(
      Array.from({ length: 11 }, (_, i) => ({
        therapistId: 't1',
        therapistName: 'Carla Soto',
        date: '2026-11-03',
        startTime: `${String(9 + i).padStart(2, '0')}:00`,
      }))
    );
    let r = await chat(['reservar fono', '1']);
    expect(r.options.map((o) => o.label)).toContain('Más horarios');
    r = await chat(['Más horarios'], { state: r.state });
    expect(r.options.map((o) => o.label)).toEqual(['17:00', '18:00', '19:00', 'Otro día']);
  });

  it('si la hora se tomó mientras tanto, ofrece las horas actualizadas', async () => {
    deps.bookAppointment.mockResolvedValue({ ok: false, reason: 'taken', message: 'x' });
    const r = await chat(['reservar fono', '1', '1', 'Ana Pérez', '25-03-2015', 'ana@example.com', '+56912345678', 'Confirmar reserva']);
    expect(r.reply).toContain('se acaba de tomar');
    expect(r.state.step).toBe('time');
  });

  it('avisa cuando no hay horas libres', async () => {
    deps.getAvailability.mockResolvedValue([]);
    const r = await chat(['reservar psicología']);
    expect(r.reply).toContain('no hay horas libres de Psicología');
    expect(r.state).toBeNull();
  });

  it('se puede cancelar en cualquier momento', async () => {
    const r = await chat(['reservar fono', '1', 'cancelar']);
    expect(r.reply).toContain('cancelé la reserva');
    expect(r.state).toBeNull();
  });

  it('si la agenda falla, deriva a WhatsApp', async () => {
    deps.getAvailability.mockRejectedValue(new Error('sin conexión'));
    const r = await chat(['reservar fono']);
    expect(r.reply).toContain('No pude consultar la agenda');
    expect(r.state).toBeNull();
  });
});
