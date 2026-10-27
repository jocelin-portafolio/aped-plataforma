import { clinicalServices } from './services';
import { workshops } from './workshops';
import { contact } from './navigation';
import { chatbot } from './chatbot';
import { normalize, bestMatch } from '@/lib/textMatch';

// Respuestas de respaldo cuando no hay ANTHROPIC_API_KEY configurada.
// Las palabras clave son raíces: "reserv" cubre reservar, reserva, reservo...
// Ante un empate gana la que aparece primero, así que el orden importa.

const whatsapp = `WhatsApp al ${contact.phone.display}`;

export const SUGGEST = {
  reservar: '¿Cómo reservo una hora?',
  servicios: '¿Qué servicios ofrecen?',
  talleres: 'Talleres de los sábados',
  donar: '¿Cómo puedo donar?',
  ubicacion: '¿Dónde están ubicados?',
  horario: '¿Qué horario tienen?',
  precio: '¿Cuánto cuesta?',
  persona: 'Hablar con una persona',
  socio: 'Quiero ser socio mensual',
  espera: '¿Cómo funciona la lista de espera?',
};

function serviceAnswer(id) {
  const s = clinicalServices.find((service) => service.id === id);
  return `${s.name}: ${s.description} Son sesiones individuales, de ${s.schedule.days.toLowerCase()}, entre ${s.schedule.hours.replace(' - ', ' y ')}. Puedes reservar en Servicios Clínicos (/servicios-clinicos).`;
}

function workshopAnswer(id) {
  const w = workshops.find((workshop) => workshop.id === id);
  return `Taller de ${w.title}: ${w.description} Se realiza los ${w.day.toLowerCase()}s, con un cupo máximo de ${w.capacity} personas. Te inscribes en Talleres (/talleres); si está lleno quedas en lista de espera.`;
}

