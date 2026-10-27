import { describe, it, expect } from 'vitest';
import { todayYmd, minutesNow, addDays, weekday, addMinutes, formatDay, formatDayShort } from './agendaTime';

describe('agendaTime', () => {
  it('usa la hora de Santiago, no la UTC', () => {
    // 02:00 UTC del 3 de noviembre = 23:00 del 2 de noviembre en Santiago (UTC-3).
    const now = new Date('2026-11-03T02:00:00Z');
    expect(todayYmd(now)).toBe('2026-11-02');
    expect(minutesNow(now)).toBe(23 * 60);
  });

  it('suma días cruzando meses y años', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('calcula el día de la semana', () => {
    expect(weekday('2026-11-02')).toBe('monday');
    expect(weekday('2026-11-08')).toBe('sunday');
  });

  it('suma minutos a una hora', () => {
    expect(addMinutes('09:30', 30)).toBe('10:00');
    expect(addMinutes('16:45', 30)).toBe('17:15');
  });

  it('formatea fechas en español', () => {
    expect(formatDay('2026-11-03')).toBe('martes 3 de noviembre');
    expect(formatDayShort('2026-11-03')).toBe('Mar 3 nov');
  });
});
