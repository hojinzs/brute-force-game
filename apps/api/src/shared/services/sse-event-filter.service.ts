import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface EventFilter {
  userId?: string;
  anonymous?: boolean;
  includeSelf?: boolean;
  maxSimilarity?: number;
  minSimilarity?: number;
  shouldIncludeEvent(data: any): boolean;
}

export interface FilteredAttemptEvent {
  blockId: string;
  userId?: string;
  nickname?: string;
  inputValue: string;
  similarity: number;
  isFirstSubmission: boolean;
  createdAt: Date;
  isOwn?: boolean;
}

export interface FilteredPresenceEvent {
  userId?: string;
  nickname?: string;
  action: 'join' | 'leave' | 'activity';
  onlineCount: number;
  isOwn?: boolean;
}

@Injectable()
export class SseEventFilterService {
  private filterCache = new Map<string, FilteredAttemptEvent>();
  private readonly CACHE_TTL = 5000; // 5 seconds
  private readonly MAX_CACHE_SIZE = 1000;

  async filterAttemptEvent(event: any, filter?: EventFilter): Promise<FilteredAttemptEvent | null> {
    // Create cache key for performance
    const cacheKey = this.createCacheKey('attempt', event, filter);
    
    // Check cache first
    const cached = this.filterCache.get(cacheKey);
    if (cached && (Date.now() - cached.createdAt.getTime()) < this.CACHE_TTL) {
      return cached;
    }

    // Process filtering asynchronously
    const filtered = await this.processFilterAttemptEvent(event, filter);

    // Update cache if result is valid
    if (filtered && this.filterCache.size < this.MAX_CACHE_SIZE) {
      this.filterCache.set(cacheKey, filtered);
    }

    return filtered;
  }

  private async processFilterAttemptEvent(event: any, filter?: EventFilter): Promise<FilteredAttemptEvent | null> {
    return new Promise((resolve) => {
      setImmediate(() => {
        const filtered: FilteredAttemptEvent = {
          blockId: event.blockId,
          userId: event.userId,
          nickname: event.nickname,
          inputValue: event.inputValue,
          similarity: event.similarity,
          isFirstSubmission: event.isFirstSubmission,
          createdAt: event.createdAt,
        };

        // Apply similarity filters
        if (filter?.maxSimilarity !== undefined && event.similarity > filter.maxSimilarity) {
          filtered.similarity = Math.min(filter.maxSimilarity, event.similarity);
        }

        if (filter?.minSimilarity !== undefined && event.similarity < filter.minSimilarity) {
          // Don't send events below minimum similarity threshold
          resolve(null);
          return;
        }

        // Apply privacy filters
        if (filter?.anonymous || this.shouldAnonymizeUser(event.userId, filter)) {
          filtered.userId = undefined;
          filtered.nickname = 'Anonymous';
        }

        // Mark as own event for requesting user
        if (filter?.userId === event.userId) {
          filtered.isOwn = true;
          if (filter?.includeSelf === false) {
            // Don't send self events if explicitly disabled
            resolve(null);
            return;
          }
        }

        resolve(filtered);
      });
    });
  }

  

  async filterPresenceEvent(event: any, filter?: EventFilter): Promise<FilteredPresenceEvent | null> {
    // Process filtering asynchronously
    return this.processFilterPresenceEvent(event, filter);
  }

  private async processFilterPresenceEvent(event: any, filter?: EventFilter): Promise<FilteredPresenceEvent | null> {
    return new Promise((resolve) => {
      setImmediate(() => {
        const filtered: FilteredPresenceEvent = {
          userId: event.userId,
          nickname: event.nickname,
          action: event.action,
          onlineCount: event.onlineCount,
        };

        // Apply privacy filters
        if (filter?.anonymous || this.shouldAnonymizeUser(event.userId, filter)) {
          filtered.userId = undefined;
          filtered.nickname = 'Anonymous';
        }

        // Mark as own event for requesting user
        if (filter?.userId === event.userId) {
          filtered.isOwn = true;
          if (filter?.includeSelf === false) {
            // Don't send self presence events
            resolve(null);
            return;
          }
        }

        resolve(filtered);
      });
    });
  }

  filterRankingEvent(event: any, filter?: EventFilter) {
    // Ranking events are generally public, but can be filtered
    return event;
  }

  filterBlockStatusEvent(event: any, filter?: EventFilter) {
    // Block status events are generally public
    return event;
  }

  private createCacheKey(eventType: string, event: any, filter?: EventFilter): string {
    const filterStr = filter ? JSON.stringify(filter) : '';
    const eventStr = JSON.stringify({ blockId: event.blockId, userId: event.userId });
    return `${eventType}_${eventStr}_${filterStr}`;
  }

  private shouldAnonymizeUser(userId: string, filter?: EventFilter): boolean {
    // Default: anonymize if no user context provided
    return !filter?.userId;
  }

  async createUserFilter(userId?: string, preferences?: {
    anonymous?: boolean;
    includeSelf?: boolean;
    showSimilarityAbove?: number;
    hideSimilarityBelow?: number;
  }): Promise<EventFilter> {
    return new Promise((resolve) => {
      setImmediate(() => {
        resolve({
          userId,
          anonymous: preferences?.anonymous ?? false,
          includeSelf: preferences?.includeSelf ?? true,
          maxSimilarity: preferences?.showSimilarityAbove ? 100 - preferences.showSimilarityAbove : undefined,
          minSimilarity: preferences?.hideSimilarityBelow,
          shouldIncludeEvent: (data: any) => {
            // Basic filtering logic - can be extended
            if (data.userId === userId && preferences?.includeSelf === false) {
              return false;
            }
            if (preferences?.hideSimilarityBelow && data.similarity < preferences.hideSimilarityBelow) {
              return false;
            }
            return true;
          },
        });
      });
    });
  }

  // Cleanup cache method
  cleanupCache() {
    if (this.filterCache.size > this.MAX_CACHE_SIZE * 0.8) {
      // Clear oldest entries when cache gets too full
      const entries = Array.from(this.filterCache.entries());
      entries.sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());
      const toDelete = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.3));
      toDelete.forEach(([key]) => this.filterCache.delete(key));
    }
  }
}