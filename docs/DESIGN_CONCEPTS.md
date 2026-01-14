# [Design Guide] Brute Force AI: The Modern Ledger

## 1. 디자인 컨셉 (Design Concept)

The Modern Ledger: 토스(Toss)나 Linear 앱처럼 극도로 깔끔하고 세련된 UI를 바탕으로 하되, 폰트와 데이터 연출에서 '해킹/터미널'의 정체성을 드러내는 'Clean-Tech Hacker' 무드를 지향합니다.

## 2. 컬러 팔레트 (Color Palette)

### 2.1 Base Colors (Background & Surface)
- Background: #0F172A (Deep Slate) - 메인 배경색.
- Surface (Card/Nav): #1E293B (Slate 800) - 입력창 영역, 개별 로그 카드.
- Border: #334155 (Slate 700) - 구분선 및 요소 테두리.

### 2.2 Point Colors (Action & Brand)
- Primary (Action): #3B82F6 (Electric Blue) - 주요 버튼, 활성화된 게이지.
- Success: #10B981 (Emerald) - 정답 적중, 높은 유사도(80% 이상).
- Warning: #F59E0B (Amber) - 180초 타이머, 중간 유사도(40~79%).
- Danger: #EF4444 (Rose) - 오류, 낮은 유사도(40% 미만).

### 2.3 Text Colors
- Text-Primary: #F8FAFC (Near White) - 제목, 본문 가독용.
- Text-Secondary: #94A3B8 (Slate 400) - 보조 설명, 타임스탬프, 난이도 가이드.

## 3. 타이포그래피 (Typography)
| 용도     | 폰트 (Font Family)            | 특징                                               |
|--------|-----------------------------|--------------------------------------------------|
| 시스템 UI | Pretendard 또는 Inter         | 깔끔한 Sans\-serif. 버튼, 메뉴, 일반 안내 문구에 사용.           |
| 데이터/로그 | JetBrains Mono 또는 Fira Code | 고정폭 (Monospaced). 암호 입력창, 실시간 로그 피드, 유사도 수치에 사용. |

- Header (Block No): 24px / Bold / Pretendard
- Input Text: 18px / Medium / JetBrains Mono
- Log Item: 14px / Regular / JetBrains Mono

## 4. 핵심 컴포넌트 스타일 (Component Styles)

### 4.1 해킹 콘솔 (Hacking Console)
- Shape: 테두리 반경(Border-radius) 12px.
- Focus State: 입력창 포커스 시 테두리에 2px solid #3B82F6 및 미세한 Glow 효과.
- CP Gauge: 두께 4px의 얇은 프로그레스 바. 게이지가 찰 때 부드러운 Ease-in-out 애니메이션 적용.

### 4.2 실시간 오답 로그 (Live Feed)
- Card Style: 배경색 #1E293B, 하단 보더 1px.
- Similarity Indicator: 숫자 뒤에 유사도만큼 채워진 아주 흐린 배경 바(Bar)를 깔아 시각적 인지 속도 향상.

### 4.3 180초 타이머 오버레이 (Pending Overlay)
- Backdrop: `backdrop-filter: blur(8px); background: rgba(15, 23, 42, 0.8)`;
- Timer Circle: 중앙에 위치한 원형 프로그레스 바가 줄어들며 숫자가 카운트다운되는 형태.

## 5. 인터랙션 및 애니메이션 (Motion)
- 입력 오류 (Shake): 난이도 규칙에 맞지 않는 입력 시 콘솔이 좌우로 4~5회 빠르게 흔들림.
- 로그 업데이트 (Slide Up): 새로운 로그가 추가될 때 하단에서 상단으로 부드럽게 밀려 올라옴.
- 유사도 강조 (Pulse): 이전 기록보다 높은 유사도를 기록하면 텍스트가 살짝 커졌다가 돌아오는 효과.
- 글리치 효과 (Glitch): 블록이 해결되는 순간(Victory), 화면의 텍스트가 0.2초간 지지직거리는 듯한 연출로 쾌감 부여.

## 6. 개발용 CSS 변수 예시 (Implementation)
```css
:root {
  --bg-color: #0f172a;
  --surface-color: #1e293b;
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --text-main: #f8fafc;
  --text-dim: #94a3b8;
  
  --font-ui: 'Pretendard', sans-serif;
  --font-data: 'JetBrains Mono', monospace;
}
```