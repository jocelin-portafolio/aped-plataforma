import { describe, it, expect } from 'vitest';
import { normalize, levenshtein, keywordScore, bestMatch } from './textMatch';

describe('normalize', () => {
  it('quita tildes, mayúsculas y signos', () => {
    expect(normalize('¿Dónde  ESTÁN, ñandú?')).toBe('donde estan nandu');
  });
});

describe('levenshtein', () => {
  it.each([
    ['taller', 'taller', 0],
    ['taleres', 'talleres', 1],
    ['resevar', 'reservar', 1],
    ['', 'abc', 3],
  ])('%s / %s = %i', (a, b, d) => {
    expect(levenshtein(a, b)).toBe(d);
  });
});

describe('keywordScore', () => {
  const score = (keyword, text) => keywordScore(keyword, text.split(' '), text);

  it('da 2 a una raíz exacta y 1 a una con errores', () => {
    expect(score('reserv', 'quiero reservar')).toBe(2);
    expect(score('reserv', 'quiero resevar')).toBe(1);
  });

  it('exige coincidencia exacta en raíces cortas', () => {
    expect(score('hora', 'ahora')).toBe(0);
    expect(score('hora', 'una ora')).toBe(0);
  });

  it('busca frases completas', () => {
    expect(score('lista de espera', 'la lista de espera')).toBe(2);
    expect(score('lista de espera', 'la lista')).toBe(0);
  });
});

describe('bestMatch', () => {
  const items = [
    { id: 'a', keywords: ['precio'] },
    { id: 'b', keywords: ['fono', 'fonoaudiolog'] },
    { id: 'hola', keywords: ['hola'], lowPriority: true },
  ];

  it('una palabra suma una sola vez aunque coincida con varias raíces', () => {
    expect(bestMatch(items, 'precio fonoaudiologia').id).toBe('a');
  });

  it('los elementos de baja prioridad solo ganan si nada más coincide', () => {
    expect(bestMatch(items, 'hola precio').id).toBe('a');
    expect(bestMatch(items, 'hola').id).toBe('hola');
  });

  it('devuelve null si nada coincide', () => {
    expect(bestMatch(items, 'xyz')).toBeNull();
  });
});
