// Cliente mínimo de la API de WhatsApp Cloud (Meta).
import crypto from 'node:crypto';

const BUTTON_TITLE_MAX = 20;
const LIST_TITLE_MAX = 24;
const LIST_DESCRIPTION_MAX = 72;
const INTERACTIVE_BODY_MAX = 1024;
const TEXT_BODY_MAX = 4096;

export function whatsappConfig() {
  return {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v23.0',
  };
}

/** Verifica la firma X-Hub-Signature-256 que Meta agrega a cada webhook. */
export function verifySignature(rawBody, signature, appSecret) {
  if (!signature || !appSecret) return false;
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Extrae los mensajes entrantes de un webhook:
 * [{ id, from, name, text, optionId }]. `optionId` viene cuando la persona
 * toca un botón o una opción de lista.
 */
export function parseIncoming(payload) {
  const messages = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;
      const value = change.value ?? {};
      const names = Object.fromEntries((value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]));

      for (const m of value.messages ?? []) {
        let text = null;
        let optionId = null;
        if (m.type === 'text') text = m.text?.body;
        if (m.type === 'interactive') {
          const choice = m.interactive?.button_reply ?? m.interactive?.list_reply;
          text = choice?.title;
          optionId = choice?.id;
        }
        if (m.type === 'button') text = m.button?.text;
        messages.push({ id: m.id, from: m.from, name: names[m.from], type: m.type, text, optionId });
      }
    }
  }
  return messages;
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Arma el mensaje según las opciones: hasta 3 botones, hasta 10 en una
 * lista, y si son más, una lista numerada en el texto.
 */
export function buildMessage(to, text, options = []) {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };

  if (!options.length) {
    return { ...base, type: 'text', text: { body: truncate(text, TEXT_BODY_MAX), preview_url: false } };
  }

  const body = { text: truncate(text, INTERACTIVE_BODY_MAX) };

  if (options.length <= 3 && options.every((o) => o.label.length <= BUTTON_TITLE_MAX && !o.description)) {
    return {
      ...base,
      type: 'interactive',
      interactive: {
        type: 'button',
        body,
        action: { buttons: options.map((o) => ({ type: 'reply', reply: { id: o.id, title: o.label } })) },
      },
    };
  }

  if (options.length <= 10) {
    return {
      ...base,
      type: 'interactive',
      interactive: {
        type: 'list',
        body,
        action: {
          button: 'Ver opciones',
          sections: [
            {
              title: 'Opciones',
              rows: options.map((o) => {
                const row = { id: o.id, title: truncate(o.label, LIST_TITLE_MAX) };
                // Si el título se cortó, el texto completo va en la descripción.
                const description = o.description ?? (o.label.length > LIST_TITLE_MAX ? o.label : null);
                if (description) row.description = truncate(description, LIST_DESCRIPTION_MAX);
                return row;
              }),
            },
          ],
        },
      },
    };
  }

  const numbered = options.map((o, i) => `${i + 1}. ${o.label}`).join('\n');
  return buildMessage(to, `${text}\n\n${numbered}\n\nResponde con el número.`);
}

export async function sendMessage(to, text, options = []) {
  const { token, phoneNumberId, apiVersion } = whatsappConfig();
  const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildMessage(to, text, options)),
  });
  if (!res.ok) {
    throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
