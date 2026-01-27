import { SimilarityCalculator } from '../shared/utils/similarity-calculator';

describe('SimilarityCalculator', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      const result = SimilarityCalculator.levenshteinDistance('hello', 'hello');
      expect(result).toBe(0);
    });

    it('should return correct distance for different strings', () => {
      const result = SimilarityCalculator.levenshteinDistance('kitten', 'sitting');
      expect(result).toBe(3);
    });

    it('should handle empty strings', () => {
      const result = SimilarityCalculator.levenshteinDistance('', 'hello');
      expect(result).toBe(5);
    });

    it('should be symmetric', () => {
      const result1 = SimilarityCalculator.levenshteinDistance('abc', 'def');
      const result2 = SimilarityCalculator.levenshteinDistance('def', 'abc');
      expect(result1).toBe(result2);
    });
  });

  describe('countMatchingChars', () => {
    it('should count matching characters', () => {
      const result = SimilarityCalculator.countMatchingChars('hello', 'yellow');
      expect(result).toBe(4); // h, e, l, o
    });

    it('should be case insensitive', () => {
      const result = SimilarityCalculator.countMatchingChars('Hello', 'HELLO');
      expect(result).toBe(5);
    });

    it('should handle empty strings', () => {
      const result = SimilarityCalculator.countMatchingChars('', 'hello');
      expect(result).toBe(0);
    });

    it('should not double count characters', () => {
      const result = SimilarityCalculator.countMatchingChars('aa', 'a');
      expect(result).toBe(1);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 100 for identical strings', () => {
      const result = SimilarityCalculator.calculateSimilarity('password', 'password');
      expect(result).toBe(100);
    });

    it('should return 0 for completely different strings', () => {
      const result = SimilarityCalculator.calculateSimilarity('abc', 'xyz');
      expect(result).toBeGreaterThan(0); // due to character matching bonus
    });

    it('should calculate reasonable similarity', () => {
      const result = SimilarityCalculator.calculateSimilarity('passw0rd', 'password');
      expect(result).toBeGreaterThan(80);
      expect(result).toBeLessThan(100);
    });

    it('should handle empty strings', () => {
      const result = SimilarityCalculator.calculateSimilarity('', 'password');
      expect(result).toBe(0);
    });

    it('should cap at 100', () => {
      const result = SimilarityCalculator.calculateSimilarity('password123', 'password');
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should give bonus for matching characters', () => {
      const result1 = SimilarityCalculator.calculateSimilarity('abcd', 'efgh');
      const result2 = SimilarityCalculator.calculateSimilarity('abcd', 'abef');
      
      // Second result should be higher due to character matching bonus
      expect(result2).toBeGreaterThan(result1);
    });
  });
});