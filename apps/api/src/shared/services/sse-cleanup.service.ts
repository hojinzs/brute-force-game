import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CleanupEvent {
  type: 'connection' | 'rateLimit' | 'eventFilter' | 'memory';
  timestamp: Date;
  data: any;
}

@Injectable()
export class SseCleanupService {
  private readonly CLEANUP_THRESHOLD_MEMORY = 100 * 1024 * 1024; // 100MB
  private readonly CLEANUP_THRESHOLD_CONNECTIONS = 500;
  private eventQueue: CleanupEvent[] = [];
  private isProcessing = false;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen to connection events for immediate cleanup triggers
    this.eventEmitter.on('connection.established', () => {
      this.scheduleCleanup('connection', { trigger: 'new_connection' });
    });

    this.eventEmitter.on('connection.closed', () => {
      this.scheduleCleanup('connection', { trigger: 'connection_closed' });
    });

    this.eventEmitter.on('rate.limit.exceeded', () => {
      this.scheduleCleanup('rateLimit', { trigger: 'rate_limit_exceeded' });
    });

    this.eventEmitter.on('memory.high', () => {
      this.scheduleCleanup('memory', { trigger: 'memory_pressure' });
    });
  }

  scheduleCleanup(type: CleanupEvent['type'], data: any) {
    const event: CleanupEvent = {
      type,
      timestamp: new Date(),
      data,
    };

    this.eventQueue.push(event);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event) {
          await this.handleCleanupEvent(event);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async handleCleanupEvent(event: CleanupEvent): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(() => {
        switch (event.type) {
          case 'connection':
            this.handleConnectionCleanup(event);
            break;
          case 'rateLimit':
            this.handleRateLimitCleanup(event);
            break;
          case 'memory':
            this.handleMemoryCleanup(event);
            break;
          case 'eventFilter':
            this.handleEventFilterCleanup(event);
            break;
        }
        resolve();
      });
    });
  }

  private handleConnectionCleanup(event: CleanupEvent) {
    // Trigger connection cleanup based on event
    this.eventEmitter.emit('cleanup.connection', event.data);
  }

  private handleRateLimitCleanup(event: CleanupEvent) {
    // Trigger rate limit cleanup
    this.eventEmitter.emit('cleanup.rateLimit', event.data);
  }

  private handleMemoryCleanup(event: CleanupEvent) {
    // Aggressive cleanup when memory is high
    this.eventEmitter.emit('cleanup.memory', event.data);
    this.eventEmitter.emit('cleanup.connection', { aggressive: true });
    this.eventEmitter.emit('cleanup.eventFilter', { clearCache: true });
  }

  private handleEventFilterCleanup(event: CleanupEvent) {
    // Trigger event filter cache cleanup
    this.eventEmitter.emit('cleanup.eventFilter', event.data);
  }

  // Public method for manual cleanup trigger
  async triggerCleanup(type?: CleanupEvent['type']) {
    if (type) {
      this.scheduleCleanup(type, { trigger: 'manual' });
    } else {
      // Trigger all cleanup types
      this.scheduleCleanup('connection', { trigger: 'manual' });
      this.scheduleCleanup('rateLimit', { trigger: 'manual' });
      this.scheduleCleanup('eventFilter', { trigger: 'manual' });
    }
  }

  getCleanupStats() {
    return {
      queueLength: this.eventQueue.length,
      isProcessing: this.isProcessing,
      lastCleanupEvents: this.eventQueue.slice(-5),
    };
  }
}