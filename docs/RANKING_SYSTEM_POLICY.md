# [시스템 정책서] 랭킹 시스템 (Ranking System)

## 1. 개요

블록 해결 시 누적된 포인트를 승자가 독점 획득하는 보상 시스템입니다. 유저들의 총 누적 포인트를 기반으로 글로벌 랭킹을 산출합니다.

### 1.1 핵심 메커니즘

| 구분 | 설명 |
|------|------|
| **포인트 누적** | 블록에 대한 모든 시도(오답/정답)마다 1 CP = 1 포인트가 해당 블록에 누적 |
| **독점 보상** | 블록을 해결한 승자가 누적된 포인트 전액을 획득 |
| **랭킹 산출** | 유저별 총 누적 포인트(total_points) 기준 내림차순 정렬 |
| **리셋 주기** | 영구 누적 (시즌제는 향후 검토) |

### 1.2 포인트 흐름

```
[유저 A 오답 제출] → CP -1, block.accumulated_points +1, attempts 저장 (similarity: 계산값)
[유저 B 오답 제출] → CP -1, block.accumulated_points +1, attempts 저장 (similarity: 계산값)
[유저 C 오답 제출] → CP -1, block.accumulated_points +1, attempts 저장 (similarity: 계산값)
...
[유저 D 정답 제출] → CP -1, block.accumulated_points +1, attempts 저장 (similarity: 100)
                    → 유저 D가 block.accumulated_points 전액 획득
                    → 유저 D의 total_points += block.accumulated_points
```

**중요**: 정답 시에도 `attempts` 테이블에 `similarity: 100`으로 기록됩니다. 이를 통해 모든 시도(정답/오답)가 추적 가능합니다.

---

## 2. 데이터베이스 스키마

### 2.1 blocks 테이블 확장

```sql
-- 블록에 누적된 포인트 (Prize Pool)
accumulated_points bigint NOT NULL DEFAULT 0
```

### 2.2 profiles 테이블 확장

```sql
-- 유저의 총 누적 포인트
total_points bigint NOT NULL DEFAULT 0
```

### 2.3 인덱스

```sql
-- 랭킹 조회 최적화
CREATE INDEX profiles_total_points_idx ON profiles(total_points DESC);
```

### 2.4 RPC 함수

```sql
-- 블록 포인트 증가
increment_block_points(p_block_id bigint) RETURNS bigint

-- 승자에게 포인트 지급
award_points_to_winner(p_block_id bigint, p_winner_id uuid) RETURNS bigint

-- 유저 순위 조회
get_user_rank(p_user_id uuid) RETURNS bigint
```

---

## 3. Edge Function 수정사항

### 3.1 check-answer 함수 변경

**기존 로직:**
1. CP 잔액 확인 및 1 차감
2. 정답 해시 대조
3. 정답 시: 블록 상태 변경, 승리자 ID 기록
4. 오답 시: 유사도 계산, attempts 테이블 Insert

**변경된 로직:**
1. CP 잔액 확인 및 1 차감
2. 블록 조회 및 상태 확인
3. `blocks.accumulated_points += 1` (정답/오답 무관)
4. 정답 해시 대조
5. **정답 시:**
   - `attempts` 테이블에 `similarity: 100`으로 Insert
   - `award_points_to_winner` RPC 호출 (승자 포인트 지급)
   - 블록 상태 변경 (pending)
6. **오답 시:**
   - 유사도 계산
   - `attempts` 테이블에 계산된 유사도로 Insert

### 3.2 응답 형식 확장

```typescript
interface SuccessResponse {
  correct: boolean;
  similarity?: number;
  attemptId?: string;
  pointsAwarded?: number;  // 정답 시 획득 포인트
}
```

---

## 4. 실시간 동기화

### 4.1 Realtime 구독 대상

| 이벤트 | 테이블 | 용도 |
|--------|--------|------|
| UPDATE | blocks.accumulated_points | 블록 포인트 실시간 갱신 UI |
| UPDATE | blocks.status | 승리 감지 |

### 4.2 클라이언트 구독 전략

- `blocks` 테이블의 `UPDATE` 이벤트 구독
- `accumulated_points` 변경 시 UI 즉시 반영
- 애니메이션: 숫자 카운트업 효과 (pulse)

---

## 5. UI 명세

### 5.1 게임 화면 (BlockHeader 영역)

**위치:** 블록 번호 아래, 힌트 위

**표시 형식:**
```
BLOCK #42  [ACTIVE]
━━━━━━━━━━━━━━━━━━
Prize Pool: 156 pts     ← 실시간 갱신
Created by: alice
Hint: Something about cats...
Length: 8 characters
[a-z] [A-Z] [0-9] [!@#]
```

**실시간 갱신 인터랙션:**
- 다른 유저 실패 시: 포인트 숫자가 +1 증가하며 pulse 애니메이션
- 색상: 포인트가 높을수록 강조 (예: 1000+ 골드, 500+ 실버, 100+ 브론즈)

**포인트 표시 포맷:**
- 순수 숫자: `156 pts`
- 향후 확장: 대형 숫자 시 축약 (`1.5K`, `23.4K`) 검토

