# [DRAFT v1] 붕어빵 타이쿤 MVP 구현 계획

> Status: DRAFT — Pending Architect & Critic Review
> Spec: `.omc/specs/deep-interview-bungeo-tycoon.md`

---

## RALPLAN-DR Summary

### Principles
1. **모바일 웹 우선** — 모든 인터랙션은 터치 기반, 세로 화면(320~430px), iOS Safari/Android Chrome에서 완벽 동작
2. **핵심 루프 품질 우선** — 굽기 타이밍의 쾌감(황금빛 붕어빵)이 전체 재미의 근간. 이 루프가 느리면 나머지는 의미 없음
3. **AI 어시스트 친화적 구조** — 모듈화된 TypeScript, 명확한 씬/시스템 분리, 단일 책임 클래스
4. **점진적 확장** — localStorage → 서버, Web → Capacitor 앱 전환을 지원하는 추상화 계층
5. **빠른 이터레이션** — Vite HMR, 독립 씬 테스트 가능 구조

### Decision Drivers (Top 3)
1. **모바일 60fps 렌더링** — Canvas 기반 렌더링, 스프라이트 배칭, 불필요한 리렌더링 최소화
2. **Capacitor.js 호환성** — 웹 표준 API만 사용, native plugin 의존성 없음 (MVP 단계)
3. **개발 속도** — 게임 특화 API(씬 관리, 오디오, 입력, 트윈)를 직접 구현하지 않고 Phaser.js 활용

### Viable Options

**Option A: Phaser.js 3.x + TypeScript (선택)**
- Pro: 게임 특화 씬/물리/오디오/입력 API 내장, 픽셀 아트 스케일링 기본 지원, 대규모 커뮤니티
- Con: 번들 크기 ~1MB (gzip 후 ~400KB), WebGL fallback 존재

**Option B: PixiJS + 커스텀 게임 로직**
- Pro: 가벼운 WebGL 렌더링 엔진 (~300KB)
- Con: 씬 관리, 게임 루프, 입력, 오디오, 애니메이션 시스템 직접 구현 필요 → 개발 공수 3-4배 증가
- **무효화 사유:** AI 어시스트 개발 맥락에서 Phaser.js의 번들 크기 페널티(<600KB 순증)는 게임 특화 API 활용으로 절약되는 개발 공수에 비해 미미함

---

## Requirements Summary

딥 인터뷰(13라운드, 최종 모호성 19%)를 통해 확정된 요구사항:

- **MVP 범위:** 레벨 1→3, 손님 4종, 굽기 4단계 판정, Day System (5분 사이클), localStorage 저장
- **비주얼:** 32~64px 픽셀 아트, 필수 애니메이션 4종
- **오디오:** 효과음 5~10종 (BGM 없음)
- **배포:** Vercel 또는 GitHub Pages
- **확장:** Capacitor.js로 Android/iOS 앱 래핑 예정 (v2)

---

## Acceptance Criteria

### 코어 게임플레이
- [ ] `BungeaMold` 탭 시 반죽 붓기 애니메이션 → 굽기 프로그레스 바 시작 (0→100%, 기본 30초)
- [ ] 뒤집기 탭 타이밍에 따라 4단계 판정 동작: PERFECT(85~95% 구간), GOOD(70~85% or 95~100%), UNDER(<70%), BURNT(바가 끝까지 참)
- [ ] PERFECT: 판매가 +20%, GOOD: 기본가, UNDER: -30%, BURNT: 판매 불가
- [ ] 손님 4종(일반/직장인/가족/VIP) 등장, 각각 다른 patience 값 동작
  - 일반: 60초, 직장인: 30초, 가족: 90초, VIP: 무제한(patience 없음)
- [ ] 인내심 게이지 0 전 납품 시 골드+경험치 증가, 초과 시 평판 감소
- [ ] 하루 5분(실시간) 후 `DailySummaryScene` 자동 전환
- [ ] 정산 화면: 총 판매수 / 매출 / 버린빵 수 / 불만족 손님 수 / 별점(1~3) 표시
- [ ] iOS Safari 16+ / Android Chrome 100+에서 터치 동작 확인

