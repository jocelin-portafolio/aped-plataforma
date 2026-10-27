import Anthropic from '@anthropic-ai/sdk';
import { systemPrompt } from '@/config/chatbot';
import { faqAnswer } from '@/config/chatbotFaq';
import { contact } from '@/config/navigation';

export const CLAUDE_ERROR_TEXT = `Lo siento, tuve un problema para responder. Intenta de nuevo o escríbenos por WhatsApp al ${contact.phone.display}.`;

export function claudeEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Genera la respuesta de Claude por partes. Nunca lanza errores: si Claude
 * rechaza la pregunta usa la pregunta frecuente, y si la API falla devuelve
 * un mensaje de error para la persona.
 */
export async function* claudeTextStream(messages, { channel = 'web' } = {}) {
  const lastUserMessage = messages[messages.length - 1].content;
  try {
    const client = new Anthropic();
    const stream = client.beta.messages.stream({
      model: process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
      max_tokens: 2048,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system:
        channel === 'whatsapp'
          ? `${systemPrompt}\n- Estás respondiendo por WhatsApp: no menciones el chat de la página.`
          : systemPrompt,
      messages: messages.map(({ role, content }) => ({ role, content })),
    });

    let sentText = false;
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        sentText = true;
        yield event.delta.text;
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal' && !sentText) {
      yield faqAnswer(lastUserMessage);
    }
  } catch (err) {
    console.error('[claude]', err);
    yield CLAUDE_ERROR_TEXT;
  }
}

/** Respuesta completa de Claude (para canales sin streaming, como WhatsApp). */
export async function claudeReply(messages, options) {
  let text = '';
  for await (const chunk of claudeTextStream(messages, options)) text += chunk;
  return text;
}
