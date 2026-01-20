# [사운드 시스템] Brute Force AI

## 1. 개요

게임 몰입감 향상을 위한 배경음악(BGM) 및 효과음(SFX) 시스템입니다.

- **BGM**: 칩튠 스타일 배경음악 (`/public/sounds/background.mp3`)
- **SFX**: ZZFX 라이브러리 기반 실시간 합성 효과음 (파일 없이 코드로 생성)

## 2. 기술 스택

| 구분 | 기술 | 용도 |
|------|------|------|
| SFX 엔진 | [ZZFX](https://github.com/KilledByAPixel/ZzFX) | 1KB 미만의 초경량 사운드 합성기 |
| BGM | HTML5 Audio API | MP3 파일 재생 |
| 상태 관리 | Zustand (persist) | 설정값 localStorage 저장 |
| 이벤트 시스템 | CustomEvent | 컴포넌트 간 느슨한 결합 |

## 3. 파일 구조

```
shared/sounds/
├── index.ts                      # 공개 API export
├── sound-manager.ts              # SoundManager 클래스 (싱글톤)
├── sound-events.ts               # 커스텀 이벤트 타입 및 발행 함수
├── sound-settings-store.ts       # Zustand store (localStorage 연동)
├── sound-initializer.tsx         # React 초기화 컴포넌트
├── assets/
│   └── zzfx-presets.ts           # ZZFX 사운드 프리셋 정의
└── ui/
    ├── SoundButton.tsx           # Header 스피커 아이콘 버튼
    └── SoundSettingsModal.tsx    # 설정 모달 UI
```

## 4. 효과음 이벤트

### 4.1 지원 이벤트

| 이벤트 | 트리거 시점 | 프리셋 |
|--------|-------------|--------|
| `sound:wrongAnswer` | 오답 제출 시 | `wrongAnswer` |
| `sound:invalidChar` | 허용되지 않은 문자 입력 시 | `invalidChar` |
| `sound:topAttempt` | 현재 블록의 최고 유사도 갱신 시 | `topAttempt` |

### 4.2 이벤트 발행 방법

```typescript
import { emitSoundEvent, SOUND_EVENTS } from "@/shared/sounds";

// 오답 제출 시
emitSoundEvent(SOUND_EVENTS.wrongAnswer);

// 잘못된 문자 입력 시
emitSoundEvent(SOUND_EVENTS.invalidChar);

// Top Attempt 갱신 시
emitSoundEvent(SOUND_EVENTS.topAttempt);
```

### 4.3 Top Attempt 감지 정책

- 게임 최초 로드 시에는 효과음을 재생하지 않음
- 이전 최고 유사도보다 높은 값이 나왔을 때만 재생
- 블록이 변경되면 이전 값 초기화

## 5. 설정 정책

### 5.1 기본값

| 항목 | 기본값 | 설명 |
|------|--------|------|
| `bgmEnabled` | `false` | 배경음악 OFF |
| `sfxEnabled` | `false` | 효과음 OFF |
| `volume` | `0.5` (50%) | 마스터 볼륨 |

### 5.2 저장 정책

- **저장소**: `localStorage` (키: `brute-force-sound`)
- **유효기간**: 3일
- **갱신 조건**: 사용자가 재접속하면 유효기간 리프레시
- **만료 시 동작**: 설정 초기화 (기본값으로 복원)

### 5.3 브라우저 오디오 정책 대응

현대 브라우저는 사용자 인터랙션 없이 오디오 재생을 차단합니다.

- 사운드 설정을 변경하는 시점에 `AudioContext.resume()` 호출
- BGM/SFX 토글 또는 볼륨 조절 시 `soundManager.activateFromUserGesture()` 실행
- ZZFX 모듈은 동적 import로 로드 (SSR 환경에서 `AudioContext` 오류 방지)

## 6. UI 구성

### 6.1 Header 버튼

- 위치: Header 우측 네비게이션 영역
- 표시: `[VOL]` (소리 켜짐) / `[MUT]` (음소거)
- 클릭 시 설정 모달 열림

### 6.2 설정 모달

| 항목 | UI 요소 | 설명 |
|------|---------|------|
| MASTER GAIN | 슬라이더 (0-100%) | 전체 볼륨 조절 |
| BGM STREAM | 토글 `[ON]/[OFF]` | 배경음악 켜기/끄기 |
| SFX MODULE | 토글 `[ON]/[OFF]` | 효과음 켜기/끄기 |

## 7. ZZFX 프리셋

### 7.1 프리셋 정의 위치

`shared/sounds/assets/zzfx-presets.ts`

### 7.2 현재 프리셋

```typescript
export const SFX_PRESETS = {
  // 오답 제출 - 에러 비프음
  wrongAnswer: [1.2, , 570, , 0.06, 0.19, 1, 2.3, , , 281, 0.06, 0.06, , , 0.1, , 0.56, 0.01],
  
  // 잘못된 문자 입력 - 짧고 가벼운 비프음
  invalidChar: [0.6, , 320, , 0.02, 0.08, 1, 1.2, , , -50, 0.01, , , , , 0.2, 0.01],
  
  // Top Attempt 갱신 - 상승 톤 성공음
  topAttempt: [0.9, , 597, , 0.02, 0.28, , 3.4, , -146, , , 0.05, , , , , 0.76, 0.02, , -1395],
} as const;
```

### 7.3 새 프리셋 추가 방법

1. [ZzFX Sound Designer](https://killedbyapixel.github.io/ZzFX)에서 사운드 생성
2. 생성된 배열을 `SFX_PRESETS`에 추가
3. `SfxPresetKey` 타입이 자동으로 업데이트됨
4. `SOUND_EVENTS`와 `sound-manager.ts`에 이벤트 핸들러 추가

## 8. 통합 지점

### 8.1 게임 레이아웃

`app/(game)/layout.tsx`에서 `<SoundInitializer />` 마운트

```tsx
import { SoundInitializer } from "@/shared/sounds/sound-initializer";

export default function GameLayout({ children }) {
  return (
    <VictoryProvider>
      <div>
        <SoundInitializer />
        <Header />
        {children}
      </div>
    </VictoryProvider>
  );
}
```

### 8.2 HackingConsole

`widgets/hacking-console/model/use-hacking-console.ts`

- 오답 제출 시: `emitSoundEvent(SOUND_EVENTS.wrongAnswer)`
- 잘못된 문자 입력 시: `emitSoundEvent(SOUND_EVENTS.invalidChar)`

### 8.3 MainGameView

`views/main-game-view/ui/MainGameView.tsx`

- Top Attempt 갱신 감지: `attempts` 변경 시 이전 최고값과 비교
- 갱신 시: `emitSoundEvent(SOUND_EVENTS.topAttempt)`

## 9. 타입 정의

ZZFX 라이브러리에 타입 정의가 없어 로컬 타입 스텁 사용:

`types/zzfx.d.ts`

```typescript
declare module "zzfx" {
  export const ZZFX: {
    volume: number;
    audioContext: AudioContext;
    // ...
  };
  export function zzfx(...parameters: Array<number | undefined>): AudioBufferSourceNode;
}
```

`tsconfig.json`의 `include`에 `types/**/*.d.ts` 포함 필요.

## 10. 향후 확장 계획

- [ ] 블록 해결(Victory) 시 팡파레 효과음
- [ ] 새 블록 생성 시 알림음
- [ ] CP 소진 시 경고음
- [ ] 볼륨 슬라이더 실시간 프리뷰
- [ ] 배경음악 다중 트랙 지원
