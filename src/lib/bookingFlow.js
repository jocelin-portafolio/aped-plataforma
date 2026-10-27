// Conversación guiada para reservar una hora. Es la misma para el chat web y
// WhatsApp: recibe el mensaje y el estado actual, y devuelve la respuesta, las
// opciones a mostrar como botones y el nuevo estado (null = terminó).
import { bookingConfig } from '@/config/booking';
import { clinicalServices } from '@/config/services';
import { contact } from '@/config/navigation';
import { normalize, keywordScore } from '@/lib/textMatch';
import { formatDay, formatDayShort } from '@/lib/agendaTime';
import * as agenda from '@/lib/booking';

const whatsapp = `WhatsApp al ${contact.phone.display}`;

const SPECIALTY_KEYWORDS = {
  'terapia-ocupacional': ['terapia ocupacional', 'ocupacional', 'to'],
  fonoaudiologia: ['fonoaudiolog', 'fono', 'lenguaje', 'habla'],
  psicologia: ['psicolog', 'sicolog', 'psico'],
};

// "hora" sola no basta ("¿a qué hora abren?"), por eso va en frases.
const BOOKING_KEYWORDS = ['reserv', 'agend', 'cita', 'turno', 'una hora', 'pedir hora', 'tomar hora', 'sacar hora'];
const EXIT_KEYWORDS = ['cancelar', 'salir', 'terminar', 'no quiero', 'menu'];

const OPTION = {
  confirm: { id: 'confirm', label: 'Confirmar reserva' },
  change: { id: 'change', label: 'Cambiar hora' },
  cancel: { id: 'cancel', label: 'Cancelar' },
  otherDay: { id: 'other-day', label: 'Otro día' },
  moreTimes: { id: 'more-times', label: 'Más horarios' },
};

function words(text) {
  return normalize(text).split(' ').filter(Boolean);
}

function hasAny(keywords, text) {
  const norm = normalize(text);
  const ws = words(text);
  return keywords.some((k) => keywordScore(normalize(k), ws, norm) > 0);
}

function specialtyName(id) {
  return clinicalServices.find((s) => s.id === id)?.name ?? id;
}

