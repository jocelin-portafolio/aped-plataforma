// Responde los mensajes que llegan al WhatsApp de APED con la misma lógica
// del chat web: reserva de horas, Claude (si hay API key) o preguntas frecuentes.
import { connectDB } from '@/config/db';
import ChatSession from '@/models/ChatSession';
import { faqMatch } from '@/config/chatbotFaq';
import { claudeEnabled, claudeReply } from '@/lib/claude';
import { handleBooking, wantsBooking } from '@/lib/bookingFlow';
import { sendMessage } from '@/lib/whatsapp';

const MAX_HISTORY = 20;
const MAX_PROCESSED_IDS = 50;

const UNSUPPORTED_TEXT =
  'Por ahora solo puedo leer mensajes de texto. ¿Me escribes tu consulta?';

/** Calcula la respuesta y el nuevo estado de la conversación. */
export async function replyTo(message, session) {
  if (!message.text) return { reply: UNSUPPORTED_TEXT, options: [], booking: session.booking };

  // Los botones de reserva traen su id; los de preguntas frecuentes, el texto completo.
  const input = message.optionId ?? message.text;

  if (session.booking || wantsBooking(input)) {
    const result = await handleBooking(input, session.booking, {
      source: 'WhatsApp',
      phone: `+${message.from}`,
    });
    return { reply: result.reply, options: result.options, booking: result.state };
  }

  if (!claudeEnabled()) {
    const { answer, suggestions } = faqMatch(input);
    return {
      reply: answer,
      options: suggestions.map((label) => ({ id: label, label })),
      booking: null,
    };
  }

  const history = [...session.history, { role: 'user', content: input }];
  return { reply: await claudeReply(history, { channel: 'whatsapp' }), options: [], booking: null };
}

/** Procesa un mensaje entrante: lo responde y guarda la conversación. */
export async function handleWhatsAppMessage(message) {
  await connectDB();
  const key = `whatsapp:${message.from}`;
  const session = (await ChatSession.findOne({ key })) ?? new ChatSession({ key, history: [] });

  // Meta reintenta los webhooks: un mismo mensaje se responde una sola vez.
  if (session.processedIds.includes(message.id)) return;
  session.processedIds = [...session.processedIds, message.id].slice(-MAX_PROCESSED_IDS);

  const { reply, options, booking } = await replyTo(message, session);

  session.booking = booking;
  session.history = [
    ...session.history,
    { role: 'user', content: message.text ?? `[${message.type}]` },
    { role: 'assistant', content: reply },
  ].slice(-MAX_HISTORY);
  await session.save();

  await sendMessage(message.from, reply, options);
}
