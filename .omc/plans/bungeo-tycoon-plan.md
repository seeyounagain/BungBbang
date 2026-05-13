# 붕어빵 타이쿤 MVP 구현 계획 — 최종 합의본

> **Status: pending approval**
> Spec: `.omc/specs/deep-interview-bungeo-tycoon.md`
> Iteration: v3 → Final (Critic ACCEPT-WITH-RESERVATIONS 반영)
> Architect REVISE → 반영 완료 | Critic REVISE(v2) → 반영 완료 | Critic ACCEPT-WITH-RESERVATIONS(v3) → 최종 반영

---

## RALPLAN-DR Summary (확정)

### Principles
1. **모바일 웹 우선** — 터치 기반, 세로 320~430px, iOS Safari/Android Chrome에서 완벽 동작
2. **핵심 루프 품질 우선** — 굽기 타이밍 쾌감이 전체 재미의 근간. 판정 로직이 AC·데이터·코드에서 3-way 일관됨
3. **AI 어시스트 친화적 구조** — 단일 책임 클래스, 8상태 머신은 데이터(전이표)로 분리
4. **점진적 확장** — IStorage·AudioGateway·Date.now() 타이머 3개 어댑터로 Capacitor 확장 경로를 코드에 실제 반영
5. **빠른 이터레이션** — `data/balance.ts`에 모든 수치 집중, Vite HMR

### Decision Drivers
1. 모바일 60fps 렌더링 (Canvas 하드웨어 가속)
2. Capacitor.js 호환성 — IStorage, AudioGateway, 표준 API only
3. 개발 속도 — Phaser.js 게임 특화 API (씬, 오디오, 트윈, 파티클)

### Viable Options

**Option A: Phaser.js 3.x + TypeScript (선택)**
- Pro: 게임 특화 API 내장, 픽셀 아트 스케일링, AI 어시스트 학습 데이터 풍부
- Con: 번들 ~400KB gzip, 씬 생명주기 학습 곡선

**Option B: PixiJS (탈락)** — 추가 구현 비용: 씬1일 + 입력0.5일 + 오디오1일 + 트윈1.5일 = **+4일**. 번들 -200KB 절감이 ROI 불충분.

**Option C: Unity WebGL (탈락)** — 초기 로딩 5MB+, 즉시 탈락.

**Option D: Godot HTML5 (탈락)** — HTML5 내보내기 안정성 이슈, 탈락.

---

## Requirements Summary

딥 인터뷰(13라운드, 최종 모호성 19%) 확정:
- MVP: 레벨 1→3, 손님 4종, 굽기 4단계 판정, Day System (5분), localStorage 저장
- 비주얼: 32~64px 픽셀 아트, 필수 애니메이션 4종
- 오디오: 효과음 5~10종 (BGM 없음)
- 배포: Vercel 또는 GitHub Pages
- 확장: Capacitor.js 앱 래핑 (v2)

---

## Acceptance Criteria

> 딥 인터뷰 스펙 기준 + 아키텍처 검토 추가 명세

### 코어 게임플레이
- [ ] `BungeaMold` 탭(pointerdown) 시 `Pouring` 전이(0.5초 반죽 애니메이션) → 자동 `Baking` 전이
- [ ] `Baking` 프로그레스 바 0→1.0 (30초, `BAKING.totalDuration`)
- [ ] 뒤집기 탭 판정 (반개구간 `[a, b)` 적용):
  - **PERFECT:** `[0.85, 0.95)` — 판매가 ×1.2
  - **GOOD (조기):** `[0.70, 0.85)` — 기본 판매가
  - **GOOD (후기):** `[0.95, 1.00)` — 기본 판매가
  - **UNDER:** `[0.00, 0.70)` — 판매가 ×0.7
  - **BURNT:** `Baking` 또는 `Flipped` 상태에서 progress = 1.00 도달 시 자동 전이
  - `Flipped` 상태에서 progress < 1.00일 때 탭(꺼내기) → `Done` 전이
