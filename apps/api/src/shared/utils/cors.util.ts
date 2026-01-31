/**
 * CORS utility for handling Cross-Origin Resource Sharing configuration
 * Supports wildcard (*) or comma-separated list of allowed origins
 */

/**
 * Determines the appropriate CORS origin header value based on the request origin
 * and the CORS_ORIGINS environment variable.
 * 
 * @param requestOrigin - The origin from the incoming request
 * @returns The origin to include in the Access-Control-Allow-Origin header, or false if not allowed
 * 
 * @example
 * // With CORS_ORIGINS="*"
 * getCorsOrigin('http://example.com') // returns '*'
 * 
 * @example
 * // With CORS_ORIGINS="http://localhost:3000,https://example.com"
 * getCorsOrigin('http://localhost:3000') // returns 'http://localhost:3000'
 * getCorsOrigin('http://evil.com') // returns false
 */
export function getCorsOrigin(requestOrigin: string | undefined): string | false {
  const corsOrigins = process.env.CORS_ORIGINS || '*';
  
  // Wildcard - allow all origins
  if (corsOrigins === '*') {
    return '*';
  }
  
  // Parse comma-separated list of allowed origins
  const allowedOrigins = corsOrigins.split(',').map(o => o.trim());
  
  // Check if request origin is in the allowed list
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  
  // Origin not allowed
  return false;
}
