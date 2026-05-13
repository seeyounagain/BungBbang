# [DRAFT v2] 붕어빵 타이쿤 MVP 구현 계획

> Status: DRAFT v2 — Architect 피드백 반영
> Spec: `.omc/specs/deep-interview-bungeo-tycoon.md`
> Architect Verdict: REVISE → 적용 완료

---

## RALPLAN-DR Summary (v2)

### Principles (확정)
1. **모바일 웹 우선** — 터치 기반, 세로 320~430px, iOS Safari/Android Chrome에서 완벽 동작
2. **핵심 루프 품질 우선** — 굽기 타이밍 쾌감이 전체 재미의 근간
3. **AI 어시스트 친화적 구조** — 모듈화된 TypeScript, 명확한 씬/시스템 분리
4. **점진적 확장** — localStorage → 서버, Web → Capacitor 전환을 지원하는 얇은 어댑터 (코드에 실제 새겨짐)
5. **빠른 이터레이션** — Vite HMR, 독립 씬 테스트, `data/balance.ts` 수치 집중

### Decision Drivers (Top 3)
1. 모바일 60fps 렌더링 (Canvas 하드웨어 가속)
2. Capacitor.js 호환성 — IStorage 어댑터 + 표준 API만 사용
3. 개발 속도 — Phaser.js 게임 특화 API (씬, 오디오, 트윈, 파티클) 활용

### Viable Options

**Option A: Phaser.js 3.x + TypeScript (선택, Architect 합성 경로 반영)**
- Pro: 게임 특화 API, 픽셀 아트 스케일링, 파티클/트윈/오디오 내장
- Con: 번들 ~400KB gzip, 씬 생명주기 학습 곡선
- **Capacitor 리스크 완화**: IStorage 어댑터, Date.now() 타이머, AudioGateway로 Phaser 직접 결합 3개 지점 추상화

**Option B: PixiJS + 커스텀 (재평가 후 탈락 유지)**
- 번들 -200KB는 장점이나 씬/입력/오디오 직접 구현 ≈ +4일. AI 어시스트 맥락에서도 Phaser API가 더 잘 문서화됨
- **무효화 사유 유지**: 개발 공수 증가가 번들 크기 절감을 정당화하지 못함

---

## Requirements Summary (딥 인터뷰 13라운드, 모호성 19%)

- MVP: 레벨 1→3, 손님 4종, 굽기 4단계 판정, Day System (5분), localStorage 저장
- 비주얼: 32~64px 픽셀 아트, 필수 애니메이션 4종
- 오디오: 효과음 5~10종 (BGM 없음)
- 배포: Vercel 또는 GitHub Pages
- 확장: Capacitor.js 앱 래핑 (v2)

---

## Acceptance Criteria (v2, 수정 없음 — 딥 인터뷰 스펙 기준)

### 코어 게임플레이
- [ ] `BungeaMold` 탭 시 반죽 붓기 → 굽기 프로그레스 바 시작 (기본 30초)
- [ ] 뒤집기 타이밍에 따라 4단계 판정: PERFECT(85~95%), GOOD(70~85% 또는 95~100%), UNDER(<70%), BURNT(프로그레스 100% 도달)
- [ ] PERFECT +20%, GOOD 기본가, UNDER -30%, BURNT 판매 불가
- [ ] 손님 4종: 일반(60초), 직장인(30초), 가족(90초), VIP(무제한)
- [ ] 인내심 만료 전 납품 시 골드+경험치, 초과 시 평판 감소
- [ ] 하루 5분 후 `DailySummaryScene` 자동 전환 (Date.now() 기반 타이머)
- [ ] 정산 화면: 총 판매수 / 매출 / 버린빵 수 / 불만족 손님수 / 별점(1~3)
- [ ] iOS Safari 16+ / Android Chrome 100+에서 터치 동작 확인

### 성장/경제 시스템
- [ ] 골드로 밀가루(100G/50회분), 단팥(150G/40회분) 구매 가능
- [ ] 500G → 레벨 2: 틀 6개, 크림치즈 해금
- [ ] 1,500G → 레벨 3: 틀 8개, 슈크림 해금
- [ ] `bungeo_save_v1` 키로 localStorage 저장, 재방문 시 진행 상태 유지