### 성장/경제 시스템
- [ ] 골드로 밀가루(100G/50회분), 단팥(150G/40회분) 재료 구매 가능
- [ ] 500G 모아 레벨 2 업그레이드: 틀 6개, 크림치즈(450G/20회분) 해금
- [ ] 1,500G 모아 레벨 3 업그레이드: 틀 8개, 슈크림(600G/개당) 해금
- [ ] `bungeo_save_v1` 키로 localStorage 저장, 재방문 시 진행 상태 유지

### 비주얼 & 오디오
- [ ] 붕어빵 색상 변화: 0~30% 흰색 → 30~60% 노랑 → 60~85% 황금 → 85~95% 갈색 → 95%+ 검정(탄빵)
- [ ] 손님 표정 스프라이트 3종 (웃음/불만/분노), patience 구간에 따라 전환
- [ ] PERFECT 완성 시 빛나는 파티클 이펙트 (0.5초)
- [ ] 납품 성공 시 하트 이펙트, 인내심 초과 시 분노 이펙트
- [ ] 효과음 5종 이상 동작: 뒤집기 SFX, 완성 SFX, BURNT SFX, 손님 만족 SFX, 손님 불만 SFX

### 기술 & 배포
- [ ] `npm run build` 성공, `dist/` 산출물 Vercel에 정상 배포
- [ ] 배포 URL 모바일 브라우저(iOS Safari, Android Chrome)에서 로딩 시간 5초 이내
- [ ] 첫 탭 이후 오디오 정상 재생 (Web Audio unlock)
- [ ] `npm run dev` 로컬 실행 시 HMR 동작

---

## Implementation Steps

### Phase 0: 프로젝트 초기 설정 (예상: 0.5일)

**0-1. Vite + TypeScript + Phaser.js 프로젝트 생성**
```
BPT/
├── src/
│   ├── main.ts              # Phaser.Game 진입점
│   ├── config.ts            # 게임 설정 (width, height, scale)
│   ├── scenes/
│   │   ├── BootScene.ts     # 에셋 프리로드
│   │   ├── GameScene.ts     # 메인 게임 (붕어빵틀 + 손님)
│   │   └── DailySummaryScene.ts  # 일일 정산
│   ├── objects/
│   │   ├── BungeaMold.ts    # 붕어빵 틀 오브젝트
│   │   ├── Customer.ts      # 손님 오브젝트
│   │   └── HUD.ts           # 상단 HUD
│   ├── systems/
│   │   ├── EconomySystem.ts # 골드, 재료, 가격
│   │   ├── SaveSystem.ts    # localStorage 추상화
│   │   ├── AudioSystem.ts   # 효과음 관리
│   │   └── UpgradeSystem.ts # 레벨업, 틀 슬롯, 메뉴 해금
│   ├── data/
│   │   ├── constants.ts     # 게임 상수 (타이밍, 가격, patience)
│   │   └── types.ts         # 공통 타입 정의
│   └── assets/              # 스프라이트, SFX
├── public/index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**0-2. 핵심 설정값 (`src/data/constants.ts`)**
```typescript
export const GAME_CONFIG = {
  width: 390,           // iPhone 14 기준 세로 폭
  height: 844,
  backgroundColor: '#1a0a00',
  pixelArt: true,       // Phaser 픽셀 아트 모드
};

export const DAY_DURATION_MS = 5 * 60 * 1000; // 5분

export const BAKING = {
  totalDuration: 30000, // 30초 기본 굽기 시간
  flipZones: { perfect: [0.85, 0.95], good: [0.70, 0.85], under: [0, 0.70] },
};

export const CUSTOMER_PATIENCE = {
  normal: 60000, worker: 30000, family: 90000, vip: Infinity,
};

export const PRICES = {
  red_bean: 300, cream_cheese: 450, choux: 600, special: 1000,
};

