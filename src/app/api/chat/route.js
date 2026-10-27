import { errorResponse } from '@/lib/responses';
import { chatbot } from '@/config/chatbot';
import { faqMatch } from '@/config/chatbotFaq';
import { claudeEnabled, claudeTextStream } from '@/lib/claude';
import { handleBooking, wantsBooking } from '@/lib/bookingFlow';

const MAX_BOOKING_STATE_CHARS = 8000;

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'Se requiere al menos un mensaje';
  }
  if (messages.length > chatbot.limits.maxMessages) {
    return 'La conversación es demasiado larga. Recarga la página para empezar otra.';
  }
  for (const m of messages) {
    if (!['user', 'assistant'].includes(m?.role) || typeof m.content !== 'string' || !m.content.trim()) {
      return 'Formato de mensaje inválido';
    }
    if (m.content.length > chatbot.limits.maxChars) {
      return `Cada mensaje puede tener como máximo ${chatbot.limits.maxChars} caracteres`;
    }
  }
  if (messages[messages.length - 1].role !== 'user') {
    return 'El último mensaje debe ser del usuario';
  }
  return null;
}

// El estado de la reserva lo guarda el navegador; el servidor vuelve a validar
// todo contra la agenda antes de reservar.
function validateBooking(booking) {
  if (booking == null) return null;
  if (typeof booking !== 'object' || Array.isArray(booking) || typeof booking.step !== 'string') {
    return 'Estado de reserva inválido';
  }
  if (JSON.stringify(booking).length > MAX_BOOKING_STATE_CHARS) return 'Estado de reserva inválido';
  return null;
}

// Las sugerencias de seguimiento viajan en un header (codificado, porque los
// headers no admiten tildes) para no mezclarlas con el texto en streaming.
function textResponse(body, suggestions = []) {
  const headers = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' };
  if (suggestions.length) {
    headers['X-Chat-Suggestions'] = encodeURIComponent(JSON.stringify(suggestions));
  }
  return new Response(body, { headers });
}

function toReadableStream(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

export async function POST(request) {
  let messages;
  let booking;
  let optionId;
  try {
    ({ messages, booking, optionId } = await request.json());
  } catch {
    return errorResponse('JSON inválido');
  }

  const error =
    validateMessages(messages) ||
    validateBooking(booking) ||
    (optionId != null && (typeof optionId !== 'string' || optionId.length > 200) ? 'Opción inválida' : null);
  if (error) return errorResponse(error);

  const text = messages[messages.length - 1].content;

  // Reserva de horas: conversación guiada con la agenda en tiempo real.
  if (booking || wantsBooking(text)) {
    const result = await handleBooking(optionId || text, booking, { source: 'chat web' });
    return Response.json(
      { reply: result.reply, options: result.options, booking: result.state },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Sin API key, el bot responde con preguntas frecuentes predefinidas.
  if (!claudeEnabled()) {
    const { answer, suggestions } = faqMatch(text);
    return textResponse(answer, suggestions);
  }

  return textResponse(toReadableStream(claudeTextStream(messages)));
}
