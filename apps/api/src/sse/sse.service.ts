import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SseGateway } from './gateway/sse.gateway';

export interface SseEventData {
  type: 'attempt' | 'block-status' | 'ranking' | 'presence' | 'top-attempts' | 'current-block';
  data: any;
  timestamp: Date;
}

export interface AttemptEvent {
  blockId: string;
  userId: string;
  nickname: string;
  inputValue: string;
  similarity: number;
  isFirstSubmission: boolean;
  createdAt: Date;
}

export interface BlockStatusEvent {
  blockId: string;
  status: 'WAITING_HINT' | 'WAITING_PASSWORD' | 'ACTIVE' | 'SOLVED';
  winnerId?: string;
  winnerNickname?: string;
  blockMasterId?: string;
  waitingStartedAt?: Date;
  solvedAt?: Date;
}

export interface RankingEvent {
  userId: string;
  nickname: string;
  rank: number;
  points: number;
  change: number;
}

export interface PresenceEvent {
  userId: string;
  nickname: string;
  action: 'join' | 'leave' | 'activity';
  onlineCount: number;
}

export interface TopAttemptsEvent {
  blockId: string;
  attempts: {
    userId: string;
    nickname: string;
    inputValue: string;
    similarity: number;
    isFirstSubmission: boolean;
    createdAt: Date;
  }[];
}

export interface CurrentBlockEvent {
  id: string;
  status: string;
  seedHint: string;
  difficultyConfig: any;
  accumulatedPoints: string;
  attemptCount: number;
  createdAt: Date;
}

@Injectable()
export class SseService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly sseGateway: SseGateway,
  ) {}

  emitNewAttempt(event: AttemptEvent) {
    const eventData: SseEventData = {
      type: 'attempt',
      data: event,
      timestamp: new Date(),
    };
    
    // Only emit via EventEmitter - SseGateway will handle the broadcasting
    this.eventEmitter.emit('sse.attempt', eventData);
  }

  emitBlockStatusChange(event: BlockStatusEvent) {
    const eventData: SseEventData = {
      type: 'block-status',
      data: event,
      timestamp: new Date(),
    };
    
    this.eventEmitter.emit('sse.block-status', eventData);
    this.eventEmitter.emit('block.statusChanged', event);
  }

  emitRankingUpdate(event: RankingEvent) {
    const eventData: SseEventData = {
      type: 'ranking',
      data: event,
      timestamp: new Date(),
    };
    
    // Only emit via EventEmitter - SseGateway will handle the broadcasting
    this.eventEmitter.emit('sse.ranking', eventData);
  }

  emitPresenceUpdate(event: PresenceEvent) {
    const eventData: SseEventData = {
      type: 'presence',
      data: event,
      timestamp: new Date(),
    };
    
    // Only emit via EventEmitter - SseGateway will handle the broadcasting
    this.eventEmitter.emit('sse.presence', eventData);
  }

  emitTopAttemptsUpdate(event: TopAttemptsEvent) {
    const eventData: SseEventData = {
      type: 'top-attempts',
      data: event,
      timestamp: new Date(),
    };
    
    this.eventEmitter.emit('sse.top-attempts', eventData);
  }

  emitCurrentBlockUpdate(event: CurrentBlockEvent) {
    const eventData: SseEventData = {
      type: 'current-block',
      data: event,
      timestamp: new Date(),
    };
    
    this.eventEmitter.emit('sse.current-block', eventData);
  }
}