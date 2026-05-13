# [DRAFT v3] 붕어빵 타이쿤 MVP 구현 계획

> Status: DRAFT v3 — Critic 피드백 (CRITICAL 3건 + MAJOR 4건) 반영
> Spec: `.omc/specs/deep-interview-bungeo-tycoon.md`
> Architect Verdict (v2): REVISE → 반영 완료
> Critic Verdict (v2): REVISE → 반영 완료

---

## RALPLAN-DR Summary (v3, 확정)

### Principles
1. **모바일 웹 우선** — 터치 기반, 세로 320~430px, iOS Safari/Android Chrome에서 완벽 동작
2. **핵심 루프 품질 우선** — 굽기 타이밍 쾌감이 전체 재미의 근간. 판정 로직이 AC와 데이터 모두에서 일관되게 정의됨
3. **AI 어시스트 친화적 구조** — 단일 책임 클래스, 8상태 머신은 데이터(전이표)로 분리
4. **점진적 확장** — IStorage·AudioGateway·Date.now() 타이머 3개 어댑터로 Capacitor 확장 경로 코드에 실제 반영
5. **빠른 이터레이션** — `data/balance.ts`에 모든 수치 집중, Vite HMR

### Decision Drivers (Top 3)
1. 모바일 60fps 렌더링 (Canvas 하드웨어 가속)
2. Capacitor.js 호환성 — IStorage, AudioGateway, 표준 API only
3. 개발 속도 — Phaser.js 게임 특화 API (씬, 오디오, 트윈, 파티클)

### Viable Options

**Option A: Phaser.js 3.x + TypeScript (선택)**
- Pro: 게임 특화 API (씬/입력/오디오/트윈/파티클), 픽셀 아트 스케일링 기본 지원, 풍부한 AI 어시스트 학습 데이터
- Con: 번들 ~400KB gzip, Phaser 씬 생명주기 학습 곡선

**Option B: PixiJS + 커스텀 게임 로직 (탈락)**
- Pro: 번들 ~200KB gzip (Phaser 대비 -200KB)
- Con: Phaser에서 내장 제공하는 기능 직접 구현 비용:
  - 씬 매니저(Boot→Preload→Title→Game→Summary): 약 1일
  - 입력 이벤트 추상화 + 디바운스: 약 0.5일
  - 오디오 Web Audio unlock 큐 + 재생 관리: 약 1일
  - 트윈/파티클 시스템(PERFECT 이펙트, 숫자 카운터 업): 약 1.5일
  - **총 추가 비용: +4일** (9일 → 13일, 44% 일정 증가)
- 무효화 사유: 번들 -200KB 절감은 +4일 개발 공수 증가를 정당화하지 못함. Phaser 3.x 는 GitHub Copilot·Claude 등 AI 코딩 도구의 학습 데이터에 풍부하게 포함되어 AI 어시스트 정확도도 높음

**Option C: Unity WebGL (탈락)** — 초기 로딩 5MB+, 모바일 4G에서 로딩 15초+. 즉시 탈락.

