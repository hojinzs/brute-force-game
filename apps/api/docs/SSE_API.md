# SSE (Server-Sent Events) API Documentation

## Overview

Real-time API endpoints for component-level subscriptions to game events using Server-Sent Events (SSE).

## Base URL
```
http://localhost:3001/api/sse
```

## Authentication
Optional: Pass `userId` query parameter for user-specific tracking.

## Endpoints

### 1. Feed Events `/api/sse/feed`
Real-time feed of new attempt submissions.

**Request:**
```bash
GET /api/sse/feed?userId={userId}
Accept: text/event-stream
```

**Events:**
- `attempt` - New attempt submission
- `connected` - Initial connection established

**Example Event:**
```json
event: attempt
data: {
  "blockId": "123",
  "userId": "user_abc123",
  "nickname": "player1",
  "inputValue": "test123",
  "similarity": 85.5,
  "isFirstSubmission": true,
  "createdAt": "2026-01-27T10:30:00.000Z"
}
```

### 2. Ranking Events `/api/sse/rankings`
Real-time leaderboard updates and ranking changes.

**Request:**
```bash
GET /api/sse/rankings?userId={userId}
Accept: text/event-stream
```

**Events:**
- `ranking` - User ranking updates
- `connected` - Initial connection established

**Example Event:**
```json
event: ranking
data: {
  "userId": "user_abc123",
  "nickname": "player1",
  "rank": 1,
  "points": 1500,
  "change": 100
}
```

### 3. Block Events `/api/sse/blocks`
Real-time block status changes and game state updates.

**Request:**
```bash
GET /api/sse/blocks?userId={userId}
Accept: text/event-stream
```

**Events:**
- `block-status` - Block status changes
- `connected` - Initial connection established

**Example Event:**
```json
event: block-status
data: {
  "blockId": "123",
  "status": "SOLVED",
  "winnerId": "user_abc123",
  "winnerNickname": "player1",
  "solvedAt": "2026-01-27T10:30:00.000Z"
}
```

### 4. Presence Events `/api/sse/presence`
Real-time user presence and online activity tracking.

**Request:**
```bash
GET /api/sse/presence?userId={userId}
Accept: text/event-stream
```

**Events:**
- `presence` - User presence updates (join/leave/activity)
- `connected` - Initial connection established

**Example Event:**
```json
event: presence
data: {
  "userId": "user_abc123",
  "nickname": "player1",
  "action": "join",
  "onlineCount": 25
}
```

## Connection Management

### Heartbeat
- Every 30 seconds, a `: heartbeat` comment is sent to keep the connection alive
- Clients should ignore comments but maintain the connection

### Reconnection
If the connection is lost, clients should:
1. Re-establish the connection
2. Re-subscribe to the same endpoints
3. Handle any missed events through polling if needed

## Health Check

### GET `/api/sse/health`
Get SSE service health and connection statistics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T10:30:00.000Z",
  "sse": {
    "activeConnections": 15,
    "connectionsByType": {
      "feed": 5,
      "rankings": 4,
      "blocks": 3,
      "presence": 3
    },
    "uptime": 3600.5
  }
}
```

### GET `/api/sse/stats`
Observable stream of connection statistics (updates every 5 seconds).

**Response Stream:**
```json
{
  "timestamp": "2026-01-27T10:30:00.000Z",
  "total": 15,
  "byType": {
    "feed": 5,
    "rankings": 4,
    "blocks": 3,
    "presence": 3
  }
}
```

## WebSocket Alternative

For bidirectional communication, WebSocket is available at:
```
ws://localhost:3001/sse
```

### WebSocket Events
- `subscribe` - Subscribe to channels
- `unsubscribe` - Unsubscribe from channels
- `attempt` - Receive attempt events
- `block-status` - Receive block events
- `ranking` - Receive ranking events
- `presence` - Receive presence events

**Subscribe Example:**
```javascript
socket.emit('subscribe', {
  channels: ['feed', 'rankings'],
  userId: 'user_abc123',
  nickname: 'player1'
});
```

## Error Handling

### HTTP Errors
- `401` - Authentication required for protected resources
- `429` - Rate limit exceeded
- `500` - Internal server error

### SSE Errors
- Connection timeouts are handled with automatic reconnection
- Malformed events are ignored by clients
- Server errors are logged and connections are maintained

## Rate Limiting

- No specific rate limiting for SSE connections
- Each client can maintain multiple simultaneous connections
- Connection cleanup occurs for stale connections (5 minutes)

## CORS

Allowed origins:
- `http://localhost:3000` (development)
- Configurable via `FRONTEND_URL` environment variable

## Usage Examples

### JavaScript Client (EventSource)
```javascript
const eventSource = new EventSource('/api/sse/feed?userId=user123');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New attempt:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // Reconnect logic
  setTimeout(() => {
    eventSource.close();
    // Recreate connection
  }, 5000);
};
```

### React Hook Example
```javascript
import { useEffect, useState } from 'react';

function useFeedSse(userId) {
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/sse/feed?userId=${userId}`);

    eventSource.addEventListener('attempt', (event) => {
      const attempt = JSON.parse(event.data);
      setAttempts(prev => [attempt, ...prev.slice(0, 49)]);
    });

    return () => eventSource.close();
  }, [userId]);

  return attempts;
}
```