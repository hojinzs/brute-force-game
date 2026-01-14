function calculateLevenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

export function calculateSimilarity(input: string, answer: string): number {
  if (input === answer) return 100;
  
  if (input.length === 0 || answer.length === 0) return 0;
  
  const distance = calculateLevenshteinDistance(input, answer);
  const maxLength = Math.max(input.length, answer.length);
  
  const levenshteinSimilarity = ((maxLength - distance) / maxLength) * 100;
  
  const inputChars = new Set(input.split(''));
  const answerChars = new Set(answer.split(''));
  const intersection = new Set([...inputChars].filter(x => answerChars.has(x)));
  
  const charMatchRatio = answerChars.size > 0 
    ? intersection.size / answerChars.size 
    : 0;
  
  const charMatchBonus = charMatchRatio * 20;
  
  const finalSimilarity = levenshteinSimilarity * 0.8 + charMatchBonus * 0.2;
  
  return Math.min(100, Math.round(finalSimilarity));
}