### 5.2 게임 화면 내 Top 50 랭킹

**위치:** StatsPanel 내 "Ranking" 블록

**표시 내용:**
```
🏆 TOP PLAYERS
━━━━━━━━━━━━━━━━━━
🥇 1. hacker_master    12,450
🥈 2. code_ninja       11,892
🥉 3. crypto_queen     10,234
   4. byte_breaker      9,876
...
   10. player_xyz       1,234

📍 Your Rank: #127 (2,345 pts)  ← 50위 밖일 때만 표시

[View All →]  ← /ranking 페이지로 이동
```

**컴포넌트:** `RankingWidget`
- 상위 10명 표시 (스크롤 없이)
- 현재 로그인 유저가 50위 밖이면 별도로 본인 순위 표시
- "View All" 링크로 /ranking 페이지 이동

### 5.3 /ranking 페이지 (전체 리더보드)

**경로:** `/ranking`

**페이지 구성:**
```
GLOBAL LEADERBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ 내 순위 (sticky) ─────────────┐
│ Your Rank: #127                │
│ your_nickname     2,345 pts    │
└────────────────────────────────┘

Rank    Player              Points
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥇 1    hacker_master      12,450 pts
🥈 2    code_ninja         11,892 pts  
🥉 3    crypto_queen       10,234 pts
   4    byte_breaker        9,876 pts
   5    data_wizard         8,765 pts
   ...
   
   [Loading more...]  ← 무한스크롤
```

**기능:**
- 무한스크롤 (페이지당 50명)
- 현재 로그인 유저의 순위 상단 고정 (sticky)
- 상위 1~3위 특별 스타일 (골드/실버/브론즈 그라데이션)
- 반응형 레이아웃

---

## 6. API 엔드포인트

### 6.1 랭킹 조회

**Supabase Client Query (권장):**
```typescript
// Top N 조회
const { data } = await supabase
  .from('profiles')
  .select('id, nickname, total_points')
  .order('total_points', { ascending: false })
  .limit(50);

// 특정 유저 순위 조회
const { data: rank } = await supabase.rpc('get_user_rank', {
  p_user_id: userId,
});
```

### 6.2 무한스크롤 페이지네이션

```typescript
// 페이지별 조회 (50명씩)
const { data } = await supabase
  .from('profiles')
  .select('id, nickname, total_points')
  .order('total_points', { ascending: false })
  .range(page * 50, (page + 1) * 50 - 1);
```

---

## 7. 예외 정책

### 7.1 동시 정답 제출 (Race Condition)

- 기존 정책 유지: 먼저 도착한 요청이 승자
- 후발 요청자: CP 반환, 포인트는 승자에게 귀속됨 (후발자의 시도는 포인트에 미반영)

### 7.2 블록 강제 종료 시

- 관리자가 블록을 무효화하는 경우: 누적 포인트는 소멸 (어느 유저에게도 지급되지 않음)
- 참여자 CP 보상은 기존 정책대로 진행

### 7.3 계정 삭제/정지

- 계정 삭제 시: 해당 유저의 포인트는 랭킹에서 제외
- 계정 정지 시: 랭킹에서 일시 제외, 정지 해제 시 복구

### 7.4 포인트 조작 방지

- 모든 포인트 연산은 Edge Function (service_role) 내에서만 수행
- 클라이언트에서 직접 profiles.total_points 수정 불가 (RLS)

---

## 8. 향후 확장 고려사항

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| 시즌제 | 주기적 리셋 + 시즌 아카이브 | 중 |
| 포인트 축약 표시 | 1.5K, 23.4K 형식 | 하 |
| 뱃지/티어 시스템 | 포인트 구간별 등급 부여 | 중 |
| 주간/월간 랭킹 | 기간별 별도 집계 | 중 |
| 랭킹 변동 알림 | 순위 상승/하락 푸시 | 하 |

---

## 9. 구현 체크리스트

### Database ✅
- [x] blocks 테이블에 accumulated_points 컬럼 추가
- [x] profiles 테이블에 total_points 컬럼 추가
- [x] profiles_total_points_idx 인덱스 생성
- [x] RLS 정책 검토 (total_points 클라이언트 수정 불가)
- [x] RPC 함수 생성 (increment_block_points, award_points_to_winner, get_user_rank)

### Edge Functions ✅
- [x] check-answer: 포인트 누적 로직 추가
- [x] check-answer: 정답 시 attempts 저장 (similarity: 100)
- [x] check-answer: 정답 시 승자 포인트 지급 로직 추가

### Frontend ✅
- [x] Block 타입에 accumulated_points 추가
- [x] BlockHeader에 Prize Pool 표시 추가
- [x] ranking entity 생성 (types, hooks)
- [x] 게임 화면 RankingWidget 위젯
- [x] /ranking 페이지 생성 (무한스크롤)

### Realtime
- [x] blocks 테이블 UPDATE 이벤트 구독 확인 (기존 구독 활용)

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-01-18 | 1.0 | 최초 작성 |
| 2026-01-18 | 1.1 | 정답 시 attempts 저장 정책 추가, 구현 완료 체크리스트 업데이트 |
