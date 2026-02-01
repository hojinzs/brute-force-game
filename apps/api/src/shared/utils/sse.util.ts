import type { Response, Request } from 'express';
import { getCorsOrigin } from './cors.util';

/**
 * SSE Connection Configuration
 */
export interface SseConfig {
  /** Connection type identifier */
  type: 'feed' | 'rankings' | 'blocks' | 'presence';
  /** Heartbeat interval in milliseconds (default: 30000) */
  heartbeatInterval?: number;
}

/**
 * SSE Connection Instance
 */
export interface SseConnection {
  /** Unique connection identifier */
  connectionId: string;
  /** Heartbeat interval handle */
  heartbeat: NodeJS.Timeout;
  /** Cleanup function to call on disconnect */
  cleanup: () => void;
}

/**
 * Event Listener with Unsubscribe Function
 */
export interface EventSubscription {
  /** Event handler function */
  handler: (data: any) => void;
  /** Unsubscribe from event */
  unsubscribe: () => void;
}

/**
 * Generate unique connection ID
 * @param type - Connection type
 * @returns Unique connection ID in format: {type}_{timestamp}_{random}
 */
export function generateConnectionId(type: string): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get SSE headers with CORS configuration
 * @param origin - Request origin header
 * @returns Headers object or null if origin is not allowed
 */
export function getSseHeaders(origin: string | undefined): Record<string, string> | null {
  const corsOrigin = getCorsOrigin(origin);
  if (!corsOrigin) return null;

  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'Access-Control-Allow-Origin': corsOrigin,
  };
}

/**
 * Write SSE event to response stream
 * @param res - Express response object
 * @param event - Event name
 * @param data - Event data (will be JSON stringified)
 */
export function writeSseEvent(res: Response, event: string, data: any): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Write initial 'connected' event
 * @param res - Express response object
 * @param connectionId - Connection identifier
 */
export function writeConnectedEvent(res: Response, connectionId: string): void {
  writeSseEvent(res, 'connected', {
    type: 'connected',
    connectionId,
    timestamp: new Date(),
  });
}

/**
 * Setup SSE connection with headers, heartbeat, and connection tracking
 * @param res - Express response object
 * @param req - Express request object
 * @param config - SSE configuration
 * @param connectionManager - Connection manager service
 * @param userId - Optional user identifier
 * @returns SseConnection object or null if CORS validation fails
 */
export function setupSseConnection(
  res: Response,
  req: Request,
  config: SseConfig,
  connectionManager: { 
    addConnection: (id: string, type: string, userId?: string) => void;
    removeConnection: (id: string) => void;
    updateActivity: (id: string) => void;
  },
  userId?: string,
): SseConnection | null {
  // Validate CORS origin
  const headers = getSseHeaders(req.headers.origin);
  if (!headers) {
    res.status(403).send('Forbidden');
    return null;
  }

  // Generate unique connection ID
  const connectionId = generateConnectionId(config.type);
  
  // Register connection
  connectionManager.addConnection(connectionId, config.type, userId);

  // Write headers and connected event
  res.writeHead(200, headers);
  writeConnectedEvent(res, connectionId);

  // Setup heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
    connectionManager.updateActivity(connectionId);
  }, config.heartbeatInterval ?? 30000);

  return {
    connectionId,
    heartbeat,
    cleanup: () => {
      clearInterval(heartbeat);
      connectionManager.removeConnection(connectionId);
    },
  };
}

/**
 * Create event handler for SSE event emission
 * @param res - Express response object
 * @param eventName - Event name (without 'sse.' prefix)
 * @param eventEmitter - NestJS EventEmitter2 instance
 * @param filter - Optional filter function to determine if event should be sent
 * @returns EventSubscription with handler and unsubscribe function
 */
export function createEventHandler(
  res: Response,
  eventName: string,
  eventEmitter: {
    on: (event: string, handler: (data: any) => void) => void;
    off: (event: string, handler: (data: any) => void) => void;
  },
  filter?: (data: any) => boolean,
): EventSubscription {
  const handler = (data: any) => {
    if (!filter || filter(data)) {
      writeSseEvent(res, eventName, data);
    }
  };

  const fullEventName = `sse.${eventName}`;
  eventEmitter.on(fullEventName, handler);

  return {
    handler,
    unsubscribe: () => eventEmitter.off(fullEventName, handler),
  };
}
