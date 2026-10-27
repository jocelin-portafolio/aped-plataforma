// Coincidencia de texto tolerante a mayúsculas, tildes y errores de escritura.

export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

// Errores permitidos según el largo: las raíces cortas deben coincidir exactas.
function tolerance(length) {
  if (length >= 7) return 2;
  if (length >= 5) return 1;
  return 0;
}

/**
 * Compara una raíz normalizada (ej. "reserv") con las palabras de un texto.
 * Devuelve 2 si alguna palabra empieza exactamente con la raíz, 1 si
 * coincide con algún error de escritura y 0 si no coincide.
 * Las frases de varias palabras se buscan tal cual en el texto.
 */
export function keywordScore(keyword, words, text) {
  if (keyword.includes(' ')) return text.includes(keyword) ? 2 : 0;

  if (words.some((w) => w.startsWith(keyword))) return 2;

  const tol = tolerance(keyword.length);
  if (tol === 0) return 0;

  const fuzzy = words.some(
    (w) =>
      w.length >= keyword.length - 1 &&
      [-1, 0, 1].some((d) => levenshtein(w.slice(0, keyword.length + d), keyword) <= tol)
  );
  return fuzzy ? 1 : 0;
}

// Puntaje de un elemento: cada palabra del texto suma una sola vez (su mejor
// coincidencia), así un elemento con raíces parecidas ("fono", "fonoaudiolog")
// no le gana a otro solo por repetir palabras clave. Las frases suman aparte.
function itemScore(item, words, text) {
  const phrases = item.keywords.filter((k) => k.includes(' '));
  const roots = item.keywords.filter((k) => !k.includes(' '));

  const wordScore = words.reduce(
    (sum, w) => sum + Math.max(0, ...roots.map((k) => keywordScore(k, [w], text))),
    0
  );
  const phraseScore = phrases.reduce((sum, k) => sum + keywordScore(k, words, text), 0);
  return wordScore + phraseScore;
}

/**
 * Elige el elemento con mayor puntaje. `items` tiene `keywords` ya
 * normalizadas; ante un empate gana el que aparece primero. Los elementos
 * con `lowPriority` (saludos, agradecimientos) solo ganan si ningún otro
 * coincide.
 */
export function bestMatch(items, input) {
  const text = normalize(input);
  const words = text.split(' ').filter(Boolean);

  let best = null;
  let bestScore = 0;
  for (const item of [...items].sort((a, b) => !!a.lowPriority - !!b.lowPriority)) {
    if (item.lowPriority && best) break;
    const score = itemScore(item, words, text);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}
