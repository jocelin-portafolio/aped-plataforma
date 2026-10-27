import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const streamMock = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    beta = { messages: { stream: streamMock } };
  },
}));

const { POST } = await import('./route');

function chatRequest(body) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function ask(content) {
  return chatRequest({ messages: [{ role: 'user', content }] });
}

// Simula el stream del SDK: emite deltas de texto y luego el mensaje final.
function fakeStream(chunks, stopReason = 'end_turn') {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of chunks) {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text } };
      }
    },
    finalMessage: async () => ({ stop_reason: stopReason }),
  };
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    streamMock.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('validación', () => {
    it.each([
      ['JSON inválido', '{no-json', 'JSON inválido'],
      ['sin mensajes', { messages: [] }, 'Se requiere al menos un mensaje'],
      ['rol inválido', { messages: [{ role: 'system', content: 'hola' }] }, 'Formato de mensaje inválido'],
      ['contenido vacío', { messages: [{ role: 'user', content: '   ' }] }, 'Formato de mensaje inválido'],
      [
        'último mensaje del asistente',
        { messages: [{ role: 'user', content: 'hola' }, { role: 'assistant', content: 'hola' }] },
        'El último mensaje debe ser del usuario',
      ],
      ['mensaje muy largo', { messages: [{ role: 'user', content: 'a'.repeat(1001) }] }, 'como máximo 1000'],
      [
        'conversación muy larga',
        { messages: Array.from({ length: 21 }, () => ({ role: 'user', content: 'hola' })) },
        'demasiado larga',
      ],
    ])('rechaza %s con 400', async (_, body, error) => {
      const res = await POST(chatRequest(body));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain(error);
      expect(streamMock).not.toHaveBeenCalled();
    });
  });

  describe('sin ANTHROPIC_API_KEY', () => {
    beforeEach(() => vi.stubEnv('ANTHROPIC_API_KEY', ''));

    it('responde con la pregunta frecuente y no llama a Claude', async () => {
      const res = await POST(ask('¿Dónde están ubicados?'));
      expect(res.status).toBe(200);
      expect(await res.text()).toContain('La Capitanía #2516');
      expect(streamMock).not.toHaveBeenCalled();
    });
  });

  describe('con ANTHROPIC_API_KEY', () => {
    beforeEach(() => vi.stubEnv('ANTHROPIC_API_KEY', 'test-key'));

    it('transmite el texto de Claude', async () => {
      streamMock.mockReturnValue(fakeStream(['Hola, ', 'atendemos ', 'de lunes a sábado.']));

      const res = await POST(ask('¿Qué horario tienen?'));
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/plain');
      expect(await res.text()).toBe('Hola, atendemos de lunes a sábado.');
    });

    it('envía el prompt de APED y solo role/content de cada mensaje', async () => {
      streamMock.mockReturnValue(fakeStream(['ok']));

      await (
        await POST(
          chatRequest({
            messages: [
              { role: 'user', content: 'hola', extra: 'x' },
              { role: 'assistant', content: '¡Hola!' },
              { role: 'user', content: '¿Tienen talleres?' },
            ],
          })
        )
      ).text();

      const params = streamMock.mock.calls[0][0];
      expect(params.model).toBe('claude-opus-5-5');
      expect(params.system).toContain('APED');
      expect(params.system).toContain('Arteterapia');
      expect(params.fallbacks).toBe('default');
      expect(params.messages).toEqual([
        { role: 'user', content: 'hola' },
        { role: 'assistant', content: '¡Hola!' },
        { role: 'user', content: '¿Tienen talleres?' },
      ]);
    });

    it('usa ANTHROPIC_MODEL si está definido', async () => {
      vi.stubEnv('ANTHROPIC_MODEL', 'claude-sonnet-5-5');
      vi.resetModules();
      const { POST: post } = await import('./route');
      streamMock.mockReturnValue(fakeStream(['ok']));

      await (await post(ask('hola'))).text();
      expect(streamMock.mock.calls[0][0].model).toBe('claude-sonnet-5-5');
    });

    it('usa la pregunta frecuente si Claude rechaza sin responder', async () => {
      streamMock.mockReturnValue(fakeStream([], 'refusal'));

      const res = await POST(ask('quiero donar'));
      expect(await res.text()).toContain('/apoyanos');
    });

    it('no agrega texto si el rechazo llega después de una respuesta parcial', async () => {
      streamMock.mockReturnValue(fakeStream(['Respuesta parcial'], 'refusal'));

      const res = await POST(ask('quiero donar'));
      expect(await res.text()).toBe('Respuesta parcial');
    });

    it('responde con un mensaje de error si falla la API', async () => {
      streamMock.mockImplementation(() => {
        throw new Error('rate limit');
      });

      const res = await POST(ask('hola'));
      expect(res.status).toBe(200);
      expect(await res.text()).toContain('tuve un problema para responder');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