export const UPGRADES = [
  { level: 1, name: '노점', cost: 0, slots: 4, unlocks: ['red_bean'] },
  { level: 2, name: '작은 가게', cost: 500, slots: 6, unlocks: ['cream_cheese'] },
  { level: 3, name: '동네 맛집', cost: 1500, slots: 8, unlocks: ['choux'] },
];
```

---

### Phase 1: 굽기 타이밍 미니게임 (예상: 1.5일)

**1-1. `BungeaMold.ts` 핵심 로직**
- 상태 머신: `empty → pouring → baking → done → serving`
- `baking` 상태: `Phaser.Time.TimerEvent`로 progress 0→1 업데이트 (30초)
- `onFlip()` 메서드: 현재 progress에 따라 판정 계산
- 색상 변화: `progress` 구간별 sprite tint 업데이트
  - 0~0.3: 0xFFFFFF, 0.3~0.6: 0xFFE066, 0.6~0.85: 0xD4A017, 0.85~0.95: 0x8B4513, 0.95+: 0x1a1a1a

**1-2. 판정 이펙트 (`src/systems/EffectSystem.ts`)**
- PERFECT: `Phaser.GameObjects.Particles`로 황금 파티클 (0.5초)
- BURNT: 연기 파티클 이펙트

**1-3. 터치 입력 처리**
- `setInteractive()` + `on('pointerdown')` → 반죽 붓기
- `on('pointerup')` → 뒤집기 타이밍 판정

---

### Phase 2: 손님 시스템 (예상: 1.5일)

**2-1. `Customer.ts` 클래스**
- 4종 타입 enum: `CustomerType.Normal | Worker | Family | VIP`
- patience 타이머: `Phaser.Time.TimerEvent` (VIP는 생략)
- 주문 생성: 해금된 메뉴 중 랜덤 (VIP는 특정 메뉴 5~10개)
- 상태: `waiting → served(success) | left(failed)`

**2-2. 손님 UI (`src/objects/CustomerUI.ts`)**
- 인내심 게이지 바: 초록(>60%) → 노랑(30~60%) → 빨강(<30%)
- 표정 스프라이트 전환: patience 구간별 (60%+ 웃음, 30~60% 불만, <30% 분노)
- 주문 말풍선: 메뉴 아이콘 표시

**2-3. 손님 큐 관리 (`GameScene.ts`)**
- 대기 줄: 최대 5명 동시 대기
- 스폰 간격: 레벨에 따라 조정 (레벨1: 15초, 레벨2: 12초, 레벨3: 10초)
- 납품: 완성된 붕어빵을 손님에게 드래그 or 탭으로 전달

---

### Phase 3: 경제/진행 시스템 (예상: 1일)

**3-1. `EconomySystem.ts`**
```typescript
class EconomySystem {
  private gold: number;
  private stock: Record<IngredientType, number>;
  
  sell(item: MenuItem, quality: BakingQuality): void  // 골드 증가
  buyIngredient(type: IngredientType, qty: number): boolean  // 재료 구매
  consume(ingredient: IngredientType): boolean  // 재료 소비
}
```

**3-2. `UpgradeSystem.ts`**
- `canUpgrade(currentLevel: number, gold: number): boolean`
- `upgrade()`: 골드 차감, 틀 슬롯 확장, 메뉴 해금
- 레벨 3 달성 = MVP 완성 조건

**3-3. `SaveSystem.ts`**
```typescript
interface SaveData {
  version: 'v1';
  gold: number;
  shopLevel: number;
  dayNumber: number;
  stock: Record<IngredientType, number>;
  reputation: number;
  savedAt: number; // timestamp
}

