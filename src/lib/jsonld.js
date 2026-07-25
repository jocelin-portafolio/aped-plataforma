const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://aped.org';

export function homeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: 'APED - Agrupación Personas Empoderadas por la Discapacidad',
    description:
      'Organización comunitaria que ofrece servicios clínicos de terapia ocupacional, fonoaudiología, terapia conductual, psicología y talleres grupales de habilidades sociales, arteterapia, cocina y motricidad para personas con discapacidad.',
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.jpeg`,
    sameAs: ['https://www.instagram.com/aped_chile/'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'La Capitanía #2516',
      addressLocality: 'Maipú',
      addressRegion: 'Santiago',
      addressCountry: 'CL',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+56934394294',
      availableLanguage: 'Spanish',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Chile',
    },
    knowsAbout: [
      'Terapia Ocupacional',
      'Fonoaudiología',
      'Terapia Conductual',
      'Psicología',
      'Talleres de Habilidades Sociales',
      'Arteterapia',
      'Terapia de Motricidad',
      'Discapacidad',
      'Inclusión',
    ],
    nonprofitType: 'NGO',
    mission: 'Empoderar a personas con discapacidad a través de servicios clínicos especializados y talleres grupales.',
  };
}

export function clinicalServicesJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: 'APED - Servicios Clínicos',
    description:
      'Servicios clínicos especializados: Terapia Ocupacional, Fonoaudiología, Terapia Conductual y Psicología. Atención personalizada de lunes a sábado.',
    url: `${BASE_URL}/servicios-clinicos`,
    medicalSpecialty: [
      {
        '@type': 'MedicalSpecialty',
        name: 'Terapia Ocupacional',
        description:
          'Terapia ocupacional para mejorar habilidades funcionales y de vida diaria.',
        availableService: {
          '@type': 'MedicalProcedure',
          name: 'Sesión de Terapia Ocupacional',
          procedureType: 'http://schema.org/TherapeuticProcedure',
          howPerformed: 'Sesión individual 1 a 1 con terapeuta especializado.',
          preparation: 'No requiere preparación previa.',
          followup: 'Seguimiento según plan terapéutico individual.',
        },
      },
      {
        '@type': 'MedicalSpecialty',
        name: 'Fonoaudiología',
        description:
          'Evaluación y tratamiento de alteraciones del lenguaje, habla, voz y audición.',
        availableService: {
          '@type': 'MedicalProcedure',
          name: 'Sesión de Fonoaudiología',
          procedureType: 'http://schema.org/TherapeuticProcedure',
          howPerformed: 'Sesión individual 1 a 1 con fonoaudiólogo.',
        },
      },
      {
        '@type': 'MedicalSpecialty',
        name: 'Terapia Conductual',
        description:
          'Intervención conductual basada en evidencia para el manejo de comportamientos y habilidades adaptativas.',
        availableService: {
          '@type': 'MedicalProcedure',
          name: 'Sesión de Terapia Conductual',
          procedureType: 'http://schema.org/TherapeuticProcedure',
          howPerformed: 'Sesión individual 1 a 1 con terapeuta conductual.',
        },
      },
      {
        '@type': 'MedicalSpecialty',
        name: 'Psicología',
        description:
          'Atención psicológica integral para el bienestar emocional y cognitivo.',
        availableService: {
          '@type': 'MedicalProcedure',
          name: 'Sesión de Psicología',
          procedureType: 'http://schema.org/TherapeuticProcedure',
          howPerformed: 'Sesión individual 1 a 1 con psicólogo.',
        },
      },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    provider: {
      '@type': 'NGO',
      name: 'APED - Agrupación Personas Empoderadas por la Discapacidad',
      url: BASE_URL,
    },
  };
}

export function workshopJsonLd(workshop) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: workshop.title,
    description: workshop.description,
    url: `${BASE_URL}/talleres/${workshop.slug}`,
    provider: {
      '@type': 'NGO',
      name: 'APED - Agrupación Personas Empoderadas por la Discapacidad',
      url: BASE_URL,
    },
    courseWorkload: `${workshop.schedule.startTime}-${workshop.schedule.endTime}`,
    educationalLevel: 'Beginner',
    inLanguage: 'es',
    isAccessibleForFree: workshop.price === 0,
    offers: {
      '@type': 'Offer',
      price: workshop.price,
      priceCurrency: 'CLP',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    },
    maximumAttendeeCapacity: workshop.maxCapacity,
    courseMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventSchedule: {
      '@type': 'Schedule',
      byDay: 'Saturday',
      startTime: workshop.schedule.startTime,
      endTime: workshop.schedule.endTime,
    },
  };
}

export function donationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    recipient: {
      '@type': 'NGO',
      name: 'APED - Agrupación Personas Empoderadas por la Discapacidad',
      url: BASE_URL,
    },
    actionOption: [
      {
        '@type': 'Option',
        name: 'Donación Única',
      },
      {
        '@type': 'Option',
        name: 'Suscripción de Socio Mensual',
      },
    ],
    currency: 'CLP',
  };
}
