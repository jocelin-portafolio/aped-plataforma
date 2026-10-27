import { describe, it, expect } from 'vitest';
import { faqAnswer, systemPrompt } from './chatbot';

describe('faqAnswer', () => {
  it.each([
    ['¿Cuánto cuesta una sesión?', 'WhatsApp'],
    ['¿Dónde están?', 'La Capitanía'],
    ['donde queda', 'La Capitanía'],
    ['Quiero donar', '/apoyanos'],
    ['Talleres de los sábados', '/talleres'],
    ['¿Cómo reservo una hora?', '/servicios-clinicos'],
    ['¿Qué servicios ofrecen?', 'Fonoaudiología'],
    ['HOLA', 'asistente virtual'],
  ])('"%s" responde con "%s"', (question, expected) => {
    expect(faqAnswer(question)).toContain(expected);
  });

  it('deriva a WhatsApp cuando no reconoce la pregunta', () => {
    expect(faqAnswer('xyz')).toContain('No estoy seguro');
  });
});

describe('systemPrompt', () => {
  it('incluye servicios, talleres y contacto de config/', () => {
    for (const text of ['Terapia Ocupacional', 'Motricidad', '+56 9 3439 4294', '@aped_chile']) {
      expect(systemPrompt).toContain(text);
    }
  });
});
