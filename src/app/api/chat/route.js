import Anthropic from '@anthropic-ai/sdk';
import { errorResponse } from '@/lib/responses';
import { chatbot, systemPrompt } from '@/config/chatbot';
import { faqAnswer, faqMatch } from '@/config/chatbotFaq';
import { contact } from '@/config/navigation';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

const ERROR_TEXT = `Lo siento, tuve un problema para responder. Intenta de nuevo o escríbenos por WhatsApp al ${contact.phone.display}.`;

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

// Las sugerencias de seguimiento viajan en un header (codificado, porque los
// headers no admiten tildes) para no mezclarlas con el texto en streaming.
function textResponse(body, suggestions = []) {
  const headers = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' };
  if (suggestions.length) {
    headers['X-Chat-Suggestions'] = encodeURIComponent(JSON.stringify(suggestions));
  }
  return new Response(body, { headers });
}

export async function POST(request) {
  let messages;
  try {
    ({ messages } = await request.json());
  } catch {
    return errorResponse('JSON inválido');
  }

  const error = validateMessages(messages);
  if (error) return errorResponse(error);

  // Sin API key, el bot responde con preguntas frecuentes predefinidas.
  if (!process.env.ANTHROPIC_API_KEY) {
    const { answer, suggestions } = faqMatch(messages[messages.length - 1].content);
    return textResponse(answer, suggestions);
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 2048,
          output_config: { effort: 'low' },
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system: systemPrompt,
          messages: messages.map(({ role, content }) => ({ role, content })),
        });

        let sentText = false;
        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            sentText = true;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await claudeStream.finalMessage();
        if (final.stop_reason === 'refusal' && !sentText) {
          controller.enqueue(encoder.encode(faqAnswer(messages[messages.length - 1].content)));
        }
      } catch (err) {
        console.error('[api/chat]', err);
        controller.enqueue(encoder.encode(ERROR_TEXT));
      } finally {
        controller.close();
      }
    },
  });

  return textResponse(stream);
}
