// Agenda en tiempo real: cruza el horario semanal de cada terapeuta con las
// citas ya tomadas, y reserva bloques evitando dobles reservas.
import { connectDB } from '@/config/db';
import { bookingConfig } from '@/config/booking';
import Appointment from '@/models/Appointment';
import Client from '@/models/Client';
import Therapist from '@/models/Therapist';
import { validateEmail, validatePhone, validateTime } from '@/lib/validators';
import {
  todayYmd,
  minutesNow,
  ymdToDate,
  dateToYmd,
  addDays,
  weekday,
  timeToMinutes,
  addMinutes,
} from '@/lib/agendaTime';

const ACTIVE_STATUSES = { $nin: ['cancelled'] };

function slotKey(therapistId, ymd, startTime) {
  return `${therapistId}|${ymd}|${startTime}`;
}

/**
 * Bloques libres de una especialidad, ordenados por fecha y hora:
 * [{ therapistId, therapistName, date: 'YYYY-MM-DD', startTime, endTime }]
 */
export async function getAvailability(specialty, { now = new Date(), therapistId } = {}) {
  if (!bookingConfig.specialties.includes(specialty)) return [];
  await connectDB();

  const filter = { active: true, specialties: specialty };
  if (therapistId) filter._id = therapistId;
  const therapists = await Therapist.find(filter).lean();
  if (!therapists.length) return [];

  const today = todayYmd(now);
  const earliestToday = minutesNow(now) + bookingConfig.leadMinutes;

  const booked = await Appointment.find({
    therapistId: { $in: therapists.map((t) => t._id) },
    date: { $gte: ymdToDate(today), $lt: ymdToDate(addDays(today, bookingConfig.daysAhead)) },
    status: ACTIVE_STATUSES,
  })
    .select('therapistId date startTime')
    .lean();
  const taken = new Set(booked.map((a) => slotKey(a.therapistId, dateToYmd(a.date), a.startTime)));

  const slots = [];
  for (let i = 0; i < bookingConfig.daysAhead; i++) {
    const date = addDays(today, i);
    const day = weekday(date);

    for (const t of therapists) {
      const schedule = t.schedule?.[day];
      if (!schedule?.available) continue;
      const times = schedule.slots?.length ? schedule.slots : bookingConfig.defaultSlots;

      for (const startTime of times) {
        if (i === 0 && timeToMinutes(startTime) < earliestToday) continue;
        if (taken.has(slotKey(t._id, date, startTime))) continue;
        slots.push({
          therapistId: String(t._id),
          therapistName: `${t.firstName} ${t.lastName}`,
          date,
          startTime,
          endTime: addMinutes(startTime, bookingConfig.sessionMinutes),
        });
      }
    }
  }

  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

export function validatePatient(patient = {}) {
  const errors = [];
  if (!patient.firstName?.trim() || !patient.lastName?.trim()) errors.push('nombre y apellido');
  const dob = new Date(patient.dateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob > new Date()) errors.push('fecha de nacimiento');
  if (!validateEmail(patient.email || '')) errors.push('email');
  if (!validatePhone(patient.phone || '')) errors.push('teléfono');
  return errors;
}

async function findOrCreateClient(patient) {
  const email = patient.email.trim().toLowerCase();
  const existing = await Client.findOne({ email });
  if (existing) {
    const same =
      existing.firstName.toLowerCase() === patient.firstName.trim().toLowerCase() &&
      existing.lastName.toLowerCase() === patient.lastName.trim().toLowerCase();
    return same ? existing : null;
  }
  return Client.create({
    firstName: patient.firstName.trim(),
    lastName: patient.lastName.trim(),
    email,
    phone: patient.phone,
    dateOfBirth: patient.dateOfBirth,
  });
}

/**
 * Reserva un bloque. Devuelve { ok: true, appointment } o
 * { ok: false, reason: 'taken' | 'invalid' | 'email-in-use', message }.
 */
export async function bookAppointment({
  specialty,
  therapistId,
  date,
  startTime,
  patient,
  source = 'chat',
  now = new Date(),
}) {
  const errors = validatePatient(patient);
  if (!bookingConfig.specialties.includes(specialty)) errors.push('especialidad');
  if (!validateTime(startTime || '')) errors.push('hora');
  if (errors.length) {
    return { ok: false, reason: 'invalid', message: `Faltan o no son válidos: ${errors.join(', ')}.` };
  }

  // La hora debe seguir libre según la agenda actual (horario, citas y anticipación).
  const available = await getAvailability(specialty, { therapistId, now });
  const slot = available.find((s) => s.date === date && s.startTime === startTime);
  if (!slot) {
    return { ok: false, reason: 'taken', message: 'Esa hora ya no está disponible.' };
  }

  const client = await findOrCreateClient(patient);
  if (!client) {
    return {
      ok: false,
      reason: 'email-in-use',
      message: 'Ese email ya está registrado con otro paciente.',
    };
  }

  const appointment = await Appointment.create({
    clientId: client._id,
    therapistId,
    specialty,
    date: ymdToDate(date),
    startTime,
    endTime: slot.endTime,
    status: 'scheduled',
    notes: `Reservada por ${source}`,
  });

  // Si dos personas reservaron el mismo bloque a la vez, gana la primera cita creada.
  const sameSlot = await Appointment.find({
    therapistId,
    date: ymdToDate(date),
    startTime,
    status: ACTIVE_STATUSES,
  })
    .sort({ _id: 1 })
    .select('_id')
    .lean();
  if (String(sameSlot[0]._id) !== String(appointment._id)) {
    await Appointment.deleteOne({ _id: appointment._id });
    return { ok: false, reason: 'taken', message: 'Esa hora se acaba de reservar.' };
  }

  return {
    ok: true,
    appointment: {
      id: String(appointment._id),
      specialty,
      therapistName: slot.therapistName,
      date,
      startTime,
      endTime: slot.endTime,
    },
  };
}
