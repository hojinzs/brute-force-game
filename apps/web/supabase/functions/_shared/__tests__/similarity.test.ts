import { calculateSimilarity } from '../utils/similarity';

describe('calculateSimilarity', () => {
  describe('identical strings', () => {
    test('should return 100% for identical strings', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(100);
      expect(calculateSimilarity('123456', '123456')).toBe(100);
      expect(calculateSimilarity('', '')).toBe(100);
    });
  });

  describe('single character difference', () => {
    test('should return high similarity for one character difference', () => {
      const similarity = calculateSimilarity('test-word', 'test-work');
      expect(similarity).toBeGreaterThanOrEqual(70);
      expect(similarity).toBeLessThanOrEqual(80);
    });

    test('should handle single character substitution', () => {
      const similarity = calculateSimilarity('cat', 'bat');
      expect(similarity).toBeGreaterThanOrEqual(50);
      expect(similarity).toBeLessThanOrEqual(60);
    });
  });

  describe('multiple character differences', () => {
    test('should return moderate similarity for multiple differences', () => {
      const similarity = calculateSimilarity('123456', '123457');
      expect(similarity).toBeGreaterThanOrEqual(65);
      expect(similarity).toBeLessThanOrEqual(75);
    });

    test('should handle complete mismatch', () => {
      const similarity = calculateSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThan(20);
    });

    test('should handle length mismatch', () => {
      const similarity = calculateSimilarity('short', 'much longer string');
      expect(similarity).toBeLessThan(50);
    });
  });

  describe('edge cases', () => {
    test('should handle empty input', () => {
      expect(calculateSimilarity('', 'hello')).toBe(0);
      expect(calculateSimilarity('hello', '')).toBe(0);
    });

    test('should handle case sensitivity', () => {
      const similarity = calculateSimilarity('Hello', 'hello');
      expect(similarity).toBeLessThan(100);
      expect(similarity).toBeGreaterThan(65);
    });

    test('should handle special characters', () => {
      const similarity = calculateSimilarity('hello!', 'hello?');
      expect(similarity).toBeGreaterThan(65);
    });

    test('should handle numbers', () => {
      const similarity = calculateSimilarity('12345', '12346');
      expect(similarity).toBeGreaterThanOrEqual(65);
      expect(similarity).toBeLessThanOrEqual(75);
    });
  });

  describe('real-world scenarios', () => {
    test('should handle password brute-force attempts', () => {
      const target = 'password123';
      
      expect(calculateSimilarity('password123', target)).toBe(100);
      expect(calculateSimilarity('password124', target)).toBeGreaterThanOrEqual(75);
      expect(calculateSimilarity('password', target)).toBeGreaterThanOrEqual(60);
      expect(calculateSimilarity('passwor', target)).toBeGreaterThanOrEqual(50);
      expect(calculateSimilarity('completely_different', target)).toBeLessThan(30);
    });

    test('should handle similar patterns', () => {
      const target = 'admin2024';
      
      expect(calculateSimilarity('admin2023', target)).toBeGreaterThanOrEqual(75);
      expect(calculateSimilarity('admin', target)).toBeGreaterThanOrEqual(45);
    });
  });

  describe('boundary values', () => {
    test('should never exceed 100%', () => {
      expect(calculateSimilarity('test', 'test')).toBeLessThanOrEqual(100);
    });

    test('should never be negative', () => {
      expect(calculateSimilarity('abc', 'xyz')).toBeGreaterThanOrEqual(0);
    });

    test('should return integer values', () => {
      const result = calculateSimilarity('hello', 'hallo');
      expect(Number.isInteger(result)).toBe(true);
    });
  });
});