### 비주얼 & 오디오
- [ ] 붕어빵 색상 변화 5단계 tint 적용
- [ ] 손님 표정 3종 (웃음/불만/분노) patience 구간별 전환
- [ ] PERFECT 완성 시 파티클 이펙트 (0.5초)
- [ ] 만족/불만족 하트/분노 이펙트
- [ ] 효과음 5종 이상 (뒤집기/완성/BURNT/만족/불만)

### 기술 & 배포
- [ ] `npm run build` 성공, Vercel 정상 배포
- [ ] 배포 URL 모바일 브라우저 로딩 5초 이내
- [ ] 첫 탭 이후 오디오 재생 (Web Audio unlock)
- [ ] `vite.config.ts`에 `base: './'` 설정 (Capacitor 호환)
- [ ] viewport `viewport-fit=cover` + safe-area CSS 적용

---

## Implementation Steps (v2 — Architect 피드백 반영)

### Phase 0: 프로젝트 초기 설정 (예상: 0.5일)

**0-1. 프로젝트 구조 (v2 — 5씬 + 어댑터 포함)**

```
BPT/
├── src/
│   ├── main.ts                    # Phaser.Game 진입점
│   ├── config.ts                  # 게임 설정 (390×844, pixelArt: true)
│   ├── scenes/
│   │   ├── BootScene.ts           # Phaser registry, scale manager 초기화
│   │   ├── PreloadScene.ts        # 에셋 로딩 + 진행률 바 표시
│   │   ├── TitleScene.ts          # 세이브 분기 (이어서/새로 시작)
│   │   ├── GameScene.ts           # 메인 게임 로직 (씬 lifecycle만)
│   │   ├── UIScene.ts             # HUD + 모달 (GameScene과 병렬 launch)
│   │   └── DailySummaryScene.ts   # 일일 정산
│   ├── objects/
│   │   ├── BungeaMold.ts          # 붕어빵 틀 오브젝트 + 상태머신
│   │   ├── Customer.ts            # 손님 오브젝트
│   │   ├── CustomerUI.ts          # 손님 말풍선 + patience 게이지
│   │   └── EffectSystem.ts        # 파티클/이펙트 관리
│   ├── systems/
│   │   ├── EconomySystem.ts       # 골드, 재료, 가격
│   │   ├── CustomerSpawnerSystem.ts  # 손님 큐 + 스폰 관리
│   │   ├── UpgradeSystem.ts       # 레벨업, 틀 슬롯, 메뉴 해금
│   │   ├── AudioGateway.ts        # 오디오 추상화 (Phaser sound 래핑)
│   │   └── storage/
│   │       ├── IStorage.ts        # 스토리지 인터페이스 (Capacitor 확장 지점)
│   │       ├── LocalStorageAdapter.ts  # MVP 구현
│   │       └── SaveSystem.ts      # IStorage에 의존, 게임 데이터 직렬화
│   └── data/
│       ├── types.ts               # 공통 타입, enum
│       ├── balance.ts             # 게임 밸런스 수치 (타이밍, patience, 가격)
│       ├── customers.ts           # 손님 4종 정의 (type, patience, reward)
│       └── menu.ts                # 메뉴 4종 정의 (name, cost, price, unlock)
├── public/
│   └── index.html                 # viewport-fit=cover, safe-area CSS
├── package.json
├── tsconfig.json
└── vite.config.ts                 # base: './', pixelArt 최적화
```

**0-2. 핵심 설정값 (`src/data/balance.ts` — 모든 수치 집중)**
```typescript
export const BAKING = {
  totalDuration: 30000,
  flipZones: {
    perfect: [0.85, 0.95] as [number, number],
    good:    [0.70, 0.85] as [number, number],
    under:   [0.00, 0.70] as [number, number],
  },
  priceMultiplier: { PERFECT: 1.2, GOOD: 1.0, UNDER: 0.7, BURNT: 0 },
};

export const DAY = { durationMs: 5 * 60 * 1000 };

export const UPGRADES = [
  { level: 1, name: '노점',    cost:      0, slots: 4 },
  { level: 2, name: '작은 가게', cost:    500, slots: 6 },
  { level: 3, name: '동네 맛집', cost:  1_500, slots: 8 },
];
```

