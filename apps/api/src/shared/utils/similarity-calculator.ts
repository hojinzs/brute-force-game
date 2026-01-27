export class SimilarityCalculator {
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  static countMatchingChars(str1: string, str2: string): number {
    const chars1 = new Set(str1.toLowerCase());
    const chars2 = new Set(str2.toLowerCase());
    const intersection = new Set([...chars1].filter(char => chars2.has(char)));
    return intersection.size;
  }

  static calculateSimilarity(input: string, answer: string): number {
    if (!input || !answer) return 0;

    const distance = this.levenshteinDistance(input, answer);
    const maxLength = Math.max(input.length, answer.length);
    
    if (maxLength === 0) return 100;

    const baseSimilarity = ((maxLength - distance) / maxLength) * 100;

    // Character matching bonus (max 10% extra)
    const matchingChars = this.countMatchingChars(input, answer);
    const bonus = (matchingChars / answer.length) * 10;

    return Math.min(baseSimilarity + bonus, 100);
  }
}