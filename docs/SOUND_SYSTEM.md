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
    ├── SoundSettingsModal.tsx    # 설정 모달 UI
    ├── SoundChoiceModal.tsx      # 최초 진입 시 사운드 선택 모달
    └── SoundControlFAB.tsx       # 좌측 하단 플로팅 컨트롤 버튼
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
| `volume` | `0.5` (50%) | 마스터 볼륨 (전체 게인) |
| `bgmVolume` | `0.5` (50%) | 배경음악 볼륨 (Master * BGM) |
| `sfxVolume` | `0.5` (50%) | 효과음 볼륨 (Master * SFX) |
| `masterMuted` | `false` | 음소거 상태 (저장되지 않음) |

### 5.2 저장 정책

- **저장소**: `localStorage` (키: `brute-force-sound`)
- **저장 항목**: `volume`, `bgmVolume`, `sfxVolume`, `lastUpdated`
- **비저장 항목**: `masterMuted` (세션마다 초기화하여 사용자 의도 재확인)
- **갱신 조건**: 사용자가 재접속하면 유효기간 로직에 따라 처리 (현재 단순 저장)

### 5.3 브라우저 오디오 정책 대응 및 사용자 경험

- **최초 진입 시**: `SoundChoiceModal`을 통해 명시적으로 사운드 사용 여부(Sound ON/OFF)를 선택받습니다.
- **Sound ON 선택**: `masterMuted: false`로 설정하고 `soundManager.activateFromUserGesture()` 실행.
- **Sound OFF 선택**: `masterMuted: true`로 설정.
- **자동 재생 차단 방지**: 모든 사운드 활성화는 사용자 제스처(클릭) 이벤트 내에서 처리됩니다.

## 6. UI 구성

### 6.1 Floating Action Button (FAB)

- **위치**: 화면 좌측 하단 (`bottom-6 left-6`)
- **기능**:
  - **Mute Toggle**: 현재 상태에 따라 즉시 음소거/해제 (아이콘 변경)
  - **Settings**: 상세 설정 모달 열기 (기어 아이콘)

### 6.2 설정 모달

| 항목 | UI 요소 | 설명 |
|------|---------|------|
| MASTER AUDIO | 토글 버튼 | 전체 사운드 즉시 음소거/해제 |
| MASTER GAIN | 슬라이더 (0-100%) | 전체 출력의 기준 볼륨 조절 |
| BGM GAIN | 슬라이더 (0-100%) | 배경음악의 상대적 크기 조절 |
| SFX GAIN | 슬라이더 (0-100%) | 효과음의 상대적 크기 조절 |

> **참고**: BGM/SFX 개별 켜기/끄기 토글은 제거되었습니다. 해당 사운드를 끄려면 볼륨 슬라이더를 0%로 설정하면 됩니다.

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

`app/(game)/layout.tsx`

```tsx
export default function GameLayout({ children }) {
  return (
    <VictoryProvider>
      <div>
        <SoundInitializer />
        {/* 모달과 FAB는 레이아웃 레벨에서 관리 */}
        <SoundChoiceModal />
        <SoundControlFAB />
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

- Top Attempt 갱신 감지 및 재생

## 9. 타입 정의

ZZFX 라이브러리에 타입 정의가 없어 로컬 타입 스텁 사용: `types/zzfx.d.ts`

## 10. 향후 확장 계획

- [ ] 블록 해결(Victory) 시 팡파레 효과음
- [ ] 새 블록 생성 시 알림음
- [ ] CP 소진 시 경고음
- [ ] 볼륨 슬라이더 실시간 프리뷰
- [ ] 배경음악 다중 트랙 지원