- [ ] 손님 4종 등장: 일반(60s), 직장인(30s), 가족(90s), VIP(무제한, patience 게이지 미표시)
- [ ] 손님 머리 위 주문 말풍선(메뉴 아이콘) 표시
- [ ] 인내심 만료 전 납품 → 골드+경험치, 초과 → 평판 감소
- [ ] 잘못된 메뉴 납품(손님 주문과 불일치) → 손님 거부, 인내심 유지
- [ ] 하루 5분(Date.now() 기반) 후 `DailySummaryScene` 자동 전환
- [ ] 정산 화면: 총 판매수 / 매출 / 버린빵 수 / 불만족 손님수 / 별점(1~3, total=0 시 별점 1)
- [ ] GDD 5.1 화면 구성 4영역(상단HUD / 손님대기줄 / 틀그리드 / 하단메뉴) 모바일 세로 레이아웃
- [ ] iOS Safari 16.4+(BrowserStack 또는 실기): 굽기 1회 + 손님 응대 1회 완료
- [ ] Android Chrome 100+(Pixel 5 에뮬레이터 또는 실기): 동일 플로우 확인

### 성장/경제 시스템
- [ ] 재료 구매: 밀가루(100G/50회분), 단팥(150G/40회분), 크림치즈(200G/20회분), 슈크림(250G/20회분)
- [ ] 500G → 레벨 2: 틀 6개, 크림치즈 해금
- [ ] 1,500G → 레벨 3: 틀 8개, 슈크림 해금
- [ ] 가족 손님 만족 시 팁(판매가 ×10%) 추가 지급
- [ ] 재료 소진 시 해당 메뉴 제작 버튼 비활성화 + 재료 구매 유도 UI
- [ ] `bungeo_save_v1` 키로 localStorage 저장, 재방문 시 진행 상태 유지

### 비주얼 & 오디오
- [ ] 붕어빵 색상 5단계 tint 변화
- [ ] 손님 표정 3종(웃음/불만/분노) patience 비율 구간별 전환; VIP 항상 웃음
- [ ] PERFECT 완성 시 황금 파티클 이펙트(0.5초)
- [ ] 납품 성공 시 하트, patience 초과 시 분노 이펙트
- [ ] 효과음 5종 이상(첫 탭 이후 Web Audio unlock)

### 기술 & 배포
- [ ] Phaser.js 3.x + TypeScript 프로젝트 구성, `npm run dev` 로컬 실행
- [ ] `npm run build` 성공, Vercel 정상 배포
- [ ] LCP < 5초 (Lighthouse Mobile, Slow 4G throttling, cold cache)
- [ ] Lighthouse Performance Score ≥ 60 (Mobile, Slow 4G)
- [ ] 번들 크기 ≤ 500KB gzip
- [ ] `vite.config.ts` `base: './'`, portrait lock CSS, safe-area inset

---

## Implementation Steps

### Phase 0: 프로젝트 초기 설정 (0.8일)

