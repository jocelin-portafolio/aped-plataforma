// Fechas de la agenda como texto 'YYYY-MM-DD' en la zona horaria de APED.
// En la base de datos un día se guarda como medianoche UTC de esa fecha.
import { bookingConfig } from '@/config/booking';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function zonedParts(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: bookingConfig.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

export function todayYmd(now = new Date()) {
  const p = zonedParts(now);
  return `${p.year}-${p.month}-${p.day}`;
}

export function minutesNow(now = new Date()) {
  const p = zonedParts(now);
  return Number(p.hour) * 60 + Number(p.minute);
}

export function ymdToDate(ymd) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function dateToYmd(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function addDays(ymd, days) {
  const d = ymdToDate(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return dateToYmd(d);
}

export function weekday(ymd) {
  return WEEKDAYS[ymdToDate(ymd).getUTCDay()];
}

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function addMinutes(time, minutes) {
  const total = timeToMinutes(time) + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// "martes 4 de noviembre"
export function formatDay(ymd) {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(ymdToDate(ymd))
    .replace(',', '');
}

// "Mar 4 nov" (cabe en los botones de WhatsApp)
export function formatDayShort(ymd) {
  const label = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(ymdToDate(ymd))
    .replace(/[.,]/g, '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}
