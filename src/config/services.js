export const clinicalServices = [
  {
    id: 'terapia-ocupacional',
    slug: 'terapia-ocupacional',
    name: 'Terapia Ocupacional',
    description:
      'Mejora de habilidades funcionales y de vida diaria a través de actividades terapéuticas personalizadas.',
    shortDescription: 'Habilidades funcionales y vida diaria',
    icon: 'medical',
    schedule: { days: 'Lunes a Sábado', hours: '09:00 - 18:00' },
  },
  {
    id: 'fonoaudiologia',
    slug: 'fonoaudiologia',
    name: 'Fonoaudiología',
    description:
      'Evaluación y tratamiento de alteraciones del lenguaje, habla, voz y audición.',
    shortDescription: 'Lenguaje, habla, voz y audición',
    icon: 'speech',
    schedule: { days: 'Lunes a Sábado', hours: '09:00 - 18:00' },
  },
  {
    id: 'terapia-conductual',
    slug: 'terapia-conductual',
    name: 'Terapia Conductual',
    description:
      'Intervención conductual basada en evidencia para el manejo de comportamientos y habilidades adaptativas.',
    shortDescription: 'Manejo conductual y habilidades adaptativas',
    icon: 'behavior',
    schedule: { days: 'Lunes a Sábado', hours: '09:00 - 18:00' },
  },
  {
    id: 'psicologia',
    slug: 'psicologia',
    name: 'Psicología',
    description:
      'Atención psicológica integral para el bienestar emocional y cognitivo.',
    shortDescription: 'Bienestar emocional y cognitivo',
    icon: 'psychology',
    schedule: { days: 'Lunes a Sábado', hours: '09:00 - 18:00' },
  },
];

export const serviceSpecialties = clinicalServices.map((s) => s.id);
