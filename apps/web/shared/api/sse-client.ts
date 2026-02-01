export interface SSEOptions {
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  eventHandlers?: Record<string, (data: unknown) => void>;
}

export interface SSEConnection {
  close: () => void;
}

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];

type SseEnvelope = {
  type: string;
  data: unknown;
  timestamp?: string;
};

function isSseEnvelope(value: unknown): value is SseEnvelope {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.type === "string" && "data" in record;
}

export function createSSEConnection(
  endpoint: string,
  options: SSEOptions = {}
): SSEConnection {
  let eventSource: EventSource | null = null;
  let retryCount = 0;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;

    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${baseURL}${endpoint}`;

    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      retryCount = 0;
      options.onOpen?.();
    };

    eventSource.onerror = (error) => {
      options.onError?.(error);
      eventSource?.close();

      if (!isClosed && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount];
        retryCount++;
        setTimeout(connect, delay);
      }
    };

    eventSource.onmessage = (event) => {
      options.onMessage?.(event);

      try {
        const message: unknown = JSON.parse(event.data);
        if (isSseEnvelope(message) && options.eventHandlers?.[message.type]) {
          options.eventHandlers[message.type](message.data);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    if (options.eventHandlers) {
      Object.keys(options.eventHandlers).forEach((eventType) => {
        eventSource?.addEventListener(eventType, (event) => {
          try {
            const message: unknown = JSON.parse((event as MessageEvent).data);
            const payload = isSseEnvelope(message) ? message.data : message;
            options.eventHandlers?.[eventType](payload);
          } catch (error) {
            console.error(`Failed to parse ${eventType} event:`, error);
          }
        });
      });
    }
  };

  connect();

  return {
    close: () => {
      isClosed = true;
      eventSource?.close();
    },
  };
}