**구조:**
```
BPT/
├── src/
│   ├── main.ts
│   ├── config.ts
│   ├── scenes/
│   │   ├── BootScene.ts           # registry·scale 초기화, 로딩화면용 최소 에셋
│   │   ├── PreloadScene.ts        # 전체 에셋 + 진행률 바
│   │   ├── TitleScene.ts          # 세이브 분기
│   │   ├── GameScene.ts
│   │   ├── UIScene.ts             # GameScene 병렬 launch
│   │   └── DailySummaryScene.ts
│   ├── objects/
│   │   ├── BungeaMold.ts
│   │   ├── Customer.ts
│   │   ├── CustomerUI.ts
│   │   └── EffectSystem.ts        # 씬에서 생성되는 파티클/이펙트 오브젝트
│   ├── systems/
│   │   ├── EconomySystem.ts
│   │   ├── CustomerSpawnerSystem.ts
│   │   ├── UpgradeSystem.ts
│   │   ├── AudioGateway.ts
│   │   └── storage/
│   │       ├── IStorage.ts
│   │       ├── LocalStorageAdapter.ts
│   │       └── SaveSystem.ts
│   └── data/
│       ├── types.ts               # enum, interface, 전이 가드
│       ├── balance.ts             # 모든 수치
│       ├── customers.ts
│       ├── ingredients.ts         # INGREDIENT_DEFS
│       └── menu.ts
├── public/index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**`src/data/balance.ts`:**
```typescript
export const BAKING = {
  totalDuration: 30_000,
  flippedDoneAt: 0.75,  // Flipped 상태에서 progress가 이 값 미만일 때 탭 → Done
                         // progress >= flippedDoneAt 에서 탭 → Burnt (과열)
  flipZones: {
    under:      { min: 0.00, max: 0.70 } as const,
    good_early: { min: 0.70, max: 0.85 } as const,
    perfect:    { min: 0.85, max: 0.95 } as const,
    good_late:  { min: 0.95, max: 1.00 } as const,
  },
  priceMultiplier: { PERFECT: 1.2, GOOD: 1.0, UNDER: 0.7, BURNT: 0 },
  colorTint: [
    { maxProgress: 0.30, tint: 0xFFFFFF },
    { maxProgress: 0.60, tint: 0xFFE066 },
    { maxProgress: 0.85, tint: 0xD4A017 },
    { maxProgress: 0.95, tint: 0x8B4513 },
    { maxProgress: 1.00, tint: 0x1a1a1a },
  ],
};

export const DAY = { durationMs: 5 * 60 * 1_000 };

export const UPGRADES = [
  { level: 1, name: '노점',     cost:     0, slots: 4 },
  { level: 2, name: '작은 가게', cost:   500, slots: 6 },
  { level: 3, name: '동네 맛집', cost: 1_500, slots: 8 },
] as const;

export const SPAWN_INTERVAL_MS: Record<1|2|3, number> = { 1: 15_000, 2: 12_000, 3: 10_000 };
```

**`src/data/ingredients.ts`:**
```typescript
export const INGREDIENT_DEFS = {
  flour:       { name: '밀가루',   pricePerBatch: 100, batchSize: 50 },
  red_bean:    { name: '단팥',     pricePerBatch: 150, batchSize: 40 },
  cream_cheese:{ name: '크림치즈', pricePerBatch: 200, batchSize: 20 },
  choux:       { name: '슈크림',   pricePerBatch: 250, batchSize: 20 },
} as const;
export type IngredientType = keyof typeof INGREDIENT_DEFS;
```

**`src/data/menu.ts`:**
```typescript
import type { IngredientType } from './ingredients';
export const MENU_DEFS = {
  red_bean:    { name: '단팥 붕어빵',    price: 300, unlockLevel: 1, ingredient: 'red_bean'     as IngredientType },
  cream_cheese:{ name: '크림치즈 붕어빵', price: 450, unlockLevel: 2, ingredient: 'cream_cheese' as IngredientType },
  choux:       { name: '슈크림 붕어빵',  price: 600, unlockLevel: 3, ingredient: 'choux'        as IngredientType },
} as const;
export type MenuItem = keyof typeof MENU_DEFS;
```

**`src/data/types.ts` — 8상태 머신:**
```typescript
export enum MoldState {
  Empty    = 'empty',    Pouring  = 'pouring',
  Baking   = 'baking',  Flipped  = 'flipped',
  Done     = 'done',    Serving  = 'serving',
  Burnt    = 'burnt',   Cleaning = 'cleaning',
}

