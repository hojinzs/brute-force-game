import { Injectable } from '@nestjs/common';
import { SseService } from '../../sse/sse.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PresenceService {
  private onlineUsers = new Map<string, { nickname: string; joinedAt: Date }>();

  constructor(private readonly sseService: SseService) {}

  @OnEvent('auth.login')
  handleUserLogin(data: { userId: string; nickname: string; timestamp: Date }) {
    this.userJoined(data.userId, data.nickname);
  }

  @OnEvent('auth.logout')
  handleUserLogout(data: { userId: string; timestamp: Date }) {
    this.userLeft(data.userId);
  }

  userJoined(userId: string, nickname: string) {
    this.onlineUsers.set(userId, { nickname, joinedAt: new Date() });
    
    this.sseService.emitPresenceUpdate({
      userId,
      nickname,
      action: 'join',
      onlineCount: this.onlineUsers.size,
    });
  }

  userLeft(userId: string) {
    const userInfo = this.onlineUsers.get(userId);
    if (userInfo) {
      this.onlineUsers.delete(userId);
      
      this.sseService.emitPresenceUpdate({
        userId,
        nickname: userInfo.nickname,
        action: 'leave',
        onlineCount: this.onlineUsers.size,
      });
    }
  }

  updateUserActivity(userId: string) {
    const userInfo = this.onlineUsers.get(userId);
    if (userInfo) {
      this.sseService.emitPresenceUpdate({
        userId,
        nickname: userInfo.nickname,
        action: 'activity',
        onlineCount: this.onlineUsers.size,
      });
    }
  }

  getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  getOnlineUsersList(): Array<{ userId: string; nickname: string; joinedAt: Date }> {
    return Array.from(this.onlineUsers.entries()).map(([userId, info]) => ({
      userId,
      nickname: info.nickname,
      joinedAt: info.joinedAt,
    }));
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}