**Option D: Godot HTML5 (탈락)** — HTML5 내보내기 WebGL 성능 불안정(Godot GitHub #72374 등). 탈락.

---

## Requirements Summary

딥 인터뷰(13라운드, 최종 모호성 19%) 확정 사항:
- MVP: 레벨 1→3, 손님 4종, 굽기 4단계 판정, Day System (5분), localStorage 저장
- 비주얼: 32~64px 픽셀 아트, 필수 애니메이션 4종
- 오디오: 효과음 5~10종 (BGM 없음)
- 배포: Vercel 또는 GitHub Pages
- 확장: Capacitor.js 앱 래핑 (v2)

---

## Acceptance Criteria (v3 — 딥 인터뷰 스펙 + 추가 명세)

> **변경 고지:** v2 헤더의 "수정 없음" 표기는 오류였으며 v3에서 정정합니다.  
> 딥 인터뷰 스펙에서 3개 항목이 추가되었고, 굽기 판정 구간이 CRITICAL #1 반영으로 정확화되었습니다.

### 코어 게임플레이
- [ ] `BungeaMold` 탭(pointerdown) 시 `Pouring` 상태 진입(0.5초 애니메이션) → 자동으로 `Baking` 전이
- [ ] `Baking` 상태에서 프로그레스 바 0→1.0 (30초 기준, `balance.ts`의 `BAKING.totalDuration`)
- [ ] 뒤집기 탭 타이밍에 따른 4단계 판정 (구간은 반개구간 `[a, b)` 적용):
  - **PERFECT:** progress ∈ `[0.85, 0.95)` — 판매가 ×1.2
  - **GOOD (조기):** progress ∈ `[0.70, 0.85)` — 기본 판매가
  - **GOOD (후기):** progress ∈ `[0.95, 1.00)` — 기본 판매가 (**CRITICAL #1 수정**)
  - **UNDER:** progress < 0.70 — 판매가 ×0.7
  - **BURNT:** `Baking` 또는 `Flipped` 상태에서 progress = 1.00 도달 시 자동 전이 (미뒤집기 또는 뒤집기 후 과열)
- [ ] 손님 4종 등장 및 patience 동작:
  - 일반: 60,000ms, 직장인: 30,000ms, 가족: 90,000ms
  - VIP: patience = Infinity (UI 게이지 미표시, 항상 `Waiting` 상태 유지)
- [ ] 손님 머리 위 주문 말풍선 표시 (메뉴 아이콘) (**스펙 누락 항목 추가**)
- [ ] 인내심 만료 전 납품 시 골드+경험치 증가, 초과 시 평판 감소
- [ ] 하루 5분(Date.now() 기반) 후 `DailySummaryScene` 자동 전환
- [ ] 정산 화면: 총 판매수 / 매출 / 버린빵 수 / 불만족 손님수 / 별점(1~3)
- [ ] GDD 5.1 화면 구성 4영역 (상단HUD / 손님대기줄 / 틀그리드 / 하단메뉴) 모바일 세로 레이아웃 구현 (**스펙 누락 항목 추가**)
- [ ] iOS Safari 16.4+(BrowserStack 또는 실기) 터치 확인: 굽기 1회 완료 + 손님 응대 1회 성공
- [ ] Android Chrome 100+(Pixel 5 에뮬레이터 또는 실기) 동일 플로우 확인

### 성장/경제 시스템
- [ ] 골드로 밀가루(100G/50회분), 단팥(150G/40회분) 구매 가능
- [ ] 500G → 레벨 2: 틀 6개, 크림치즈(450G/20회분) 해금
- [ ] 1,500G → 레벨 3: 틀 8개, 슈크림 해금
- [ ] 가족 손님 만족 시 팁(판매가 ×10%) 추가 지급
- [ ] 재료 소진 시 해당 메뉴 제작 버튼 비활성화 + 재료 구매 유도 UI
- [ ] `bungeo_save_v1` 키로 localStorage 저장, 재방문 시 진행 상태 유지

### 비주얼 & 오디오
- [ ] 붕어빵 색상 5단계 tint 적용 (progress 구간별)
- [ ] 손님 표정 3종 (웃음/불만/분노), patience 비율 구간별 전환; VIP는 항상 웃음 표정
- [ ] PERFECT 완성 시 황금 파티클 이펙트 (0.5초)
- [ ] 납품 성공 시 하트, patience 초과 시 분노 이펙트
- [ ] 효과음 5종 이상 동작 (첫 탭 이후)

### 기술 & 배포
- [ ] Phaser.js 3.x + TypeScript 프로젝트 구성, `npm run dev` 실행 (**스펙 누락 항목 추가**)
- [ ] `npm run build` 성공, `dist/` Vercel 정상 배포
- [ ] 배포 URL LCP < 5초 (Lighthouse Mobile, Slow 4G throttling, cold cache)
- [ ] Lighthouse 모바일 Performance Score ≥ 60 (Mobile Slow 4G throttling)
- [ ] 번들 크기 ≤ 500KB gzip (`npm run build` 후 `du -sh dist/*.js` 확인)
- [ ] 첫 탭 이후 오디오 재생 (Web Audio unlock 확인)
- [ ] `vite.config.ts`에 `base: './'` 설정 (Capacitor 호환)
- [ ] `viewport-fit=cover` + `env(safe-area-inset-top)` CSS 적용 (iOS 노치 대응)
- [ ] Portrait lock CSS + Phaser Scale FIT + autoCenter: CENTER_BOTH 설정

---

## Implementation Steps (v3 — Critic 피드백 반영)

### Phase 0: 프로젝트 초기 설정 (예상: 0.8일)

**0-1. 프로젝트 구조 (5씬 + 어댑터)**

```
BPT/
├── src/
│   ├── main.ts
│   ├── config.ts
│   ├── scenes/
│   │   ├── BootScene.ts           # Phaser registry 초기화, 최소 에셋 로드 (로딩 화면용)
│   │   ├── PreloadScene.ts        # 전체 게임 에셋 로딩 + 진행률 바
│   │   ├── TitleScene.ts          # 세이브 분기 (이어서/새로 시작)
│   │   ├── GameScene.ts           # 게임 로직 씬 lifecycle
│   │   ├── UIScene.ts             # HUD + 모달 (GameScene 병렬 launch)
│   │   └── DailySummaryScene.ts
│   ├── objects/
│   │   ├── BungeaMold.ts          # 붕어빵 틀 + 8상태 머신
│   │   ├── Customer.ts            # 손님 오브젝트
│   │   ├── CustomerUI.ts          # 말풍선 + patience 게이지
│   │   └── EffectSystem.ts        # 파티클/이펙트 (objects/ — 씬 생성 오브젝트)
│   ├── systems/
│   │   ├── EconomySystem.ts
│   │   ├── CustomerSpawnerSystem.ts
│   │   ├── UpgradeSystem.ts
│   │   ├── AudioGateway.ts        # Phaser sound 추상화
│   │   └── storage/
│   │       ├── IStorage.ts
│   │       ├── LocalStorageAdapter.ts
│   │       └── SaveSystem.ts      # IStorage에 의존
│   └── data/
│       ├── types.ts               # enum, interface, 전이 가드
│       ├── balance.ts             # 게임 밸런스 수치
│       ├── customers.ts           # 손님 4종 정의
│       └── menu.ts                # 메뉴 4종 정의
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**0-2. `src/data/balance.ts` (CRITICAL #1 수정 — 판정 구간 일치)**
```typescript
export const BAKING = {
  totalDuration: 30_000, // ms
  // 반개구간 [a, b) 적용. 경계: perfect 상한 0.95 = good_late 하한
  flipZones: {
    under:     { min: 0.00, max: 0.70 } as const, // [0.00, 0.70)
    good_early:{ min: 0.70, max: 0.85 } as const, // [0.70, 0.85)
    perfect:   { min: 0.85, max: 0.95 } as const, // [0.85, 0.95)
    good_late: { min: 0.95, max: 1.00 } as const, // [0.95, 1.00) ← CRITICAL #1: AC와 일치
    // progress >= 1.00: BURNT (미뒤집기 시 자동 전이)
  },
  priceMultiplier: {
    PERFECT: 1.2,
    GOOD: 1.0,    // good_early + good_late 모두 동일
    UNDER: 0.7,
    BURNT: 0,
  },
};

export const DAY = { durationMs: 5 * 60 * 1_000 };

export const UPGRADES = [
  { level: 1, name: '노점',     cost:      0, slots: 4 },
  { level: 2, name: '작은 가게', cost:    500, slots: 6 },
  { level: 3, name: '동네 맛집', cost:  1_500, slots: 8 },
];

export const SPAWN_INTERVAL_MS = { 1: 15_000, 2: 12_000, 3: 10_000 } as const;
```

**0-3. `src/data/customers.ts`**
```typescript
export const CUSTOMER_DEFS = {
  normal: { patience: 60_000,   orderMin: 1, orderMax: 2,  tipRate: 0    },
  worker: { patience: 30_000,   orderMin: 1, orderMax: 1,  tipRate: 0    },
  family: { patience: 90_000,   orderMin: 3, orderMax: 5,  tipRate: 0.10 },
  vip:    { patience: Infinity, orderMin: 5, orderMax: 10, tipRate: 0    },
} as const;
```

**0-4. `src/data/menu.ts`**
```typescript
export const MENU_DEFS = {
  red_bean:    { name: '단팥 붕어빵',    price: 300, unlockLevel: 1 },
  cream_cheese:{ name: '크림치즈 붕어빵', price: 450, unlockLevel: 2 },
  choux:       { name: '슈크림 붕어빵',  price: 600, unlockLevel: 3 },
  special:     { name: '특별 붕어빵',    price: 1_000, unlockLevel: 4 }, // v2
} as const;
```

**0-5. `src/systems/storage/IStorage.ts`**
```typescript
export interface IStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

**0-6. `src/systems/storage/LocalStorageAdapter.ts`**
```typescript
export class LocalStorageAdapter implements IStorage {
  async get(key: string): Promise<string | null> {
    try { return localStorage.getItem(key); }
    catch { return null; } // Private Mode 폴백
  }
  async set(key: string, value: string): Promise<void> {
    try { localStorage.setItem(key, value); }
    catch { /* quota 초과 시 silent fail — 메모리 내 상태 유지 */ }
  }
  async remove(key: string): Promise<void> {
    try { localStorage.removeItem(key); } catch {}
  }
}
```

**0-7. `src/data/types.ts` — 상태머신 전이 가드 (CRITICAL #2 반영)**
```typescript
export enum MoldState {
  Empty    = 'empty',
  Pouring  = 'pouring',
  Baking   = 'baking',
  Flipped  = 'flipped',
  Done     = 'done',
  Serving  = 'serving',
  Burnt    = 'burnt',
  Cleaning = 'cleaning',
}

export const MOLD_TRANSITIONS: Record<MoldState, MoldState[]> = {
  [MoldState.Empty]:    [MoldState.Pouring],
  [MoldState.Pouring]:  [MoldState.Baking, MoldState.Empty],
  [MoldState.Baking]:   [MoldState.Flipped, MoldState.Burnt],
  [MoldState.Flipped]:  [MoldState.Done, MoldState.Burnt],
  [MoldState.Done]:     [MoldState.Serving],
  [MoldState.Serving]:  [MoldState.Empty],
  [MoldState.Burnt]:    [MoldState.Cleaning],
  [MoldState.Cleaning]: [MoldState.Empty],
};

export function canTransition(from: MoldState, to: MoldState): boolean {
  return MOLD_TRANSITIONS[from].includes(to);
}

export type BakingQuality = 'PERFECT' | 'GOOD' | 'UNDER' | 'BURNT';
export type CustomerType = 'normal' | 'worker' | 'family' | 'vip';
export type MenuItem = keyof typeof import('./menu').MENU_DEFS;
export type AudioKey = 'flip' | 'perfect' | 'burnt' | 'customer_happy' | 'customer_angry';
```

**0-8. `vite.config.ts`**
```typescript
export default defineConfig({
  base: './',        // Capacitor 빌드 필수
  build: { target: 'esnext', rollupOptions: { output: { manualChunks: undefined } } },
});
```

**0-9. `public/index.html`**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0,
  viewport-fit=cover, user-scalable=no, maximum-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1a0a00;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    overflow: hidden;
  }
  @media (orientation: landscape) {
    body::before {
      content: "세로 화면으로 회전해주세요";
      display: flex; justify-content: center; align-items: center;
      position: fixed; inset: 0; background: #1a0a00; color: #fff;
      font-size: 1.2rem; z-index: 9999;
    }
    canvas { display: none; }
  }
</style>
```

---

### Phase 1: 굽기 타이밍 미니게임 (예상: 1.5일)

**1-1. `BungeaMold.ts` — 상태 생명주기 (CRITICAL #2 수정 — 모든 8상태 진입/지속/이탈 명시)**

| 상태 | 진입 트리거 | 지속 조건 | 이탈 트리거 |
|------|------------|----------|------------|
| Empty | 초기 / `Serving`·`Cleaning` 완료 후 자동 | - | 사용자 탭(pointerdown) |
| Pouring | Empty 탭 | 0.5초 애니메이션(반죽 흘러내리기) | 0.5초 후 자동 → Baking |
| Baking | Pouring 완료 자동 | progress 0→0.5 증가 (15초); 사용자 탭 가능 | 탭 → 판정 계산 → Flipped; progress≥1.0 → Burnt |
| Flipped | Baking에서 탭 (progress 0.70~1.00 미만) | progress 0.5→1.0 계속 증가 (나머지 15초) | progress≥1.0 → Done or Burnt (타이밍에 따라) |
| Done | Flipped에서 progress<1.0 완료 | 빛나는 이펙트 표시, 탭 대기 | 사용자 탭(꺼내기) → Serving |
| Serving | Done에서 탭 | 손님 위치로 트윈 이동(0.3초) | `EconomySystem.sell()` 완료 후 자동 → Empty |
| Burnt | Baking/Flipped에서 progress≥1.0 | 연기 이펙트, 탭 대기 | 사용자 탭(치우기) → Cleaning |
| Cleaning | Burnt에서 탭 | 0.3초 치우기 애니메이션 | 완료 후 자동 → Empty |

**1-2. 판정 로직 (`BungeaMold.onFlip()`) — CRITICAL #1 반영**
```typescript
onFlip(): BakingQuality | null {
  if (!canTransition(this.state, MoldState.Flipped)) return null;
  
  const p = this.progress;  // 현재 progress (0.0~1.0)
  const z = BAKING.flipZones;
  
  let quality: BakingQuality;
  if      (p >= z.perfect.min    && p < z.perfect.max)    quality = 'PERFECT';
  else if (p >= z.good_early.min && p < z.good_early.max) quality = 'GOOD';
  else if (p >= z.good_late.min  && p < z.good_late.max)  quality = 'GOOD';
  else if (p < z.under.max)                                quality = 'UNDER';
  else quality = 'BURNT'; // p >= 1.0은 이 메서드 호출 전에 처리되어 있으나 방어 코드

  this.quality = quality;
  this.transitionTo(MoldState.Flipped);
  return quality;
}
```

**1-3. 색상 tint 매핑**
```typescript
private getColorTint(progress: number): number {
  if (progress < 0.30) return 0xFFFFFF; // 흰색
  if (progress < 0.60) return 0xFFE066; // 노랑
  if (progress < 0.85) return 0xD4A017; // 황금
  if (progress < 0.95) return 0x8B4513; // 갈색
  return 0x1a1a1a;                       // 검정(탄)
}
```

**1-4. 입력 디바운스** — Pouring·Cleaning·Serving 상태 중 탭은 `canTransition()` 가드로 자동 무시

---

### Phase 2: 손님 시스템 (예상: 1.5일)

**2-1. `Customer.ts` — VIP NaN 가드 (MAJOR #4 수정)**
```typescript
class Customer {
  private readonly def = CUSTOMER_DEFS[this.type];
  private readonly startedAt = Date.now();
  
  get remainingMs(): number {
    if (this.def.patience === Infinity) return Infinity; // NaN 가드
    return Math.max(0, this.def.patience - (Date.now() - this.startedAt));
  }
  
  get patienceRatio(): number {
    if (this.def.patience === Infinity) return 1.0; // VIP 항상 1.0
    return this.remainingMs / this.def.patience;
  }
  
  isExpired(): boolean {
    if (this.def.patience === Infinity) return false; // VIP 만료 없음
    return this.remainingMs <= 0;
  }
}
```

**2-2. `CustomerUI.ts` — VIP patience 게이지 미표시**
```typescript
update() {
  if (this.customer.type === 'vip') {
    this.patienceBar.setVisible(false); // VIP: 게이지 미표시
    this.expressionSprite.setFrame('happy'); // 항상 웃음
    return;
  }
  
  const ratio = this.customer.patienceRatio;
  // 게이지 바 색상
  const color = ratio > 0.6 ? 0x00cc00 : ratio > 0.3 ? 0xffcc00 : 0xff3300;
  this.patienceBar.fillStyle(color).fillRect(0, 0, 100 * ratio, 8);
  // 표정 전환
  const frame = ratio > 0.6 ? 'happy' : ratio > 0.3 ? 'neutral' : 'angry';
  this.expressionSprite.setFrame(frame);
}
```

**2-3. `CustomerSpawnerSystem.ts`**
```typescript
class CustomerSpawnerSystem {
  private queue: Customer[] = [];
  private maxQueue = 5;
  private lastSpawnAt = 0;
  
  update(shopLevel: 1|2|3): void {
    const interval = SPAWN_INTERVAL_MS[shopLevel];
    if (Date.now() - this.lastSpawnAt >= interval && this.queue.length < this.maxQueue) {
      this.spawnCustomer();
      this.lastSpawnAt = Date.now();
    }
    // 만료된 손님 처리
    this.queue
      .filter(c => c.isExpired())
      .forEach(c => { this.onCustomerLeft(c); this.removeCustomer(c); });
  }
  
  private onCustomerLeft(c: Customer): void {
    this.economySystem.decreaseReputation(1);
  }
}
```

---

### Phase 3: 경제/진행 시스템 (예상: 1일)

**3-1. `EconomySystem.ts`**
```typescript
class EconomySystem {
  sell(item: MenuItem, quality: BakingQuality, customer: Customer): number {
    const base = MENU_DEFS[item].price;
    const multiplier = BAKING.priceMultiplier[quality];
    const tip = base * customer.def.tipRate; // 가족: +10%
    const earned = Math.floor(base * multiplier + tip);
    this.gold += earned;
    this.events.emit('gold-changed', this.gold);
    return earned;
  }
  
  buyIngredient(type: IngredientType, qty: number): boolean {
    const cost = INGREDIENT_DEFS[type].pricePerBatch;
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.stock[type] += qty;
    this.events.emit('gold-changed', this.gold);
    return true;
  }
  
  consume(type: IngredientType): boolean {
    if ((this.stock[type] ?? 0) <= 0) return false;
    this.stock[type]--;
    if (this.stock[type] === 0) this.events.emit('ingredient-exhausted', type);
    return true;
  }
  
  decreaseReputation(amount: number): void {
    this.reputation = Math.max(0, this.reputation - amount);
    this.events.emit('reputation-changed', this.reputation);
  }
}
```

**3-2. `SaveSystem.ts` — 비동기 저장, 저장 트리거 명시**
```typescript
interface SaveData {
  version: 'v1';
  gold: number;
  shopLevel: number;
  dayNumber: number;
  stock: Record<string, number>;
  reputation: number;
  savedAt: number;
}

class SaveSystem {
  constructor(private storage: IStorage) {}
  
  async save(data: SaveData): Promise<void> {
    try {
      await this.storage.set('bungeo_save_v1', JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch { /* silent fail */ }
  }
  
  async load(): Promise<SaveData | null> {
    try {
      const raw = await this.storage.get('bungeo_save_v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.version !== 'v1') return null; // 버전 불일치 시 신규 게임
      return parsed;
    } catch {
      return null; // JSON 파싱 실패 시 신규 게임
    }
  }
}
// 저장 트리거: DailySummaryScene 진입 시(하루 종료), TitleScene 복귀 시
// 백그라운드 전환: v2에서 Capacitor App.addListener('appStateChange') 추가
```

---

### Phase 4: Day System + 정산 화면 (예상: 1일)

**4-1. `GameScene.ts` — Date.now() 타이머**
```typescript
private dayStartMs = 0;

create() {
  this.dayStartMs = Date.now();
  this.scene.launch('UIScene', { gameScene: this });
}

update() {
  const elapsed = Date.now() - this.dayStartMs;
  const remaining = DAY.durationMs - elapsed;
  
  if (remaining <= 0 && !this.dayEnded) {
    this.dayEnded = true;
    this.endDay();
    return;
  }
  
  this.events.emit('timer-update', Math.max(0, remaining) / DAY.durationMs);
  this.customerSpawner.update(this.shopLevel);
}

private endDay() {
  // Day 종료 시 미완성 빵: Baking/Flipped → 강제 Burnt, 손님 큐: 전원 '영업 종료' 처리 (평판 감소 없음)
  this.molds.forEach(m => { if (['baking', 'flipped', 'pouring'].includes(m.state)) m.forceBurnt(); });
  this.customerSpawner.clearQueueNopenalty(); // 영업 종료 시 손님 큐 평판 패널티 없이 정리
  const stats = this.collectDayStats();
  this.saveSystem.save(stats); // Day 종료 시 저장
  this.scene.start('DailySummaryScene', stats);
}
```

**4-2. `DailySummaryScene.ts`**
- 별점 계산: `Math.ceil((satisfied / total) * 3)` (1~3)
- 숫자 카운터 업: `this.tweens.addCounter({ from: 0, to: target, duration: 800 })`
- "내일 시작" → `this.scene.start('GameScene')` + dayNumber+1

---

### Phase 5: UIScene + HUD (예상: 1.2일)

**5-1. `UIScene.ts` — GameScene 병렬 실행**
```typescript
// GameScene.create()에서:
this.scene.launch('UIScene');

// UIScene은 독립 카메라 → GameScene 카메라 효과 영향 없음
class UIScene extends Phaser.Scene {
  create() {
    const gameScene = this.scene.get('GameScene') as GameScene;
    gameScene.events.on('timer-update', (ratio: number) => this.updateTimerBar(ratio));
    gameScene.events.on('gold-changed', (gold: number) => this.goldText.setText(`${gold}G`));
  }
}
```

**5-2. `TitleScene.ts`**
```typescript
async create() {
  const save = await this.saveSystem.load();
  if (save) {
    this.showButtons(['이어서 하기', '새로 시작']);
  } else {
    this.scene.start('GameScene'); // 저장 없으면 바로 시작
  }
}
```

---

### Phase 6: 오디오 (예상: 0.5일)

**`AudioGateway.ts` — MAJOR #2 수정 (Events.UNLOCKED 리스너 + pending queue)**
```typescript
class AudioGateway {
  private pendingPlays: AudioKey[] = [];
  
  constructor(private sound: Phaser.Sound.BaseSoundManager) {
    // Phaser.Sound.Events.UNLOCKED: Web Audio Context unlock 완료 시 발화
    this.sound.on(Phaser.Sound.Events.UNLOCKED, () => {
      this.pendingPlays.forEach(key => this.sound.play(key, { volume: 0.7 }));
      this.pendingPlays = [];
    });
  }
  
  play(key: AudioKey): void {
    if (this.sound.locked) {
      this.pendingPlays.push(key); // unlock 전 큐에 추가
      return;
    }
    this.sound.play(key, { volume: 0.7 });
  }
}
// Reference: Phaser 3 docs — Sound.Events.UNLOCKED
// https://newdocs.phaser.io/docs/3.60.0/Phaser.Sound.Events.UNLOCKED
```

필수 SFX: `flip`, `perfect`, `burnt`, `customer_happy`, `customer_angry` (5종 최소)

---

### Phase 7: 픽셀 아트 에셋 (예상: 1일, 병렬)

스프라이트 목록:
- 붕어빵 틀 스프라이트시트: 5프레임
- 손님 4종 × 표정 3종 = 12 스프라이트 + VIP 웃음 고정 1종
- UI: 게이지 바, 말풍선, 버튼, HUD 배경
- 이펙트 텍스처: 황금 파티클, 하트, 분노

권장 툴: **Aseprite** (유료, $20) 또는 **Piskel** (무료)
AI 생성: DALL-E 3 또는 Midjourney — **상업 라이선스 확인 필수** (v2 광고 수익화 계획 고려)
- DALL-E 3: OpenAI ToS 상 생성 이미지 상업적 사용 가능
- Midjourney: Midjourney ToS Basic Plan 이상에서 상업적 사용 가능

---

### Phase 8: 배포 (예상: 0.5일)

**8-1. Vercel 배포**
```json
// vercel.json
{ "buildCommand": "npm run build", "outputDirectory": "dist", "framework": null }
```

**8-2. Capacitor 초기 구조 (v2 준비)**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init BungeoTycoon com.siyoon.bungeotycoon --web-dir dist
# capacitor.config.ts: webDir: 'dist', server.url: 없음 (로컬 번들)
# android/ios 는 v2에서 생성
```

**8-3. 번들 크기 검증**
```bash
npm run build && ls -lh dist/assets/*.js
# 목표: 최대 파일 ≤500KB gzip
# gzip 측정: gzip -9 dist/assets/*.js -c | wc -c
```

---

## Risks and Mitigations (v3)

| 리스크 | 가능성 | 영향 | 완화 방법 |
|--------|--------|------|----------|
| 모바일 60fps 미달 | 중 | 높음 | 스프라이트 배칭, 파티클 수 ≤50개, Phaser FIT scale |
| 픽셀 아트 에셋 지연 | 높음 | 중 | 게임 로직 먼저 placeholder 도형으로 구현, 에셋은 마지막 교체 |
| Web Audio unlock 실패 | 낮음 | 낮음 | AudioGateway pending queue + Events.UNLOCKED 리스너 |
| localStorage Private Mode | 중 | 낮음 | `LocalStorageAdapter.try-catch`, quota 초과 시 silent fail |
| iOS 노치 HUD 가려짐 | 중 | 낮음 | `viewport-fit=cover` + `env(safe-area-inset-top)` |
| Galaxy Fold DPR 변동 블러 | 낮음 | 중 | `Phaser.Scale.FIT + autoCenter: CENTER_BOTH + pixelArt: true` |
| Capacitor 백그라운드 타이머 | 중 | 중 | Date.now() 기반 타이머, v2에서 `App.addListener('appStateChange')` |
| 손님 밸런스 불균형 | 중 | 중 | `data/balance.ts` 수치 집중 → 빠른 수치 조정 |
| 에셋 라이선스 | 낮음 | 높음 | AI 생성 에셋 상업 라이선스 확인 후 사용 |
| SaveData JSON 파싱 실패 | 낮음 | 중 | `SaveSystem.load()`에서 try-catch + null 반환 → 신규 게임 |

---

## Verification Steps (v3 — 측정 기준 명시)

1. **굽기 판정 4종** — 30초 타이머로 progress 0.90(PERFECT), 0.78(GOOD), 0.50(UNDER) 시점에 탭 → 각 판정 + 판매가 배율 확인. 미탭으로 100% 도달 → BURNT + 판매 차단 확인
2. **BURNT 판매 차단** — BURNT 상태의 틀에 손님 납품 시도 → `canTransition(Burnt, Serving) = false`로 차단 확인
3. **VIP patience NaN 없음** — VIP 등장 시 `console.log(customer.patienceRatio)` → `1.0` 출력 확인 (NaN 아님)
4. **손님 큐** — 직장인(30초 patience) 등장 → 35초 후 자동 이탈 → 평판 감소 확인; `CustomerSpawnerSystem.queue` 길이 정확히 감소
5. **저장/로드** — 골드 500G 상태에서 새로고침 → `TitleScene`에서 "이어서 하기" 버튼 표시 + 500G 유지; `JSON.parse` 오류 시뮬레이션 → 신규 게임 시작 확인
6. **레벨업** — 500G → 레벨 2 업그레이드 → 틀 6개 표시, 크림치즈 메뉴 활성화; `UpgradeSystem.upgrade()` 이벤트 수신 확인
7. **Day 종료** — 5분 경과 → `DailySummaryScene` 자동 전환 + 진행 중 빵 Burnt 처리 확인; 2분 플레이 후 앱 전환 1분 → 복귀 시 남은 시간 2분 유지 (Date.now() 기반)
8. **UIScene 독립** — GameScene 카메라 `shake(200, 0.01)` 호출 → HUD(UIScene) 흔들리지 않음 확인
9. **오디오 unlock** — 모바일 브라우저에서 첫 탭 후 굽기 완성 → 효과음 재생 확인 (iOS Safari 실기 또는 BrowserStack)
10. **Lighthouse** — `npm run build && vercel deploy --prod` 후 Chrome DevTools → Lighthouse → Mobile(Slow 4G) 실행 → Performance Score ≥60 확인
11. **번들 크기** — `npm run build` 후 gzip 측정 → ≤500KB 확인
12. **Capacitor sync** — `npx cap sync` 실행 → 오류 없음 (v2 선행 검증)

---

## ADR (v3 최종)

### Decision
Phaser.js 3.x + TypeScript + Vite + **3개 어댑터(IStorage, AudioGateway, Date.now() 타이머)** + 5씬 구조 + 8상태 BungeaMold 머신

### Drivers
1. 모바일 60fps (Canvas 하드웨어 가속, Phaser FIT scale)
2. Capacitor.js 호환 (IStorage, AudioGateway, 표준 API; Phaser 직결 3개 지점 추상화)
3. 개발 속도 (Phaser 게임 특화 API, AI 어시스트 학습 데이터 풍부)
4. 핵심 루프 품질 (8상태 머신, 판정 구간 AC-데이터 일치)

### Alternatives Considered
- **PixiJS**: +4일(씬1일+입력0.5일+오디오1일+트윈1.5일), 번들 -200KB. ROI 부족으로 탈락.
- **Unity WebGL**: 5MB+, 모바일 4G 로딩 15초+. 즉시 탈락.
- **Godot HTML5**: HTML5 내보내기 안정성 이슈. 탈락.

### Why Chosen
Phaser의 게임 특화 API가 +4일 PixiJS 비용을 상쇄하며, 3개 얇은 어댑터로 Capacitor 약속을 코드에 실제 반영. Critic 지적된 판정 모순(CRITICAL #1)과 상태 미정의(CRITICAL #2)를 데이터 레벨에서 해소.

### Consequences
- 긍정: 즉시 시작, 게임 API, v2 마이그레이션 최소화, AC-데이터 일관성
- 부정: 번들 ~400KB gzip, Phaser 씬 생명주기 학습
- 중립: 3개 어댑터 +0.3일, 5씬 구조 +0.5일

### Follow-ups
- v2: `CapacitorPreferencesAdapter` 구현 (IStorage 교체, SaveSystem 무변경)
- v2: Capacitor `App.addListener('appStateChange')` 백그라운드 처리
- v2: 주간 이벤트, 레벨 4~5, 알바생, 서버 저장

---

## Changelog (v2 → v3)

| 변경 | 근거 |
|------|------|
| `balance.ts` 판정 구간 `good_late: [0.95, 1.00)` 추가, 반개구간 명시 | Critic CRITICAL #1: AC-데이터 불일치 수정 |
| `types.ts`에 상태 생명주기 표 추가 (진입/지속/이탈 8상태 모두) | Critic CRITICAL #2: Pouring/Serving 등 미정의 상태 해소 |
| AC 헤더 정정 ("수정 없음" 삭제), 3개 AC 항목 추가 | Critic CRITICAL #3: 스펙 누락 항목 반영 |
| Option B 비용 산정 근거 세분화 (씬/입력/오디오/트윈 별도 기재) | Critic MAJOR #1: 들러리 의혹 해소 |
| AudioGateway: `Events.UNLOCKED` 리스너 + `pendingPlays` 큐 명시 | Critic MAJOR #2: Phaser unlock API 정확화 |
| AC 측정 기준 명시 (Lighthouse Slow 4G, BrowserStack, LCP < 5초) | Critic MAJOR #3: 테스트 가능성 강화 |
| VIP `remainingMs/patienceRatio` NaN 가드 추가 | Critic MAJOR #4: Infinity-Infinity=NaN 버그 수정 |
| 가족 손님 팁(`tipRate: 0.1`) `EconomySystem.sell()`에 반영 | Critic MINOR #3: GDD 팁 정책 구현 |
| Day 종료 미완성 빵/손님 큐 처리 명시 | Critic GAP: 미처리 케이스 정의 |
| `SaveSystem.load()` JSON 파싱 실패 처리 | Critic GAP: 저장 오류 복원력 |
| 저장 트리거 명시 (Day 종료 + TitleScene 복귀) | Critic GAP: 세이브 타이밍 정의 |
| 번들 크기 AC 추가 (≤500KB gzip) | Critic GAP: 번들 크기 검증 |
| 가로 모드 orientation lock CSS 추가 | Critic GAP + 딥인터뷰 스펙 Portrait lock |
| `menu.ts` 코드 예시 추가 | Critic MINOR #4: 데이터 소스 명확화 |
| `EffectSystem.ts` objects/ 배치 사유 명시 | Critic MINOR #2: 이동 정당화 |

---

## Estimated Timeline (v3)

| Phase | 작업 | 예상 소요 |
|-------|------|----------|
| Phase 0 | 프로젝트 초기 설정 (5씬 + 어댑터 + 타입) | 0.8일 |
| Phase 1 | 굽기 타이밍 미니게임 (8상태 + 판정 로직) | 1.5일 |
| Phase 2 | 손님 시스템 (VIP NaN 가드 + SpawnerSystem) | 1.5일 |
| Phase 3 | 경제/진행 시스템 (팁 + 저장 트리거) | 1일 |
| Phase 4 | Day System + 정산 (미완성 빵/큐 처리) | 1일 |
| Phase 5 | UIScene + HUD + TitleScene | 1.2일 |
| Phase 6 | 오디오 (AudioGateway + 큐) | 0.5일 |
| Phase 7 | 픽셀 아트 에셋 | 1일 (병렬) |
| Phase 8 | 배포 + 검증 | 0.5일 |
| **합계** | | **~9일** |