const faq = [
  {
    id: 'emergencia',
    keywords: ['emergencia', 'suicid', 'me quiero morir', 'hacerme daño', 'riesgo vital', 'samu'],
    answer:
      'Si hay una emergencia o riesgo para la vida de alguien, llama de inmediato al SAMU (131). También puedes llamar a Salud Responde al 600 360 7777, disponible las 24 horas.',
    suggestions: [SUGGEST.persona],
  },
  {
    id: 'persona',
    keywords: ['hablar con una persona', 'hablar con alguien', 'persona real', 'humano', 'ejecutiv', 'operador', 'atención personal'],
    answer: `Para hablar con una persona del equipo de APED, escríbenos por ${whatsapp} (${contact.phone.whatsapp}).`,
    suggestions: [SUGGEST.ubicacion, SUGGEST.horario],
  },
  {
    id: 'precio',
    keywords: ['precio', 'valor', 'cuesta', 'costo', 'cobran', 'arancel', 'tarifa', 'gratis', 'gratuit', 'fonasa', 'isapre', 'reembols', 'convenio'],
    answer: `Para conocer los valores de las sesiones y talleres, o si aplica algún convenio o beneficio, escríbenos por ${whatsapp} y te informamos.`,
    suggestions: [SUGGEST.persona, SUGGEST.reservar],
  },
  {
    id: 'cancelar',
    keywords: ['cancel', 'anular', 'reagend', 'cambiar la hora', 'cambiar mi hora', 'cambiar hora', 'no puedo ir', 'no podré ir', 'no voy a poder'],
    answer: `Para cancelar o cambiar una hora ya reservada, avísanos por ${whatsapp}, idealmente con anticipación, así liberamos el bloque para otra familia.`,
    suggestions: [SUGGEST.reservar, SUGGEST.persona],
  },
  {
    id: 'espera',
    keywords: ['lista de espera', 'espera', 'cupo', 'lleno', 'vacante'],
    answer:
      'Los talleres tienen cupos limitados. Si te inscribes cuando el taller ya está lleno, quedas automáticamente en lista de espera y pasas a inscrito cuando se libera un cupo.',
    suggestions: [SUGGEST.talleres, SUGGEST.persona],
  },
  {
    id: 'ubicacion',
    keywords: ['dónde', 'dirección', 'ubicad', 'ubicación', 'llegar', 'llego', 'mapa', 'maipú', 'comuna', 'sede'],
    answer: `Estamos en ${contact.address.full}.`,
    suggestions: [SUGGEST.horario, SUGGEST.reservar],
  },
  {
    id: 'horario',
    keywords: ['horario', 'atienden', 'abren', 'cierran', 'qué días', 'a qué hora'],
    answer:
      'Los servicios clínicos atienden de lunes a sábado, de 09:00 a 18:00. Los talleres grupales se realizan solo los sábados.',
    suggestions: [SUGGEST.reservar, SUGGEST.talleres],
  },
  {
    id: 'contacto',
    keywords: ['contact', 'whatsapp', 'wsp', 'teléfono', 'número', 'llamar', 'instagram', 'redes sociales', 'correo', 'email', 'mail'],
    answer: `Puedes escribirnos por ${whatsapp} (${contact.phone.whatsapp}) o seguirnos en Instagram ${contact.social.instagramHandle}.`,
    suggestions: [SUGGEST.ubicacion, SUGGEST.horario],
  },
  {
    id: 'socio',
    keywords: ['socio', 'mensual', 'suscrip', 'cuota', 'todos los meses'],
    answer:
      'Puedes hacerte socio con una donación mensual en Apóyanos (/apoyanos): eliges "Suscripción Mensual (Socio)", el monto en pesos y el método de pago. ¡Gracias por sumarte!',
    suggestions: [SUGGEST.donar],
  },
  {
    id: 'donar',
    keywords: ['dona', 'aport', 'apoyar', 'apoyarl', 'colabor', 'anónim', 'transfer', 'cuenta bancaria', 'datos bancarios'],
    answer:
      'Puedes apoyarnos en Apóyanos (/apoyanos) con una donación única o una suscripción mensual como socio. Aceptamos tarjeta, transferencia o efectivo, y puedes donar de forma anónima. ¡Muchas gracias!',
    suggestions: [SUGGEST.socio, SUGGEST.persona],
  },
  {
    id: 'voluntariado',
    keywords: ['voluntari', 'trabajar', 'trabajo', 'postular', 'currículum', 'práctica'],
    answer: `Si quieres colaborar como voluntario o trabajar con nosotros, escríbenos por ${whatsapp} o por Instagram ${contact.social.instagramHandle} y te contamos cómo.`,
    suggestions: [SUGGEST.donar],
  },
  { id: 'taller-habilidades', keywords: ['habilidades sociales', 'social'], answer: workshopAnswer('habilidades-sociales') },
  { id: 'taller-arte', keywords: ['arteterapia', 'arte', 'pintur', 'dibuj'], answer: workshopAnswer('arteterapia') },
  { id: 'taller-cocina', keywords: ['cocina', 'cocinar', 'culinari'], answer: workshopAnswer('cocina') },
  { id: 'taller-motricidad', keywords: ['motricidad', 'motor', 'coordinación'], answer: workshopAnswer('motricidad') },
  {
    id: 'talleres',
    keywords: ['taller', 'grupal', 'grupo', 'sábado', 'inscrib', 'inscripción', 'anotar'],
    answer: `Nuestros talleres grupales son los sábados y tienen cupos limitados: ${workshops
      .map((w) => w.title)
      .join(', ')}. Te inscribes por sesión en Talleres (/talleres); si el cupo está lleno quedas en lista de espera.`,
    suggestions: [SUGGEST.espera, SUGGEST.precio],
  },
  {
    id: 'servicio-to',
    keywords: ['terapia ocupacional', 'ocupacional', 'vida diaria', 'funcional'],
    answer: serviceAnswer('terapia-ocupacional'),
  },
  {
    id: 'servicio-fono',
    keywords: ['fonoaudiolog', 'fono', 'lenguaje', 'habla', 'voz', 'audición', 'pronunci', 'tartamud'],
    answer: serviceAnswer('fonoaudiologia'),
  },
  {
    id: 'servicio-conductual',
    keywords: ['conductual', 'conducta', 'comportamiento', 'berrinche'],
    answer: serviceAnswer('terapia-conductual'),
  },
  {
    id: 'servicio-psicologia',
    keywords: ['psicólog', 'sicólog', 'emocional', 'ansiedad', 'ánimo'],
    answer: serviceAnswer('psicologia'),
  },
  {
    id: 'evaluacion',
    keywords: ['evaluación', 'primera vez', 'primera sesión', 'diagnóstic', 'derivación', 'orden médica', 'requisito', 'documento'],
    answer: `Para empezar, puedes reservar una primera sesión con la especialidad que necesites en /servicios-clinicos. Si tienes dudas sobre requisitos o documentos, escríbenos por ${whatsapp}.`,
    suggestions: [SUGGEST.servicios, SUGGEST.reservar],
  },
  {
    id: 'reservar',
    keywords: ['reserv', 'agend', 'hora', 'cita', 'sesión', 'turno', 'pedir'],
    answer:
      'Puedes reservar una hora en Servicios Clínicos (/servicios-clinicos): eliges la especialidad, el terapeuta, el día y un bloque disponible. Atendemos de lunes a sábado, de 09:00 a 18:00.',
    suggestions: [SUGGEST.servicios, SUGGEST.precio],
  },
  {
    id: 'edad',
    keywords: ['edad', 'años', 'hijo', 'hija', 'niño', 'adulto', 'adolescente', 'bebé', 'mayores'],
    answer: `Para saber si nuestros servicios y talleres son adecuados para la edad y necesidades de la persona, escríbenos por ${whatsapp} y te orientamos.`,
    suggestions: [SUGGEST.servicios, SUGGEST.talleres],
  },
  {
    id: 'servicios',
    keywords: ['servicio', 'terapia', 'terapeuta', 'especialidad', 'ofrecen', 'tratamiento'],
    answer: `Ofrecemos ${clinicalServices
      .map((s) => s.name)
      .join(', ')}, en sesiones individuales de lunes a sábado, de 09:00 a 18:00. Más detalles en /servicios-clinicos.`,
    suggestions: [SUGGEST.reservar, SUGGEST.talleres],
  },
  {
    id: 'aped',
    keywords: ['aped', 'quiénes son', 'organización', 'fundación', 'misión', 'qué hacen'],
    answer:
      'APED (Agrupación Personas Empoderadas por la Discapacidad) es una organización comunitaria de Maipú que empodera a personas con discapacidad con servicios clínicos especializados y talleres grupales.',
    suggestions: [SUGGEST.servicios, SUGGEST.talleres, SUGGEST.donar],
  },
  {
    id: 'gracias',
    keywords: ['gracias', 'agradec', 'genial', 'perfecto', 'excelente'],
    lowPriority: true,
    answer: '¡De nada! Si necesitas algo más, aquí estoy.',
    suggestions: [],
  },
  {
    id: 'despedida',
    keywords: ['chao', 'adiós', 'hasta luego', 'nos vemos'],
    lowPriority: true,
    answer: '¡Hasta pronto! Que tengas un lindo día.',
    suggestions: [],
  },
  {
    id: 'saludo',
    keywords: ['hola', 'buenas', 'buenos días', 'buen día', 'saludos'],
    lowPriority: true,
    answer: '¡Hola! ¿En qué te puedo ayudar? Puedes preguntarme por servicios, reservas, talleres o donaciones.',
  },
].map((item) => ({
  ...item,
  keywords: item.keywords.map(normalize),
  suggestions: item.suggestions ?? chatbot.quickReplies.slice(0, 3),
}));

const fallback = {
  id: 'desconocido',
  answer: `No estoy seguro de cómo ayudarte con eso. Prueba con alguna de estas opciones o escríbenos por ${whatsapp}.`,
  suggestions: [...chatbot.quickReplies.slice(0, 3), SUGGEST.persona],
};

export function faqMatch(text) {
  const { id, answer, suggestions } = bestMatch(faq, text) || fallback;
  return { id, answer, suggestions };
}

export function faqAnswer(text) {
  return faqMatch(text).answer;
}
