import { getCorsOrigin } from '../shared/utils/cors.util';

describe('CORS Configuration', () => {
  const originalEnv = process.env.CORS_ORIGINS;

  afterEach(() => {
    process.env.CORS_ORIGINS = originalEnv;
  });

  describe('getCorsOrigin utility', () => {
    it('should return "*" when CORS_ORIGINS="*"', () => {
      process.env.CORS_ORIGINS = '*';
      const result = getCorsOrigin('http://example.com');
      expect(result).toBe('*');
    });

    it('should return "*" when CORS_ORIGINS is not set (default)', () => {
      delete process.env.CORS_ORIGINS;
      const result = getCorsOrigin('http://example.com');
      expect(result).toBe('*');
    });

    it('should return origin when in allowed list', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com';
      const result = getCorsOrigin('http://localhost:3000');
      expect(result).toBe('http://localhost:3000');
    });

    it('should return false when not in allowed list', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com';
      const result = getCorsOrigin('http://evil.com');
      expect(result).toBe(false);
    });

    it('should handle comma-separated origins with spaces', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000 , https://example.com , https://test.com';
      expect(getCorsOrigin('http://localhost:3000')).toBe('http://localhost:3000');
      expect(getCorsOrigin('https://example.com')).toBe('https://example.com');
      expect(getCorsOrigin('https://test.com')).toBe('https://test.com');
    });

    it('should return false when requestOrigin is undefined and CORS_ORIGINS is not wildcard', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000';
      const result = getCorsOrigin(undefined);
      expect(result).toBe(false);
    });

    it('should return "*" when requestOrigin is undefined and CORS_ORIGINS is wildcard', () => {
      process.env.CORS_ORIGINS = '*';
      const result = getCorsOrigin(undefined);
      expect(result).toBe('*');
    });
  });
});
