import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifySignature, parseIncoming, buildMessage } from './whatsapp';

describe('verifySignature', () => {
  const body = '{"hola":1}';
  const sign = (secret) => `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

  it('acepta la firma correcta y rechaza las demás', () => {
    expect(verifySignature(body, sign('secreto'), 'secreto')).toBe(true);
    expect(verifySignature(body, sign('otro'), 'secreto')).toBe(false);
    expect(verifySignature(body, 'sha256=corta', 'secreto')).toBe(false);
    expect(verifySignature(body, null, 'secreto')).toBe(false);
    expect(verifySignature(body, sign('secreto'), undefined)).toBe(false);
  });
});

describe('parseIncoming', () => {
  it('lee textos, botones y opciones de lista', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                contacts: [{ wa_id: '56911111111', profile: { name: 'Ana' } }],
                messages: [
                  { id: 'm1', from: '56911111111', type: 'text', text: { body: 'hola' } },
                  {
                    id: 'm2',
                    from: '56911111111',
                    type: 'interactive',
                    interactive: { type: 'button_reply', button_reply: { id: 'confirm', title: 'Confirmar reserva' } },
                  },
                  {
                    id: 'm3',
                    from: '56911111111',
                    type: 'interactive',
                    interactive: { type: 'list_reply', list_reply: { id: 'day:2026-11-03', title: 'Mar 3 nov' } },
                  },
                  { id: 'm4', from: '56911111111', type: 'image', image: {} },
                ],
              },
            },
            { field: 'statuses', value: {} },
          ],
        },
      ],
    };

    expect(parseIncoming(payload)).toEqual([
      { id: 'm1', from: '56911111111', name: 'Ana', type: 'text', text: 'hola', optionId: null },
      { id: 'm2', from: '56911111111', name: 'Ana', type: 'interactive', text: 'Confirmar reserva', optionId: 'confirm' },
      { id: 'm3', from: '56911111111', name: 'Ana', type: 'interactive', text: 'Mar 3 nov', optionId: 'day:2026-11-03' },
      { id: 'm4', from: '56911111111', name: 'Ana', type: 'image', text: null, optionId: null },
    ]);
  });

  it('ignora webhooks sin mensajes (por ejemplo, avisos de entrega)', () => {
    expect(parseIncoming({ entry: [{ changes: [{ field: 'messages', value: { statuses: [] } }] }] })).toEqual([]);
    expect(parseIncoming({})).toEqual([]);
  });
});

describe('buildMessage', () => {
  const to = '56911111111';

  it('texto simple sin opciones', () => {
    expect(buildMessage(to, 'Hola')).toMatchObject({ type: 'text', text: { body: 'Hola' } });
  });

  it('hasta 3 opciones cortas van como botones', () => {
    const msg = buildMessage(to, '¿Confirmo?', [
      { id: 'confirm', label: 'Confirmar reserva' },
      { id: 'cancel', label: 'Cancelar' },
    ]);
    expect(msg.interactive.type).toBe('button');
    expect(msg.interactive.action.buttons[0]).toEqual({ type: 'reply', reply: { id: 'confirm', title: 'Confirmar reserva' } });
  });

  it('opciones con descripción o títulos largos van como lista', () => {
    const msg = buildMessage(to, 'Elige', [
      { id: 'slot:1', label: '09:00', description: 'con Carla Soto' },
      { id: '¿Cómo funciona la lista de espera?', label: '¿Cómo funciona la lista de espera?' },
    ]);
    expect(msg.interactive.type).toBe('list');
    const [row1, row2] = msg.interactive.action.sections[0].rows;
    expect(row1).toEqual({ id: 'slot:1', title: '09:00', description: 'con Carla Soto' });
    expect(row2.title.length).toBeLessThanOrEqual(24);
    expect(row2.description).toBe('¿Cómo funciona la lista de espera?');
  });

  it('más de 10 opciones van numeradas en el texto', () => {
    const options = Array.from({ length: 11 }, (_, i) => ({ id: `o${i}`, label: `Opción ${i + 1}` }));
    const msg = buildMessage(to, 'Elige', options);
    expect(msg.type).toBe('text');
    expect(msg.text.body).toContain('11. Opción 11');
  });
});
