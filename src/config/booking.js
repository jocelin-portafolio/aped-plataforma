// Reservas de horas desde el chat (web y WhatsApp).
export const bookingConfig = {
  // Especialidades que se pueden agendar por chat.
  specialties: ['terapia-ocupacional', 'fonoaudiologia', 'psicologia'],
  timeZone: 'America/Santiago',
  // Días hacia adelante en que se buscan horas libres.
  daysAhead: 14,
  sessionMinutes: 30,
  // Anticipación mínima para reservar una hora del mismo día.
  leadMinutes: 60,
  // Bloques por defecto si un terapeuta atiende un día pero no definió horas.
  defaultSlots: [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  ],
  maxDaysShown: 8,
  maxTimesShown: 8,
};
