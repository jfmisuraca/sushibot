export function extractKeywords(input: string): string[] {
  const stopWords = new Set([
    'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'en',
    'entre', 'hacia', 'hasta', 'para', 'por', 'según', 'sin', 'so',
    'sobre', 'tras', 'el', 'la', 'los', 'las', 'un', 'una', 'unos',
    'unas', 'y', 'o', 'pero', 'porque', 'que', 'qué', 'como', 'cómo',
    'cuando', 'cuándo', 'dónde', 'más', 'menos', 'muy', 'este', 'esta',
    'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella',
    'aquellos', 'aquellas', 'me', 'te', 'se', 'nos', 'os', 'le', 'les',
    'lo', 'la', 'los', 'las'
  ]);

  const normalizedInput = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Elimina diacríticos

  return normalizedInput.split(/\W+/).filter(word => word.length > 1 && !stopWords.has(word));
}

export function findBestMatch(input: string, options: string[]): string | null {
  const inputKeywords = new Set(extractKeywords(input));
  let bestMatch = null;
  let maxScore = 0;

  for (const option of options) {
    const optionKeywords = new Set(extractKeywords(option));
    const intersectionSize = new Set([...inputKeywords].filter(x => optionKeywords.has(x))).size;
    const score = intersectionSize / Math.max(inputKeywords.size, optionKeywords.size);

    if (score > maxScore) {
      maxScore = score;
      bestMatch = option;
    }
  }

  return bestMatch;
}

