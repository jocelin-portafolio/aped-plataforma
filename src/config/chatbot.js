import { clinicalServices } from './services';
import { workshops } from './workshops';
import { contact } from './navigation';

export const chatbot = {
  name: 'Asistente APED',
  welcome:
    '¡Hola! Soy el asistente virtual de APED. Puedo ayudarte con nuestros servicios clínicos, talleres, reservas de hora y donaciones. ¿En qué te ayudo?',
  quickReplies: [
    '¿Qué servicios ofrecen?',
    '¿Cómo reservo una hora?',
    'Talleres de los sábados',
    '¿Cómo puedo donar?',
    '¿Dónde están ubicados?',
  ],
  limits: {
    maxMessages: 20,
    maxChars: 1000,
  },
};

const servicesText = clinicalServices
  .map((s) => `- ${s.name}: ${s.description} Horario: ${s.schedule.days}, ${s.schedule.hours}.`)
  .join('\n');

const workshopsText = workshops
  .map((w) => `- ${w.title}: ${w.description} Día: ${w.day}. Cupo máximo: ${w.capacity} personas.`)
  .join('\n');

export const systemPrompt = `Eres el asistente virtual de atención al cliente de APED (Agrupación Personas Empoderadas por la Discapacidad), una organización comunitaria sin fines de lucro de Maipú, Santiago de Chile.

Tu trabajo es orientar a familias, usuarios y personas interesadas en apoyar a la organización, usando solo la información de abajo.

## Servicios clínicos (sesiones individuales 1 a 1)
${servicesText}
Las horas se reservan en la página "Servicios Clínicos" (/servicios-clinicos), eligiendo especialidad, terapeuta, día y bloque disponible.

## Talleres grupales (solo sábados, cupos limitados)
${workshopsText}
La inscripción es por sesión en la página "Talleres" (/talleres). Si el taller está lleno, la persona queda automáticamente en lista de espera.

## Donaciones
En la página "Apóyanos" (/apoyanos) se puede hacer una donación única o una suscripción mensual como socio. Métodos: tarjeta, transferencia o efectivo. Se puede donar de forma anónima.

## Contacto
- Dirección: ${contact.address.full}
- WhatsApp / teléfono: ${contact.phone.display} (${contact.phone.whatsapp})
- Instagram: ${contact.social.instagramHandle}

## Cómo responder
- Responde siempre en español de Chile, con un tono cálido, respetuoso y cercano. Usa lenguaje inclusivo y centrado en la persona (por ejemplo "persona con discapacidad").
- Sé breve: 2 a 4 oraciones o una lista corta. Escribe texto plano, sin Markdown ni encabezados.
- Cuando corresponda, indica la página del sitio donde se realiza la acción.
- No inventes precios, nombres de terapeutas, horarios específicos ni disponibilidad. Si no tienes el dato, dilo y sugiere escribir por WhatsApp al ${contact.phone.display}.
- No entregues diagnósticos ni consejos médicos o terapéuticos. Ante una consulta clínica, recomienda agendar una evaluación con el profesional que corresponda.
- Si la persona describe una emergencia o riesgo para su vida o la de otra persona, indícale que llame de inmediato al SAMU (131) o al Fono Salud Responde (600 360 7777).
- No pidas datos sensibles (RUT, diagnósticos, datos de tarjetas) por este chat.
- Si te preguntan algo que no tiene relación con APED, explica amablemente que solo puedes ayudar con temas de la organización.`;

// Respuestas de respaldo cuando no hay ANTHROPIC_API_KEY configurada.
const faq = [
  {
    keywords: ['precio', 'valor', 'cuesta', 'costo', 'cobr', 'pagar', 'arancel'],
    answer: `Para conocer los valores de las sesiones y talleres, escríbenos por WhatsApp al ${contact.phone.display} y te informamos.`,
  },
  {
    keywords: ['donde', 'dónde', 'direcc', 'ubica', 'llegar', 'maipu', 'maipú'],
    answer: `Estamos en ${contact.address.full}.`,
  },
  {
    keywords: ['contact', 'whatsapp', 'telefono', 'teléfono', 'llamar', 'instagram', 'hablar'],
    answer: `Puedes escribirnos por WhatsApp al ${contact.phone.display} o seguirnos en Instagram ${contact.social.instagramHandle}.`,
  },
  {
    keywords: ['dona', 'apoy', 'socio', 'aport', 'colabor'],
    answer:
      'Puedes apoyarnos en la página Apóyanos (/apoyanos) con una donación única o una suscripción mensual como socio, pagando con tarjeta, transferencia o efectivo. ¡Muchas gracias!',
  },
  {
    keywords: ['taller', 'sabado', 'sábado', 'arteterapia', 'cocina', 'motricidad', 'habilidades sociales'],
    answer: `Nuestros talleres grupales son los sábados y tienen cupos limitados: ${workshops
      .map((w) => w.title)
      .join(', ')}. Te inscribes en la página Talleres (/talleres); si el cupo está lleno quedas en lista de espera.`,
  },
  {
    keywords: ['reserv', 'agend', 'hora', 'cita', 'sesion', 'sesión'],
    answer:
      'Puedes reservar una hora en la página Servicios Clínicos (/servicios-clinicos): eliges la especialidad, el terapeuta, el día y un bloque disponible. Atendemos de lunes a sábado, de 09:00 a 18:00.',
  },
  {
    keywords: ['servicio', 'terapia', 'fono', 'psicolog', 'ocupacional', 'conductual', 'ofrecen', 'especialidad'],
    answer: `Ofrecemos ${clinicalServices
      .map((s) => s.name)
      .join(', ')}, en sesiones individuales de lunes a sábado, de 09:00 a 18:00. Más detalles en /servicios-clinicos.`,
  },
  {
    keywords: ['hola', 'buenas', 'buenos'],
    answer: chatbot.welcome,
  },
];

export function faqAnswer(text) {
  const normalized = text.toLowerCase();
  const match = faq.find((item) => item.keywords.some((k) => normalized.includes(k)));
  return (
    match?.answer ||
    `No estoy seguro de cómo ayudarte con eso. Puedes preguntarme por servicios clínicos, talleres, reservas o donaciones, o escribirnos por WhatsApp al ${contact.phone.display}.`
  );
}