class SaveSystem {
  save(data: SaveData): void  // localStorage.setItem('bungeo_save_v1', JSON)
  load(): SaveData | null     // null이면 신규 게임
  reset(): void               // 세이브 삭제
}
```

---

### Phase 4: Day System + 정산 화면 (예상: 1일)

**4-1. `GameScene.ts` 타이머**
- `Phaser.Time.TimerEvent`: 5분(300,000ms) 카운트다운
- 타임 바: HUD 상단에 현재 시간 시각화
- 타임 종료 시 `scene.start('DailySummaryScene', { stats })` 전환

**4-2. `DailySummaryScene.ts`**
- 표시: 판매수, 매출, 버린빵, 불만족 손님수
- 별점 계산: (만족 손님 수 / 총 손님 수)로 1~3별 결정
- 애니메이션: 숫자 카운터 업 (0.8초)
- "내일 시작" 버튼 → `GameScene` 재시작, day+1

---

### Phase 5: HUD & 메뉴 UI (예상: 1일)

**5-1. `HUD.ts` — 상단 고정**
```
[Day 3] [====타임바====] [★★★] [1,200G]
```
- `Phaser.GameObjects.Text` + `Container`로 구성
- 골드/평판 변경 시 tween 업데이트

**5-2. 하단 메뉴 버튼**
- 재료 보기: 현재 재료 재고 + 구매 버튼 (골드 충분 시 활성화)
- 업그레이드: 현재 레벨, 다음 레벨 비용, 업그레이드 버튼
- (꾸미기: v2 placeholder 버튼, 비활성화)

---

### Phase 6: 오디오 (예상: 0.5일)

**6-1. `AudioSystem.ts`**
- Phaser.js `AudioManager` 래핑
- Web Audio unlock: `scene.sound.unlock()` 첫 포인터 이벤트에서 호출
- 필수 SFX 5종:
  - `sfx_flip`: 뒤집기
  - `sfx_perfect`: PERFECT 완성
  - `sfx_burnt`: 탄빵
  - `sfx_customer_happy`: 손님 만족
  - `sfx_customer_angry`: 손님 불만

---

### Phase 7: 픽셀 아트 에셋 준비 (예상: 1일, 병렬 작업)

스프라이트 제작 또는 AI 생성 (DALL-E/Midjourney 픽셀 아트 프롬프트):
- 붕어빵 틀 스프라이트시트 (5프레임: 흰/노랑/황금/갈색/검정)
- 손님 4종 × 표정 3종 = 12 스프라이트
- UI 요소: HUD 배경, 버튼, 말풍선, 게이지 바
- 이펙트: 파티클 텍스처 (황금 빛, 하트, 분노)

**권장 툴:** Aseprite (픽셀 아트 전문), 또는 Piskel (온라인 무료)

---

### Phase 8: 배포 (예상: 0.5일)

**8-1. Vercel 배포 설정**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null
}
```