**0-3. `src/data/customers.ts`**
```typescript
export const CUSTOMER_DEFS = {
  normal:  { patience: 60_000, orderMin: 1, orderMax: 2,  tipRate: 0 },
  worker:  { patience: 30_000, orderMin: 1, orderMax: 1,  tipRate: 0 },
  family:  { patience: 90_000, orderMin: 3, orderMax: 5,  tipRate: 0.1 },
  vip:     { patience: Infinity, orderMin: 5, orderMax: 10, tipRate: 0 },
} as const;
```

**0-4. `src/systems/storage/IStorage.ts`**
```typescript
export interface IStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
// v2에서 CapacitorPreferencesAdapter.ts 추가 → SaveSystem 코드 변경 없음
```

**0-5. `vite.config.ts`**
```typescript
export default defineConfig({
  base: './',  // Capacitor 빌드 필수
  build: { target: 'esnext' },
});
```

**0-6. `public/index.html`**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0,
  viewport-fit=cover, user-scalable=no">
<style>
  body { padding-top: env(safe-area-inset-top); /* iOS 노치 대응 */ }
</style>
```

---

### Phase 1: 굽기 타이밍 미니게임 (예상: 1.5일)

**1-1. `BungeaMold.ts` — 명시적 상태머신 (Architect P1 반영)**

```typescript
// src/data/types.ts
export enum MoldState {
  Empty = 'empty',
  Pouring = 'pouring',
  Baking = 'baking',
  Flipped = 'flipped',   // ← Architect 추가: 뒤집힌 후 굽기 계속
  Done = 'done',
  Serving = 'serving',
  Burnt = 'burnt',       // ← Architect 추가: 판매 불가 상태
  Cleaning = 'cleaning', // ← Architect 추가: 탄빵 치우는 상태
}

