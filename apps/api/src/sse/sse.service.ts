import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SseGateway } from './gateway/sse.gateway';

export interface SseEventData {
  type: 'attempt' | 'block-status' | 'ranking' | 'presence';
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
  status: 'ACTIVE' | 'PENDING' | 'PROCESSING' | 'SOLVED';
  winnerId?: string;
  winnerNickname?: string;
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
    
    this.eventEmitter.emit('sse.attempt', eventData);
    this.sseGateway.broadcastToFeed('attempt', event);
  }

  emitBlockStatusChange(event: BlockStatusEvent) {
    const eventData: SseEventData = {
      type: 'block-status',
      data: event,
      timestamp: new Date(),
    };
    
    this.eventEmitter.emit('sse.block-status', eventData);
    this.sseGateway.broadcastToBlocks('block-status', event);
  }

  emitRankingUpdate(event: RankingEvent) {
    const eventData: SseEventData = {
      type: 'ranking',
      data: event,
      timestamp: new Date(),
    };
    
    this.eventEmitter.emit('sse.ranking', eventData);
    this.sseGateway.broadcastToRankings('ranking', event);
  }

  emitPresenceUpdate(event: PresenceEvent) {
    const eventData: SseEventData = {
      type: 'presence',
      data: event,
      timestamp: new Date(),
    };
    
    this.eventEmitter.emit('sse.presence', eventData);
    this.sseGateway.broadcastToPresence('presence', event);
  }
}