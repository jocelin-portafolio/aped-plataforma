// Datos para los paneles de administrador y terapeuta.
import { connectDB } from '@/config/db';
import Appointment from '@/models/Appointment';
import Therapist from '@/models/Therapist';
import User from '@/models/User';
import { clinicalServices } from '@/config/services';
import { todayYmd, addDays, ymdToDate, dateToYmd } from '@/lib/agendaTime';

export const STATUS_LABELS = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  'no-show': 'No asistió',
};

export function specialtyName(id) {
  return clinicalServices.find((s) => s.id === id)?.name ?? id;
}

/** Citas desde hoy hasta `days` días, con paciente y terapeuta. */
export async function upcomingAppointments({ therapistId, days = 30, now = new Date() } = {}) {
  await connectDB();
  const today = todayYmd(now);
  const filter = { date: { $gte: ymdToDate(today), $lt: ymdToDate(addDays(today, days)) } };
  if (therapistId) filter.therapistId = therapistId;

  const appointments = await Appointment.find(filter)
    .populate('clientId', 'firstName lastName phone email dateOfBirth')
    .populate('therapistId', 'firstName lastName')
    .sort({ date: 1, startTime: 1 })
    .lean();

  return appointments.map((a) => ({
    id: String(a._id),
    date: dateToYmd(a.date),
    startTime: a.startTime,
    endTime: a.endTime,
    specialty: specialtyName(a.specialty),
    status: a.status,
    notes: a.notes ?? '',
    therapist: a.therapistId ? `${a.therapistId.firstName} ${a.therapistId.lastName}` : '—',
    patient: a.clientId
      ? {
          name: `${a.clientId.firstName} ${a.clientId.lastName}`,
          phone: a.clientId.phone,
          email: a.clientId.email,
          dateOfBirth: a.clientId.dateOfBirth ? dateToYmd(a.clientId.dateOfBirth) : null,
        }
      : null,
  }));
}

export async function listTherapists() {
  await connectDB();
  const therapists = await Therapist.find().sort({ lastName: 1 }).lean();
  return therapists.map((t) => ({
    id: String(t._id),
    name: `${t.firstName} ${t.lastName}`,
    specialties: t.specialties.map(specialtyName),
    active: t.active,
  }));
}

export async function listUsers() {
  await connectDB();
  const users = await User.find({ role: { $in: ['admin', 'therapist'] } })
    .populate('therapistId', 'firstName lastName')
    .sort({ role: 1, name: 1 })
    .lean();
  return users.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    therapistId: u.therapistId ? String(u.therapistId._id) : null,
    therapist: u.therapistId ? `${u.therapistId.firstName} ${u.therapistId.lastName}` : null,
  }));
}

export async function therapistProfile(therapistId) {
  await connectDB();
  const t = await Therapist.findById(therapistId).lean();
  if (!t) return null;
  return {
    name: `${t.firstName} ${t.lastName}`,
    specialties: t.specialties.map(specialtyName),
    schedule: t.schedule,
  };
}