// 전이 가드 (src/data/types.ts)
const MOLD_TRANSITIONS: Record<MoldState, MoldState[]> = {
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
```

**BungeaMold 핵심 로직:**
- `baking` 상태: 프로그레스 0→0.5까지 증가, `onFlip()` 가능
- `flipped` 상태: 프로그레스 0.5→1.0 계속 증가 (뒤집기 후 2면 굽기)
- `prgoress >= 1.0` 미처리 시 → `Burnt` 전이
- 색상 변화: progress 구간별 tint (흰/노랑/황금/갈색/검정)
- 입력 디바운스: `Pouring` 중 탭 무시 (중복 pour 방지)

---

### Phase 2: 손님 시스템 (예상: 1.5일)

**2-1. `CustomerSpawnerSystem.ts` — GameScene 분리 (Architect P2 반영)**
```typescript
class CustomerSpawnerSystem {
  private queue: Customer[] = [];
  private maxQueue = 5;
  
  update(deltaMs: number): void  // 스폰 간격 타이머
  spawnCustomer(scene: Phaser.Scene): Customer  // Customer 생성 + 씬 추가
  removeCustomer(customer: Customer): void
  serveCustomer(customer: Customer, items: MenuItem[]): ServeResult
}
```

스폰 간격: `data/balance.ts`에서 레벨별 관리
- 레벨1: 15초, 레벨2: 12초, 레벨3: 10초

**2-2. `Customer.ts`**
- `CustomerType` enum → `data/customers.ts` CUSTOMER_DEFS 참조
- patience 타이머: `Date.now()` 기반 (Phaser TimerEvent 대신)
  ```typescript
  private startedAt = Date.now();
  get remainingMs(): number {
    return Math.max(0, this.def.patience - (Date.now() - this.startedAt));
  }
  ```
- VIP: `patience = Infinity`, remainingMs 항상 Infinity

**2-3. `CustomerUI.ts`**
- 인내심 게이지 바: Phaser Graphics 업데이트
- 표정 스프라이트: patience 비율 구간별 (`>0.6` 웃음, `0.3~0.6` 불만, `<0.3` 분노)
- 주문 말풍선: 메뉴 아이콘 Container

---

### Phase 3: 경제/진행 시스템 (예상: 1일)

**3-1. `EconomySystem.ts`**
- `sell(item, quality)`: 골드 증가, `data/menu.ts` 가격표 참조
- `buyIngredient(type, qty)`: 재고 추가, 골드 차감
- `consume(type)`: 재고 감소, 0이면 `false` 반환

**3-2. `UpgradeSystem.ts`**
- `canUpgrade(currentLevel, gold)`: boolean
- `upgrade()`: 골드 차감, 틀 슬롯 확장, 메뉴 해금 이벤트 발행

**3-3. `SaveSystem.ts` (IStorage 의존)**
```typescript
class SaveSystem {
  constructor(private storage: IStorage) {}  // DI

  async save(data: SaveData): Promise<void> {
    await this.storage.set('bungeo_save_v1', JSON.stringify(data));
  }
  async load(): Promise<SaveData | null> {
    const raw = await this.storage.get('bungeo_save_v1');
    return raw ? JSON.parse(raw) : null;
  }
}
// main.ts에서: new SaveSystem(new LocalStorageAdapter())
// v2에서: new SaveSystem(new CapacitorPreferencesAdapter()) — SaveSystem 코드 변경 없음
```

---

### Phase 4: Day System + 정산 화면 (예상: 1일)

**4-1. Date.now() 기반 타이머 (Architect P2 반영)**
```typescript
// GameScene.ts
private dayStartTime = 0;

create() {
  this.dayStartTime = Date.now();
}

update() {
  const elapsed = Date.now() - this.dayStartTime;
  const remaining = DAY.durationMs - elapsed;
  
  if (remaining <= 0) {
    this.endDay();
    return;
  }
  // UIScene 이벤트로 타임바 업데이트
  this.events.emit('timer-update', remaining / DAY.durationMs);
}
```
- 백그라운드 전환 후 복귀 시 경과 시간 정확히 반영
- Capacitor `App.addListener('appStateChange')` 지원 준비

**4-2. `DailySummaryScene.ts`**
- props: `{ totalSold, revenue, wasted, unhappy, starRating }`
- 숫자 카운터 업 트윈 (0.8초)
- 별점: `만족 손님 / 총 손님` 비율로 1~3별
- "내일 시작" → `GameScene` 재시작 + dayNumber+1 + SaveSystem.save()

---

### Phase 5: UIScene + HUD (예상: 1일)

**5-1. `UIScene.ts` — GameScene과 병렬 (Architect P1 반영)**
```typescript
// GameScene.create()에서:
this.scene.launch('UIScene');
// UIScene은 별도 카메라 → GameScene 카메라 쉐이크/줌 영향 없음
```

**HUD 구성 (UIScene):**
```
[Day 3] [====타임바====] [★★☆] [1,200G]
```
- `events.on('timer-update', ratio)` → 타임바 업데이트
- `events.on('gold-changed', amount)` → 골드 텍스트 업데이트

**5-2. 하단 메뉴 (UIScene 모달 컨테이너)**
- 재료 보기: 재고 현황 + 구매 버튼
- 업그레이드: 현재 레벨, 다음 레벨 비용, 업그레이드 버튼
- 꾸미기: v2 placeholder (비활성화)

**5-3. `TitleScene.ts` (Architect P1 반영)**
```typescript
async create() {
  const save = await this.saveSystem.load();
  if (save) {
    // "이어서 하기" / "새로 시작" 버튼 표시
  } else {
    // 바로 GameScene 시작
    this.scene.start('GameScene');
  }
}
```

---

### Phase 6: 오디오 (예상: 0.5일)

**`AudioGateway.ts` — Phaser sound 추상화 (Architect 합성 경로 반영)**
```typescript
class AudioGateway {
  constructor(private sound: Phaser.Sound.BaseSoundManager) {}
  
  play(key: AudioKey): void {
    // unlock 체크 + 재생
    if (this.sound.locked) { /* 큐에 추가, unlock 후 재생 */ return; }
    this.sound.play(key, { volume: 0.7 });
  }
  
  unlock(): void { this.sound.unlock(); }
}
// v2: Capacitor Native Audio 교체 시 AudioGateway만 수정
```

필수 SFX 5종 (`src/data/types.ts`의 `AudioKey` enum):
- `flip`, `perfect`, `burnt`, `customer_happy`, `customer_angry`

---

### Phase 7: 픽셀 아트 에셋 (예상: 1일, 병렬)

스프라이트 목록:
- 붕어빵 틀 스프라이트시트: 5프레임 (흰/노랑/황금/갈색/검정)
- 손님 4종 × 표정 3종 = 12 스프라이트
- UI 요소: 게이지 바, 말풍선, 버튼, HUD 배경
- 이펙트 텍스처: 황금 파티클, 하트, 분노

권장 툴: **Aseprite** (유료) 또는 **Piskel** (무료 온라인)
AI 생성: DALL-E 3 + "pixel art, 64x64, chibi fish waffle bread" 프롬프트 후 Aseprite로 후처리

---

### Phase 8: 배포 (예상: 0.5일)

**8-1. Vercel 배포**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null
}
```

**8-2. Capacitor 초기 구조 (v2 준비, MVP에서는 설정만)**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init BungeoTycoon com.siyoon.bungeotycoon
# capacitor.config.ts에 webDir: 'dist' 설정
# android/ios 디렉토리는 v2에서 생성
```

**8-3. 배포 체크리스트**
- [ ] `npm run build` 에러 없음, `dist/` 산출물 확인
- [ ] Vercel 배포 URL 확인
- [ ] iOS Safari (실기 or BrowserStack) 터치 전체 플로우 확인
- [ ] Android Chrome 터치 확인 + 오디오 첫 탭 이후 재생 확인
- [ ] Lighthouse 모바일 성능 60점 이상

---

## Risks and Mitigations (v2, Architect 리스크 추가)

| 리스크 | 가능성 | 영향 | 완화 방법 |
|--------|--------|------|----------|
| 모바일 60fps 미달 | 중 | 높음 | 스프라이트 배칭, 파티클 수 제한, Phaser FIT scale mode |
| 픽셀 아트 에셋 제작 지연 | 높음 | 중 | 게임 로직 먼저 placeholder 도형으로 구현, 에셋은 마지막에 교체 |
| Web Audio unlock 실패 | 낮음 | 낮음 | AudioGateway에서 unlock 큐 + 첫 인터랙션 재시도 패턴 |
| localStorage Private Mode | 중 | 낮음 | IStorage 어댑터 try-catch, 실패 시 메모리 폴백 |
| iOS 노치/safe-area 가려짐 | 중 | 낮음 | viewport-fit=cover + env(safe-area-inset-top) CSS 적용 |
| Galaxy Fold 등 DPR 변동 기기 블러 | 낮음 | 중 | Phaser.Scale.FIT + autoCenter + pixelArt:true 조합 |
| Capacitor WebView 백그라운드 타이머 | 중 | 중 | Date.now() 델타 기반 타이머 (v1부터 적용), 앱 복귀 시 경과시간 반영 |
| 손님 밸런스 (patience 너무 빠름/느림) | 중 | 중 | 모든 수치가 `data/balance.ts`에 집중 → 빠른 이터레이션 |

---

## Verification Steps (v2)

1. **굽기 루프** — 30초 굽기 → `flipped` 전이 확인 → 85~95% 구간에 뒤집기 → PERFECT 파티클, 골드+20% 확인
2. **BURNT 분리** — 뒤집기 없이 100% 도달 → `Burnt` 상태 전이, 손님 납품 시도 시 차단 확인
3. **손님 큐** — 직장인(30초) 등장 → 35초 후 자동 이탈 → 평판 감소, `CustomerSpawnerSystem` 큐에서 제거 확인
4. **저장/로드** — 500G 상태에서 새로고침 → 500G 유지, `TitleScene`에서 "이어서 하기" 버튼 표시 확인
5. **레벨업** — 500G → 레벨 2 업그레이드 → 틀 6개, 크림치즈 해금 → `UpgradeSystem.upgrade()` 이벤트 확인
6. **타이머 정확도** — 게임 시작 2분 후 다른 앱으로 전환 → 1분 후 복귀 → 남은 시간이 2분 (총 5분 기준) 확인
7. **UIScene 분리** — GameScene 카메라 흔들기 → HUD (UIScene)가 흔들리지 않음 확인
8. **Capacitor 빌드** — `npx cap sync` 실행 후 오류 없음 확인 (v2 선행)
9. **배포** — Vercel URL → iOS Safari/Android Chrome → 터치 전체 플로우 확인

---

## ADR (v2)

### Decision
Phaser.js 3.x + TypeScript + Vite + **IStorage 어댑터 + AudioGateway + Date.now() 타이머** + 5씬 구조

### Drivers
- 모바일 60fps 렌더링
- Capacitor.js 호환성 (IStorage, AudioGateway, 표준 API)
- 개발 속도 (Phaser 게임 특화 API)
- AI 어시스트 친화성 (명시적 상태머신, data 모듈 세분화)

### Alternatives Considered
- PixiJS: 가볍지만 게임 API 직접 구현 필요 (+4일), 탈락
- Unity WebGL: 강력하지만 초기 로딩 5MB+, 탈락
- Godot HTML5: HTML5 내보내기 안정성 이슈, 탈락

### Why Chosen
Phaser.js 게임 특화 API 활용 + 3개 지점의 얇은 어댑터(IStorage, AudioGateway, Date.now())로 Capacitor 확장 경로 보장. Architect 지적된 원칙 3-4 충돌을 최소 추상화로 해소.

### Consequences
- 긍정: 즉시 개발 시작, 게임 특화 API, v2 Capacitor 마이그레이션 최소화
- 부정: 3개 추상화 레이어 추가 (IStorage, AudioGateway, Date.now() 패턴) ≈ +0.3일
- 중립: 5씬 구조로 BootScene 역할이 명확해지고 HUD 결합도 해소

### Follow-ups
- v2: `CapacitorPreferencesAdapter` 구현으로 저장 방식 교체 (SaveSystem 코드 변경 없음)
- v2: Capacitor `@capacitor-community/native-audio` 도입 시 AudioGateway 내부만 수정
- v2: `App.addListener('appStateChange')` 백그라운드 진입/복귀 처리
- v2: 서버 저장 (Supabase), 주간 이벤트, 레벨 4~5

---

## Changelog (v1 → v2)

| 변경 | 근거 |
|------|------|
| 씬 3개 → 5개 (Boot/Preload/Title/Game+UI/DailySummary) | Architect P1: HUD 결합도, 로딩 UX, 세이브 분기 |
| BungeaMold 상태머신 5→8개 (flipped/burnt/cleaning 추가) | Architect P1: 8슬롯 race condition 방지, BURNT 판매 차단 |
| `IStorage` 어댑터 인터페이스 + `LocalStorageAdapter` | Architect P1: Capacitor 확장 약속 코드에 반영 |
| 5분 타이머 → Date.now() 델타 기반 | Architect P2: 백그라운드 전환 정확성 |
| `CustomerSpawnerSystem.ts` 분리 | Architect P2: God Scene 방지 |
| `data/balance.ts` + `customers.ts` + `menu.ts` 세분화 | Architect P2: 밸런싱 이터레이션 속도 |
| `AudioGateway.ts` 추상화 | Architect 합성 경로: Capacitor WebView 오디오 리스크 |
| `vite.config.ts` `base: './'` | Architect P3: Capacitor 빌드 호환 |
| `viewport-fit=cover` + safe-area CSS | Architect P3: iOS 노치 대응 |
| `EffectSystem.ts`, `CustomerUI.ts` 구조도 명시 | Architect P3: 구조도-본문 일관성 |

---

## Estimated Timeline (v2)

| Phase | 작업 | 예상 소요 |
|-------|------|----------|
| Phase 0 | 프로젝트 초기 설정 (5씬 + 어댑터 포함) | 0.8일 |
| Phase 1 | 굽기 타이밍 미니게임 (8상태 머신) | 1.5일 |
| Phase 2 | 손님 시스템 (SpawnerSystem 분리) | 1.5일 |
| Phase 3 | 경제/진행 시스템 (IStorage 기반) | 1일 |
| Phase 4 | Day System + 정산 (Date.now() 타이머) | 1일 |
| Phase 5 | UIScene + HUD + TitleScene | 1.2일 |
| Phase 6 | 오디오 (AudioGateway) | 0.5일 |
| Phase 7 | 픽셀 아트 에셋 | 1일 (병렬) |
| Phase 8 | 배포 + Capacitor 초기 구조 | 0.5일 |
| **합계** | | **~9일** (v1 대비 +0.5일) |
