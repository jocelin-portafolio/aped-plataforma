import { whatsappConfig, verifySignature, parseIncoming } from '@/lib/whatsapp';
import { handleWhatsAppMessage } from '@/lib/whatsappBot';

// Verificación del webhook: Meta llama con hub.challenge al configurarlo.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const { verifyToken } = whatsappConfig();

  if (
    verifyToken &&
    searchParams.get('hub.mode') === 'subscribe' &&
    searchParams.get('hub.verify_token') === verifyToken
  ) {
    return new Response(searchParams.get('hub.challenge') ?? '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// Mensajes entrantes. Se responde 200 aunque falle uno, para que Meta no
// reintente toda la entrega; los errores quedan en el log.
export async function POST(request) {
  const { appSecret, token, phoneNumberId } = whatsappConfig();
  if (!appSecret || !token || !phoneNumberId) {
    return new Response('WhatsApp no está configurado', { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'), appSecret)) {
    return new Response('Firma inválida', { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('JSON inválido', { status: 400 });
  }

  for (const message of parseIncoming(payload)) {
    try {
      await handleWhatsAppMessage(message);
    } catch (err) {
      console.error('[api/whatsapp]', message.id, err);
    }
  }

  return new Response('OK', { status: 200 });
}