**8-2. Capacitor 초기 구조 (v2 준비)**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init BungeoTycoon com.siyoon.bungeotycoon
# android/ios 디렉토리는 v2에서 생성
```

**8-3. 배포 체크리스트**
- [ ] `npm run build` 에러 없음
- [ ] Lighthouse 모바일 성능 점수 60점 이상
- [ ] iOS Safari (실기 or BrowserStack) 터치 동작 확인
- [ ] Android Chrome 터치 동작 확인

---

## Risks and Mitigations

| 리스크 | 가능성 | 영향 | 완화 방법 |
|--------|--------|------|----------|
| 모바일 60fps 미달 | 중 | 높음 | 스프라이트 배칭, 파티클 수 제한, GPU 가속 Canvas |
| 픽셀 아트 에셋 제작 지연 | 높음 | 중 | 임시 도형 placeholder로 게임로직 먼저 구현, 에셋은 마지막에 교체 |
| Web Audio 자동재생 제한 | 낮음 | 낮음 | Phaser의 `sound.unlock()` + 첫 탭 이후 오디오 시작 패턴 |
| localStorage 저장 실패 (Private Mode) | 중 | 낮음 | try-catch로 감싸고 실패 시 메모리 내 저장으로 폴백 |
| Capacitor 래핑 시 웹뷰 성능 | 중 | 중 | v2 이슈. MVP는 웹만. 단, 처음부터 `window.*` 대신 표준 API 사용 |
| 손님 AI 밸런싱 (patience 너무 빠름/느림) | 중 | 중 | `constants.ts`에 모든 수치 집중 → 빠른 수치 조정 가능 |

---

## Verification Steps

1. **게임플레이 루프 검증**
   - 30초 굽기 → 85~95% 구간에 뒤집기 탭 → PERFECT 판정 + 파티클 이펙트 확인
   - 뒤집기 없이 100% 도달 → BURNT 판정 + 연기 이펙트 확인

2. **손님 시스템 검증**
   - 직장인 손님(30초 patience) 등장 → 35초 후 자동 이탈 → 평판 감소 확인
   - VIP 손님 등장 → patience 게이지 없음 → 큰 주문(5~10개) 확인

3. **경제 검증**
   - 단팥 붕어빵 PERFECT 판매 → 360G(300+60) 획득 확인
   - 밀가루 50회분 소진 → 제작 불가 상태 확인
   - 500G → 레벨 2 업그레이드 → 틀 6개 + 크림치즈 해금 확인

4. **저장/로드 검증**
   - 골드 1,000G 상태에서 브라우저 새로고침 → 1,000G 유지 확인

5. **모바일 검증**
   - iOS Safari: 터치 → 반죽 붓기 → 뒤집기 전체 플로우 동작
   - Android Chrome: 동일 플로우 + 오디오 첫 탭 이후 재생

6. **배포 검증**
   - `vercel deploy` → URL 접근 → 모바일 세로 화면 정상 표시

---

## ADR (Architecture Decision Record)

### Decision
Phaser.js 3.x + TypeScript + Vite를 핵심 기술 스택으로 선택

### Drivers
- 모바일 60fps 렌더링 (Canvas 하드웨어 가속)
- 게임 특화 API (씬, 오디오, 입력, 트윈, 파티클)
- Capacitor.js 호환 (웹 표준 준수)
- AI 어시스트 개발 효율성

### Alternatives Considered
- PixiJS: 더 가볍지만 게임 루프, 씬 관리, 오디오를 직접 구현해야 해서 탈락
- Unity WebGL: 강력하지만 모바일 웹 초기 로딩이 무거워 탈락 (5MB+)
- Godot HTML5: 오픈소스이나 HTML5 내보내기 성능/안정성 이슈로 탈락

### Why Chosen
번들 크기 페널티(<600KB gzip)는 게임 특화 API로 절약되는 개발 공수에 비해 미미하며, AI 코딩 도구(Claude Code)와의 협업에서 TypeScript 타입 시스템이 코드 품질을 높여줌

### Consequences
- 긍정: 즉시 개발 시작 가능, 풍부한 예제/문서
- 부정: Phaser.js 3 학습 곡선 (씬 생명주기, 에셋 프리로드 방식)
- 중립: ~400KB gzip 번들 크기 (모바일 4G 기준 2초 이내 로딩)

### Follow-ups
- v2: Capacitor.js로 Android/iOS 앱 래핑 후 앱 스토어 제출
- v2: 서버 저장 (Supabase 또는 Firebase Realtime DB)
- v2: 주간 이벤트 시스템 + 레벨 4~5

---

## Estimated Timeline

| Phase | 작업 | 예상 소요 |
|-------|------|----------|
| Phase 0 | 프로젝트 초기 설정 | 0.5일 |
| Phase 1 | 굽기 타이밍 미니게임 | 1.5일 |
| Phase 2 | 손님 시스템 | 1.5일 |
| Phase 3 | 경제/진행 시스템 | 1일 |
| Phase 4 | Day System + 정산 | 1일 |
| Phase 5 | HUD & 메뉴 UI | 1일 |
| Phase 6 | 오디오 | 0.5일 |
| Phase 7 | 픽셀 아트 에셋 | 1일 (병렬) |
| Phase 8 | 배포 | 0.5일 |
| **합계** | | **~8.5일** |