export const MOLD_TRANSITIONS: Record<MoldState, MoldState[]> = {
  [MoldState.Empty]:    [MoldState.Pouring],
  [MoldState.Pouring]:  [MoldState.Baking],          // Pouring은 취소 불가 (0.5초 짧음)
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
export type CustomerType   = 'normal' | 'worker' | 'family' | 'vip';
export type AudioKey       = 'flip' | 'perfect' | 'burnt' | 'customer_happy' | 'customer_angry';
```

**`vite.config.ts`:** `base: './'` 설정 (Capacitor 빌드 필수)

**`public/index.html`:** `viewport-fit=cover`, `env(safe-area-inset-top)`, landscape 안내 화면

---

### Phase 1: 굽기 타이밍 미니게임 (1.5일)

**`BungeaMold.ts` — 상태 생명주기:**

| 상태 | 진입 트리거 | 지속 조건 | 이탈 트리거 |
|------|------------|----------|------------|
| Empty | 초기 / Serving·Cleaning 자동 완료 | — | 사용자 탭(pointerdown) |
| Pouring | Empty 탭 | 0.5초 반죽 애니메이션 | 0.5초 후 자동 → Baking |
| Baking | Pouring 완료 자동 | progress 0→1.0 증가; 사용자 뒤집기 탭 가능 | 뒤집기 탭 → onFlip() → Flipped; progress≥1.0 → Burnt |
| Flipped | Baking 뒤집기 탭 | progress 계속 증가 | progress < `flippedDoneAt`(0.75) 시 탭 → Done; progress≥`flippedDoneAt` 시 탭 또는 progress≥1.0 → Burnt |
| Done | Flipped 탭 (progress<0.75) | 파티클 이펙트, 꺼내기 탭 대기 | 사용자 탭(꺼내기) → Serving |
| Serving | Done 탭 | 손님 위치 트윈(0.3초) | EconomySystem.sell() 완료 후 자동 → Empty |
| Burnt | Baking/Flipped에서 progress≥1.0 또는 Flipped에서 progress≥0.75 탭 | 연기 이펙트 | 사용자 탭(치우기) → Cleaning |
| Cleaning | Burnt 탭 | 0.3초 치우기 애니메이션 | 완료 후 자동 → Empty |

**`forceBurnt()` 메서드 (Day 종료 강제 처리):**
```typescript
// BungeaMold.ts
forceBurnt(): void {
  // 전이 가드 우회: Day 종료 시 영업 중단으로 강제 폐기
  // MOLD_TRANSITIONS를 거치지 않고 상태를 직접 설정
  this.progress = 1.0;
  this.state = MoldState.Burnt;
  this.quality = 'BURNT';
  this.cookTimer?.remove();
  this.playBurntEffect();
}
```

**`onFlip()` — 판정 로직:**
```typescript
onFlip(): BakingQuality | null {
  if (this.state === MoldState.Flipped) {
    // Flipped 상태에서 탭: Done 또는 Burnt
    const isBurnt = this.progress >= BAKING.flippedDoneAt;
    this.transitionTo(isBurnt ? MoldState.Burnt : MoldState.Done);
    return isBurnt ? 'BURNT' : this.quality; // 이미 계산된 quality 반환
  }
  
  if (!canTransition(this.state, MoldState.Flipped)) return null;
  
  const p = this.progress;
  const z = BAKING.flipZones;
  let quality: BakingQuality;
  
  if      (p >= z.perfect.min    && p < z.perfect.max)    quality = 'PERFECT';
  else if (p >= z.good_early.min && p < z.good_early.max) quality = 'GOOD';
  else if (p >= z.good_late.min  && p < z.good_late.max)  quality = 'GOOD';
  else if (p < z.under.max)                                quality = 'UNDER';
  else    quality = 'BURNT'; // 방어 코드: 0.70~1.00 미매칭 케이스
  
  this.quality = quality;
  this.transitionTo(MoldState.Flipped);
  return quality;
}
```

---

### Phase 2: 손님 시스템 (1.5일)

**`Customer.ts`:**
```typescript
class Customer {
  readonly def = CUSTOMER_DEFS[this.type];
  private readonly startedAt = Date.now();
  
  get remainingMs(): number {
    if (this.def.patience === Infinity) return Infinity;
    return Math.max(0, this.def.patience - (Date.now() - this.startedAt));
  }
  
  get patienceRatio(): number {
    if (this.def.patience === Infinity) return 1.0;
    return this.remainingMs / this.def.patience;
  }
  
  isExpired(): boolean {
    if (this.def.patience === Infinity) return false;
    return this.remainingMs <= 0;
  }
  
  canAccept(item: MenuItem): boolean {
    return this.order.includes(item); // 잘못된 메뉴 납품 시 거부
  }
}
```

**`CustomerSpawnerSystem.ts`:**
```typescript
class CustomerSpawnerSystem {
  private queue: Customer[] = [];
  private readonly maxQueue = 5;
  private lastSpawnAt = 0;
  
  update(shopLevel: 1|2|3): void {
    const interval = SPAWN_INTERVAL_MS[shopLevel];
    if (Date.now() - this.lastSpawnAt >= interval && this.queue.length < this.maxQueue) {
      this.spawnCustomer();
      this.lastSpawnAt = Date.now();
    }
    this.queue.filter(c => c.isExpired()).forEach(c => {
      this.economySystem.decreaseReputation(1);
      this.removeCustomer(c);
    });
  }
  
  // Day 종료 시 손님 큐 평판 패널티 없이 정리
  clearQueueNoPenalty(): void {
    this.queue.forEach(c => c.destroy());
    this.queue = [];
  }
  
  serveCustomer(customer: Customer, item: MenuItem): boolean {
    if (!customer.canAccept(item)) return false; // 잘못된 메뉴 거부
    this.removeCustomer(customer);
    return true;
  }
}
```

**`CustomerUI.ts` — VIP 분기:**
```typescript
update(): void {
  if (this.customer.type === 'vip') {
    this.patienceBar.setVisible(false);
    this.expressionSprite.setFrame('happy');
    return;
  }
  const ratio = this.customer.patienceRatio;
  const color = ratio > 0.6 ? 0x00cc00 : ratio > 0.3 ? 0xffcc00 : 0xff3300;
  this.patienceBar.fillStyle(color).fillRect(0, 0, 100 * ratio, 8);
  this.expressionSprite.setFrame(ratio > 0.6 ? 'happy' : ratio > 0.3 ? 'neutral' : 'angry');
}
```

---

### Phase 3: 경제/진행 시스템 (1일)

**`EconomySystem.ts`:**
```typescript
class EconomySystem {
  sell(item: MenuItem, quality: BakingQuality, customer: Customer): number {
    if (quality === 'BURNT') return 0;
    const base   = MENU_DEFS[item].price;
    const mult   = BAKING.priceMultiplier[quality];
    const tip    = base * customer.def.tipRate;
    const earned = Math.floor(base * mult + tip);
    this.gold += earned;
    this.events.emit('gold-changed', this.gold);
    return earned;
  }
  
  buyIngredient(type: IngredientType, qty: number): boolean {
    const cost = INGREDIENT_DEFS[type].pricePerBatch;
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.stock[type] = (this.stock[type] ?? 0) + qty;
    this.events.emit('gold-changed', this.gold);
    return true;
  }
  
  consume(type: IngredientType): boolean {
    if ((this.stock[type] ?? 0) <= 0) return false;
    this.stock[type]!--;
    if (this.stock[type] === 0) this.events.emit('ingredient-exhausted', type);
    return true;
  }
  // consume()은 BungeaMold가 Pouring 진입 시 GameScene을 통해 호출
}
```

**`UpgradeSystem.ts`:**
```typescript
class UpgradeSystem {
  canUpgrade(currentLevel: number, gold: number): boolean {
    const next = UPGRADES.find(u => u.level === currentLevel + 1);
    return !!next && gold >= next.cost;
  }
  
  upgrade(currentLevel: number): UpgradeResult {
    const next = UPGRADES[currentLevel]; // index = level (1-based)
    this.events.emit('shop-upgraded', { newLevel: next.level, slots: next.slots });
    return { newLevel: next.level, newSlots: next.slots };
  }
}
```

**`SaveSystem.ts` (IStorage 의존, 비동기):**
```typescript
class SaveSystem {
  constructor(private storage: IStorage) {}
  
  async save(data: SaveData): Promise<void> {
    try { await this.storage.set('bungeo_save_v1', JSON.stringify({ ...data, savedAt: Date.now() })); }
    catch { /* silent fail */ }
  }
  
  async load(): Promise<SaveData | null> {
    try {
      const raw = await this.storage.get('bungeo_save_v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveData;
      return parsed.version === 'v1' ? parsed : null;
    } catch { return null; }
  }
}
// 저장 트리거: DailySummaryScene 진입 시 + TitleScene "이어서 하기" 클릭 전
// v2: Capacitor App.addListener('appStateChange') 추가
```

---

### Phase 4: Day System + 정산 (1일)

**`GameScene.ts` — Date.now() 타이머:**
```typescript
class GameScene extends Phaser.Scene {
  private dayStartMs = 0;
  private dayEnded   = false; // 초기값 명시, create()에서 리셋
  
  create(): void {
    this.dayEnded   = false;
    this.dayStartMs = Date.now();
    this.scene.launch('UIScene');
  }
  
  update(): void {
    const elapsed   = Date.now() - this.dayStartMs;
    const remaining = DAY.durationMs - elapsed;
    
    if (remaining <= 0 && !this.dayEnded) {
      this.dayEnded = true;
      this.endDay();
      return;
    }
    this.events.emit('timer-update', Math.max(0, remaining) / DAY.durationMs);
    this.customerSpawner.update(this.shopLevel as 1|2|3);
  }
  
  private endDay(): void {
    // 진행 중 빵 강제 폐기 (평판 패널티 없음)
    this.molds.forEach(m => {
      if ([MoldState.Baking, MoldState.Flipped, MoldState.Pouring].includes(m.state))
        m.forceBurnt();
    });
    // 대기 손님 정리 (평판 패널티 없음 — 영업 종료)
    this.customerSpawner.clearQueueNoPenalty();
    
    const stats = this.collectDayStats();
    this.saveSystem.save(stats);
    this.scene.start('DailySummaryScene', stats);
  }
}
```

**`DailySummaryScene.ts`:**
- 별점: `total > 0 ? Math.ceil((satisfied / total) * 3) : 1` (total=0 NaN 방어)
- 카운터 업 트윈: `this.tweens.addCounter({ from: 0, to: target, duration: 800 })`
- "내일 시작" → `this.scene.start('GameScene')` + dayNumber+1

---

### Phase 5: UIScene + HUD + TitleScene (1.2일)

**`UIScene.ts` — GameScene 병렬 launch, 독립 카메라:**
```typescript
// GameScene.create()에서: this.scene.launch('UIScene');
class UIScene extends Phaser.Scene {
  create(): void {
    const g = this.scene.get('GameScene') as GameScene;
    g.events.on('timer-update',  (r: number) => this.updateTimerBar(r));
    g.events.on('gold-changed',  (g: number) => this.goldText.setText(`${g}G`));
    g.events.on('reputation-changed', (r: number) => this.updateReputation(r));
  }
}
```

HUD: `[Day N] [=====타임바=====] [★★☆] [1,200G]`

**`TitleScene.ts`:**
```typescript
async create(): Promise<void> {
  const save = await this.saveSystem.load();
  if (save) {
    // "이어서 하기": save 데이터를 GameScene에 전달
    // "새로 시작": saveSystem.remove() 후 GameScene 시작
    this.showContinueButtons(save);
  } else {
    this.scene.start('GameScene');
  }
}
private showContinueButtons(save: SaveData): void {
  this.createButton('이어서 하기', () => this.scene.start('GameScene', { save }));
  this.createButton('새로 시작',   () => { this.saveSystem.remove(); this.scene.start('GameScene'); });
}
```

하단 메뉴: 재료 보기 / 업그레이드 / 꾸미기(v2 placeholder, 비활성화 표시)

---

### Phase 6: 오디오 (0.5일)

**`AudioGateway.ts`:**
```typescript
class AudioGateway {
  private pendingPlays: AudioKey[] = [];
  
  constructor(private sound: Phaser.Sound.BaseSoundManager) {
    // Phaser.Sound.Events.UNLOCKED: Web Audio Context unlock 완료 시 발화
    // Ref: https://newdocs.phaser.io/docs/3.60.0/Phaser.Sound.Events.UNLOCKED
    this.sound.on(Phaser.Sound.Events.UNLOCKED, () => {
      this.pendingPlays.forEach(k => this.playKey(k));
      this.pendingPlays = [];
    });
  }
  
  play(key: AudioKey): void {
    if (this.sound.locked) { this.pendingPlays.push(key); return; }
    this.playKey(key);
  }
  
  private playKey(key: AudioKey): void {
    this.sound.play(key, { volume: 0.7 });
  }
}
```

필수 SFX 5종: `flip`, `perfect`, `burnt`, `customer_happy`, `customer_angry`

---

### Phase 7: 픽셀 아트 에셋 (1일, 병렬)

- 붕어빵 틀 스프라이트시트: 5프레임
- 손님 4종 × 표정 3종 + VIP 고정 = 13 스프라이트
- UI: 게이지 바, 말풍선, 버튼, HUD 배경
- 이펙트: 황금 파티클, 하트, 분노
- AI 생성(DALL-E 3 / Midjourney): **상업 라이선스 확인 필수** (OpenAI ToS / Midjourney Basic Plan)

---

### Phase 8: 배포 (0.5일)

```json
// vercel.json
{ "buildCommand": "npm run build", "outputDirectory": "dist", "framework": null }
```

Capacitor 초기 구조 (v2 준비):
```bash
npm install @capacitor/core @capacitor/cli
npx cap init BungeoTycoon com.siyoon.bungeotycoon --web-dir dist
```

번들 검증: `npm run build && gzip -9 dist/assets/*.js -c | wc -c` → ≤500KB 확인

---

## Risks and Mitigations

| 리스크 | 가능성 | 영향 | 완화 |
|--------|--------|------|------|
| 모바일 60fps 미달 | 중 | 높음 | 스프라이트 배칭, 파티클 ≤50개, Phaser FIT + pixelArt:true |
| 픽셀 아트 에셋 지연 | 높음 | 중 | 게임 로직 먼저 placeholder 구현, 에셋은 마지막 교체 |
| Web Audio unlock | 낮음 | 낮음 | AudioGateway pending queue + Events.UNLOCKED 리스너 |
| localStorage Private Mode | 중 | 낮음 | try-catch, quota 초과 시 silent fail |
| iOS 노치 HUD 가려짐 | 중 | 낮음 | viewport-fit=cover + env(safe-area-inset-top) |
| Capacitor 백그라운드 타이머 | 중 | 중 | Date.now() 델타 기반 (v1부터 적용) |
| 에셋 라이선스 | 낮음 | 높음 | AI 생성 에셋 상업 라이선스 확인 후 사용 |
| JSON 파싱 실패 | 낮음 | 중 | SaveSystem.load() try-catch → 신규 게임 |

---

## Verification Steps

1. **굽기 4판정** — progress 0.90→PERFECT, 0.78→GOOD, 0.50→UNDER, 무탭→BURNT 확인
2. **Flipped→Done vs Burnt** — Flipped 진입 후 progress 0.60(0.75 미만) 탭→Done; progress 0.80(0.75 이상) 탭→Burnt 확인
3. **BURNT 판매 차단** — Burnt 상태에서 손님 납품 시도 → `canTransition(Burnt, Serving)=false` 확인
4. **잘못된 메뉴 거부** — 단팥 주문 손님에게 크림치즈 납품 시도 → `customer.canAccept()=false` 확인
5. **VIP NaN 없음** — VIP 등장 시 `patienceRatio === 1.0`, patience 게이지 미표시 확인
6. **저장/로드** — 500G 후 새로고침 → TitleScene "이어서 하기" + 500G 유지; JSON 손상 시뮬레이션 → 신규 게임
7. **레벨업** — 500G → 레벨2 업그레이드 → 틀 6개, 크림치즈 메뉴 활성화, `UpgradeSystem.upgrade()` 이벤트 확인
8. **Day 종료** — 5분 경과 → DailySummaryScene 자동 전환; 진행 중 빵 forceBurnt 처리 확인; 앱 전환 1분 후 복귀 → 남은 시간 정확 확인
9. **UIScene 독립** — GameScene 카메라 shake → HUD 흔들리지 않음 확인
10. **오디오 unlock** — iOS Safari BrowserStack에서 첫 탭 후 완성 SFX 재생 확인
11. **Lighthouse** — Vercel 배포 후 Lighthouse Mobile Slow 4G → Performance ≥60 확인
12. **번들 크기** — gzip 측정 → ≤500KB 확인

---

## ADR (최종)

### Decision
Phaser.js 3.x + TypeScript + Vite + IStorage·AudioGateway·Date.now() 어댑터 + 5씬 + 8상태 BungeaMold 머신

### Drivers
1. 모바일 60fps (Canvas 가속)
2. Capacitor 호환 (어댑터 3개)
3. 개발 속도 (Phaser API + AI 어시스트)
4. 핵심 루프 품질 (3-way AC·데이터·코드 정합성)

### Alternatives Considered
- PixiJS: +4일(씬/입력/오디오/트윈), 번들 -200KB — ROI 불충분
- Unity WebGL: 5MB+, 4G 15초+ — 즉시 탈락
- Godot HTML5: HTML5 내보내기 불안정 — 탈락

### Why Chosen
Phaser API가 +4일 PixiJS 비용을 상쇄. 3개 어댑터로 Capacitor 약속을 코드에 반영. 8상태 머신 + `flippedDoneAt` 임계치로 핵심 루프 판정 3-way 정합성 확보.

### Consequences
- 긍정: 즉시 시작, v2 마이그레이션 최소화, AC-데이터-코드 일관성
- 부정: 번들 ~400KB gzip, 씬 생명주기 학습
- 중립: 어댑터·5씬 +1.3일 (디버깅 절감으로 실질 비용 더 작음)

### Follow-ups
- v2: CapacitorPreferencesAdapter, App.addListener('appStateChange'), 광고 수익화
- v2: 주간 이벤트, 레벨 4~5, 알바생, 서버 저장

---

## Estimated Timeline

| Phase | 작업 | 소요 |
|-------|------|------|
| Phase 0 | 초기 설정 (5씬 + 어댑터 + 타입) | 0.8일 |
| Phase 1 | 굽기 미니게임 (8상태 + 판정) | 1.5일 |
| Phase 2 | 손님 시스템 (VIP 가드 + SpawnerSystem) | 1.5일 |
| Phase 3 | 경제/진행 (팁 + 재료 + 저장) | 1일 |
| Phase 4 | Day System + 정산 | 1일 |
| Phase 5 | UIScene + HUD + TitleScene | 1.2일 |
| Phase 6 | 오디오 (AudioGateway) | 0.5일 |
| Phase 7 | 픽셀 아트 에셋 (병렬) | 1일 |
| Phase 8 | 배포 + 검증 | 0.5일 |
| **합계** | | **~9일** |
