import { describe, it, expect } from 'vitest';
import { systemPrompt, chatbot } from './chatbot';
import { faqMatch, faqAnswer, SUGGEST } from './chatbotFaq';

describe('faqMatch', () => {
  it.each([
    ['¿Cuánto cuesta una sesión de fonoaudiología?', 'precio'],
    ['aceptan fonasa?', 'precio'],
    ['¿Dónde están?', 'ubicacion'],
    ['como llego', 'ubicacion'],
    ['Quiero donar', 'donar'],
    ['cuenta para transferir', 'donar'],
    ['Quiero ser socio mensual', 'socio'],
    ['Talleres de los sábados', 'talleres'],
    ['taller de cocina', 'taller-cocina'],
    ['quiero inscribirme en motricidad', 'taller-motricidad'],
    ['¿Cómo reservo una hora?', 'reservar'],
    ['quiero cancelar mi hora', 'cancelar'],
    ['¿Qué servicios ofrecen?', 'servicios'],
    ['mi hijo tiene problemas de lenguaje', 'servicio-fono'],
    ['hacen terapia ocupacional?', 'servicio-to'],
    ['¿Cómo funciona la lista de espera?', 'espera'],
    ['¿Qué horario tienen?', 'horario'],
    ['necesito hablar con una persona', 'persona'],
    ['emergencia', 'emergencia'],
    ['qué es APED', 'aped'],
    ['pueden ver a mi hija de 5 años', 'edad'],
  ])('"%s" → %s', (question, id) => {
    expect(faqMatch(question).id).toBe(id);
  });

  describe('tolera tildes, mayúsculas y errores de escritura', () => {
    it.each([
      ['DONDE ESTAN UBICADOS', 'ubicacion'],
      ['dnde estan ubicados', 'ubicacion'],
      ['Kiero resevar una ora', 'reservar'],
      ['taleres de los sabados', 'talleres'],
      ['sicologo para mi hija', 'servicio-psicologia'],
      ['tienen fonoaudiologa?', 'servicio-fono'],
    ])('"%s" → %s', (question, id) => {
      expect(faqMatch(question).id).toBe(id);
    });
  });

  it('un saludo no le gana a una consulta concreta', () => {
    expect(faqMatch('hola, quiero información de los taleres').id).toBe('talleres');
    expect(faqMatch('hola').id).toBe('saludo');
    expect(faqMatch('muchas gracias!').id).toBe('gracias');
  });

  it('"ahora" no se confunde con "hora"', () => {
    expect(faqMatch('ahora mismo').id).toBe('desconocido');
  });

  it('cuando no reconoce la pregunta, deriva a WhatsApp y sugiere opciones', () => {
    const { id, answer, suggestions } = faqMatch('asdfgh');
    expect(id).toBe('desconocido');
    expect(answer).toContain('WhatsApp');
    expect(suggestions).toContain(SUGGEST.persona);
  });

  it('cada sugerencia lleva a una respuesta conocida', () => {
    for (const suggestion of [...Object.values(SUGGEST), ...chatbot.quickReplies]) {
      expect(faqMatch(suggestion).id, suggestion).not.toBe('desconocido');
    }
  });

  it('faqAnswer devuelve solo el texto', () => {
    expect(faqAnswer('quiero donar')).toContain('/apoyanos');
  });
});

describe('systemPrompt', () => {
  it('incluye servicios, talleres y contacto de config/', () => {
    for (const text of ['Terapia Ocupacional', 'Motricidad', '+56 9 3439 4294', '@aped_chile']) {
      expect(systemPrompt).toContain(text);
    }
  });
});