function detectSpecialty(text) {
  const norm = normalize(text);
  const ws = words(text);
  for (const [id, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
    // "to" es corto: solo cuenta como palabra completa.
    const hit = keywords.some((k) => (k.length <= 2 ? ws.includes(k) : keywordScore(k, ws, norm) === 2));
    if (hit) return id;
  }
  return null;
}

/** ¿El mensaje pide reservar una hora? */
export function wantsBooking(text) {
  return hasAny(BOOKING_KEYWORDS, text) && !hasAny(['cancel', 'anular', 'cambiar', 'reagend', 'precio', 'cuesta', 'valor'], text);
}

/**
 * Busca qué opción eligió la persona: por id (botones de WhatsApp), por número
 * ("2"), por el texto del botón o por palabras clave de la opción.
 */
export function pickOption(input, options) {
  const text = normalize(input);
  if (!text) return null;

  const byId = options.find((o) => o.id === input);
  if (byId) return byId;

  if (/^\d{1,2}$/.test(text) && options[Number(text) - 1]) return options[Number(text) - 1];

  const byLabel = options.find((o) => normalize(o.label) === text);
  if (byLabel) return byLabel;

  return options.find((o) => (o.match || []).some((m) => text === m || text.includes(m))) || null;
}

function specialtyOptions() {
  return bookingConfig.specialties.map((id) => ({
    id: `spec:${id}`,
    label: specialtyName(id),
    value: id,
    match: SPECIALTY_KEYWORDS[id].filter((k) => k.length > 2),
  }));
}

function dayOptions(slots) {
  const days = [...new Set(slots.map((s) => s.date))].slice(0, bookingConfig.maxDaysShown);
  return days.map((date) => {
    const label = formatDayShort(date);
    const [weekdayName, dayNumber] = normalize(formatDay(date)).split(' ');
    return {
      id: `day:${date}`,
      label,
      description: `${slots.filter((s) => s.date === date).length} horas libres`,
      value: date,
      match: [normalize(label), weekdayName, `${weekdayName} ${dayNumber}`, date],
    };
  });
}

function timeOptions(slots, date, page = 0) {
  const daySlots = slots.filter((s) => s.date === date);
  const start = page * bookingConfig.maxTimesShown;
  const shown = daySlots.slice(start, start + bookingConfig.maxTimesShown);
  const options = shown.map((s) => ({
    id: `slot:${s.therapistId}:${s.startTime}`,
    label: s.startTime,
    description: `con ${s.therapistName}`,
    value: s,
    match: [normalize(s.startTime), s.startTime.replace(':', '')],
  }));
  if (daySlots.length > start + shown.length) options.push(OPTION.moreTimes);
  options.push(OPTION.otherDay);
  return options;
}

function confirmOptions() {
  return [OPTION.confirm, OPTION.change, OPTION.cancel];
}

// Las opciones se guardan en el estado para reconocer la respuesta siguiente.
function reply(text, state, options = []) {
  return {
    reply: text,
    options: options.map(({ id, label, description }) => ({ id, label, ...(description && { description }) })),
    state: state && { ...state, options },
  };
}

function summary(state) {
  const { slot, patient } = state;
  return [
    `Especialidad: ${specialtyName(state.specialty)}`,
    `Día: ${formatDay(slot.date)}, a las ${slot.startTime}`,
    `Profesional: ${slot.therapistName}`,
    `Paciente: ${patient.firstName} ${patient.lastName}`,
    `Email: ${patient.email}`,
    `Teléfono: ${patient.phone}`,
  ].join('\n');
}

function parseBirthDate(text) {
  const m = text.trim().match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  const valid =
    date.getUTCDate() === d &&
    date.getUTCMonth() === mo - 1 &&
    date <= new Date() &&
    y > new Date().getUTCFullYear() - 120;
  return valid ? date.toISOString().slice(0, 10) : null;
}

function normalizePhone(text) {
  const digits = text.replace(/[^\d+]/g, '');
  if (/^9\d{8}$/.test(digits)) return `+56${digits}`;
  if (/^569\d{8}$/.test(digits)) return `+${digits}`;
  return /^\+?\d{8,15}$/.test(digits) ? digits : null;
}

async function askDay(state, deps, intro = '') {
  const slots = await deps.getAvailability(state.specialty);
  const name = specialtyName(state.specialty);
  if (!slots.length) {
    return reply(
      `${intro}Por ahora no hay horas libres de ${name} en los próximos ${bookingConfig.daysAhead} días. Escríbenos por ${whatsapp} y te avisamos cuando se libere una.`,
      null
    );
  }
  return reply(
    `${intro}Estos son los días con horas libres de ${name}. ¿Qué día te acomoda?`,
    { ...state, step: 'day', date: null, page: 0 },
    dayOptions(slots)
  );
}

async function askTime(state, deps, intro = '') {
  const slots = await deps.getAvailability(state.specialty);
  if (!slots.some((s) => s.date === state.date)) {
    return askDay(state, deps, `${intro}Ya no quedan horas libres el ${formatDay(state.date)}. `);
  }
  return reply(
    `${intro}Horas libres el ${formatDay(state.date)}. ¿Cuál prefieres?`,
    { ...state, step: 'time' },
    timeOptions(slots, state.date, state.page)
  );
}

function askNext(state) {
  const p = state.patient;
  if (!p.firstName) return reply('¿Cuál es el nombre y apellido del paciente?', { ...state, step: 'name' });
  if (!p.dateOfBirth)
    return reply('¿Cuál es su fecha de nacimiento? (por ejemplo 25-03-2015)', { ...state, step: 'birth' });
  if (!p.email) return reply('¿Cuál es tu email de contacto?', { ...state, step: 'email' });
  if (!p.phone) return reply('¿Un teléfono de contacto?', { ...state, step: 'phone' });
  return reply(`Revisa los datos de la reserva:\n\n${summary(state)}\n\n¿Confirmo la hora?`, { ...state, step: 'confirm' }, confirmOptions());
}

/** Inicia la conversación de reserva. `context.phone` se usa en WhatsApp. */
export async function startBooking(text, context = {}, deps = agenda) {
  const state = {
    step: 'specialty',
    specialty: detectSpecialty(text),
    patient: context.phone ? { phone: context.phone } : {},
  };
  if (state.specialty) return askDay(state, deps);
  return reply('¡Te ayudo a reservar una hora! ¿Para qué especialidad?', state, specialtyOptions());
}

/** Avanza un paso de la conversación de reserva. */
export async function continueBooking(input, state, deps = agenda) {
  const options = state.options || [];
  const chosen = pickOption(input, options);

  if (chosen?.id === OPTION.cancel.id || (!chosen && hasAny(EXIT_KEYWORDS, input))) {
    return reply('Listo, cancelé la reserva. Si necesitas algo más, aquí estoy.', null);
  }

  switch (state.step) {
    case 'specialty': {
      const specialty = chosen?.value ?? detectSpecialty(input);
      if (!specialty) return reply('Elige una de estas especialidades:', state, specialtyOptions());
      return askDay({ ...state, specialty }, deps);
    }

    case 'day': {
      if (!chosen) return reply('Elige uno de los días de la lista:', state, options);
      return askTime({ ...state, date: chosen.value, page: 0 }, deps);
    }

    case 'time': {
      if (chosen?.id === OPTION.moreTimes.id) return askTime({ ...state, page: state.page + 1 }, deps);
      if (chosen?.id === OPTION.otherDay.id) return askDay(state, deps);
      if (!chosen) return reply('Elige una de las horas de la lista:', state, options);
      // Si escribió una hora en que atienden varias personas, pregunta con quién.
      const sameTime = options.filter((o) => o.value && o.label === chosen.label);
      const typedTime = chosen.id !== input && !/^\d{1,2}$/.test(input.trim());
      if (typedTime && sameTime.length > 1) {
        const names = sameTime.map((o) => o.value.therapistName).join(' y ');
        return reply(`A las ${chosen.label} atienden ${names}. ¿Con quién prefieres?`, state, [
          ...sameTime,
          OPTION.otherDay,
        ]);
      }
      return askNext({ ...state, slot: chosen.value });
    }

    case 'name': {
      const parts = input.trim().split(/\s+/).filter((p) => /\p{L}/u.test(p));
      if (parts.length < 2) return reply('Necesito el nombre y al menos un apellido, por ejemplo: Ana Pérez.', state);
      const [firstName, ...rest] = parts;
      return askNext({ ...state, patient: { ...state.patient, firstName, lastName: rest.join(' ') } });
    }

    case 'birth': {
      const dateOfBirth = parseBirthDate(input);
      if (!dateOfBirth) return reply('No entendí la fecha. Escríbela como día-mes-año, por ejemplo 25-03-2015.', state);
      return askNext({ ...state, patient: { ...state.patient, dateOfBirth } });
    }

    case 'email': {
      const email = input.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply('Ese email no parece válido. ¿Me lo escribes de nuevo?', state);
      return askNext({ ...state, patient: { ...state.patient, email } });
    }

    case 'phone': {
      const phone = normalizePhone(input);
      if (!phone) return reply('Ese teléfono no parece válido. Escríbelo así: +56 9 1234 5678.', state);
      return askNext({ ...state, patient: { ...state.patient, phone } });
    }

    case 'confirm': {
      if (chosen?.id === OPTION.change.id) return askTime({ ...state, page: 0 }, deps);
      if (chosen?.id !== OPTION.confirm.id) return reply('¿Confirmo la hora?', state, confirmOptions());

      const result = await deps.bookAppointment({
        specialty: state.specialty,
        therapistId: state.slot.therapistId,
        date: state.slot.date,
        startTime: state.slot.startTime,
        patient: state.patient,
        source: state.source || 'chat',
      });

      if (result.ok) {
        const a = result.appointment;
        return reply(
          `¡Listo! Tu hora de ${specialtyName(a.specialty)} quedó reservada para el ${formatDay(a.date)} a las ${a.startTime}, con ${a.therapistName}, en ${contact.address.full}. Si necesitas cambiarla o cancelarla, escríbenos por ${whatsapp}.`,
          null
        );
      }
      if (result.reason === 'taken') {
        return askTime({ ...state, page: 0 }, deps, 'Lo siento, esa hora se acaba de tomar. ');
      }
      if (result.reason === 'email-in-use') {
        return reply(
          `Ese email ya está registrado con otro paciente. Escribe otro email, o contáctanos por ${whatsapp}.`,
          { ...state, step: 'email', patient: { ...state.patient, email: null } }
        );
      }
      return reply(`No pude completar la reserva: ${result.message} Escríbenos por ${whatsapp}.`, null);
    }

    default:
      return reply('Empecemos de nuevo.', null);
  }
}

/** Punto de entrada: continúa una reserva en curso o inicia una nueva. */
export async function handleBooking(text, state, context = {}, deps = agenda) {
  try {
    if (state) return await continueBooking(text, { ...state, source: context.source }, deps);
    return await startBooking(text, context, deps);
  } catch (err) {
    console.error('[booking]', err);
    return reply(`No pude consultar la agenda en este momento. Intenta más tarde o escríbenos por ${whatsapp}.`, null);
  }
}
