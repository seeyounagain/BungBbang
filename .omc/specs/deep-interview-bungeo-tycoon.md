# Deep Interview Spec: 붕어빵 타이쿤 (BungeoTycoon)

## Metadata
- Interview ID: bungeo-tycoon-2026-0513
- Rounds: 13
- Final Ambiguity Score: 19%
- Type: greenfield
- Generated: 2026-05-13T07:15:00Z
- Threshold: 0.20
- Initial Context Summarized: no
- Status: PASSED

---

## Clarity Breakdown

| 차원 | 점수 | 가중치 | 가중 점수 |
|------|------|--------|-----------|
| Goal Clarity | 0.83 | 0.40 | 0.33 |
| Constraint Clarity | 0.79 | 0.30 | 0.24 |
| Success Criteria | 0.80 | 0.30 | 0.24 |
| **Total Clarity** | | | **0.81** |
| **Ambiguity** | | | **0.19 (19%)** |

---

## Topology

| 컴포넌트 | 상태 | 설명 | 커버리지 |
|---------|------|------|---------|
| 코어 게임플레이 | active | 굽기 타이밍 미니게임 + 손님 대응 + Day System (하루 5분) | 4단계 판정, 4종 손님, 일일 정산 화면 포함. 주간 이벤트 제외(v2). |
| 성장/경제 시스템 | active | 재료 관리, 골드 경제, 가게 레벨업(5단계 중 MVP는 1→3) | GDD 가격표 기반 경제 밸런스. 레벨 4~5, 알바생/자동화/체인점은 v2. |
| 비주얼 & UI | active | 2D 픽셀 아트 (32~64px), 화면 구성, 4종 필수 애니메이션 | 색상변화/표정변화/PERFECT이펙트/하트분노이펙트 필수. BGM 없음, SFX 5~10종. |
| 기술 기반 & 플랫폼 | active | Phaser.js + TypeScript + Capacitor.js, 모바일 웹 우선 | Vercel/GitHub Pages 배포. localStorage 저장. 서버·앱 스토어 출시는 v2. |

---

## Goal

모바일 웹 브라우저에서 바로 플레이할 수 있는 2D 픽셀 아트 붕어빵 타이쿤 게임을 만든다.

플레이어는 길거리 노점(레벨 1)에서 시작해 `골드를 모아 → 가게를 업그레이드하고 → 새 소 재료를 해금`하는 아크를 통해 레벨 3(동네 맛집, 슈크림 해금)까지 성장하는 경험을 한다. 하루는 실시간 5분이며, 굽기 타이밍 미니게임과 손님 응대가 핵심 루프를 이룬다.

Phaser.js + TypeScript로 개발하고, AI 코딩 도구(Claude Code)로 제작. 초기 배포는 Vercel/GitHub Pages, 추후 Capacitor.js로 Android/iOS 앱 확장 예정.

---

## Constraints

### 기술
- **게임 엔진:** Phaser.js 3.x + TypeScript
- **앱 확장 경로:** Capacitor.js (동일 코드베이스로 Android/iOS 래핑)
- **저장 방식:** localStorage (MVP). 서버 동기화는 v2.
- **배포:** Vercel 또는 GitHub Pages (무료 도메인, 링크 공유)
- **수익화:** MVP 무료 공개. 향후 앱 버전에서 광고 수익.

### 게임플레이 범위 (MVP)
- **업그레이드 범위:** 레벨 1→2→3 (레벨 4~5는 v2)
- **손님 종류:** 4종 모두 포함 (일반/직장인/가족/VIP)
- **붕어빵 틀:** 4개(레벨1) → 6개(레벨2) → 8개(레벨3)
- **메뉴:** 단팥(기본) → 크림치즈(레벨2 해금) → 슈크림(레벨3 해금)
- **주간 이벤트:** v2 제외
- **알바생/자동화/체인점:** v2 제외
- **서버/계정 시스템:** v2 제외

### 비주얼
- **스프라이트 크기:** 32×32 ~ 64×64px (디테일한 픽셀 아트)
- **필수 애니메이션 4종:**
  1. 붕어빵 색상 변화 (흰→노랑→황금→갈색→검정)
  2. 손님 표정 변화 (웃음→불만→분노)
  3. PERFECT 판정 시 빛나는 이펙트
  4. 만족/불만족 하트/분노 이펙트

### 오디오
- **BGM:** 없음 (MVP)
- **효과음:** 5~10종 (뒤집기, 완성, 손님 리액션 등)
- 모바일 웹 오디오 제한 대응: 첫 사용자 탭 이후 오디오 시작

---

## Non-Goals (MVP 제외)

- 주간 이벤트 시스템 (7일 사이클)
- 레벨 4 (유명 가게) 및 레벨 5 (붕어빵 왕국)
- 알바생 고용 시스템
- 자동화 시스템
- 체인점 시스템
- BGM / 배경음악
- 서버 저장 / 계정 로그인
- Android/iOS 앱 스토어 출시 (v2)
- 수익화 광고 구현 (v2)
- 꾸미기 아이템 전체 (간판 디자인, 조명 장식 등) — 최소 1~2종만 MVP 검토

---

## Acceptance Criteria

### 코어 게임플레이
- [ ] 붕어빵 틀 탭 시 반죽 붓기 → 굽기 프로그레스 바 진행
- [ ] 뒤집기 타이밍에 따라 황금(PERFECT)/보통(GOOD)/덜익음(UNDER)/탄빵(BURNT) 판정 4종 모두 동작
- [ ] PERFECT 판정 시 판매가 +20%, UNDER 판정 시 판매가 -30%, BURNT는 판매 불가
- [ ] 손님 4종(일반/직장인/가족/VIP) 등장 및 인내심 게이지 동작
- [ ] 손님 머리 위 주문 말풍선 표시 (메뉴 아이콘)
- [ ] 인내심 게이지 0 전 붕어빵 제공 시 골드+경험치 획득, 시간 초과 시 평판 감소
- [ ] 하루 5분(실시간) 후 일일 정산 화면 표시 (판매수/매출/버린빵/불만족 손님/별점)
- [ ] 모바일 세로 화면에서 정상 동작 (터치 인터랙션)

### 성장/경제 시스템
- [ ] 골드로 밀가루/단팥 재료 구매 가능
- [ ] 500G 모아 레벨 2(작은 가게) 업그레이드 가능, 틀 6개+크림치즈 소 해금
- [ ] 1,500G 모아 레벨 3(동네 맛집) 업그레이드 가능, 틀 8개+슈크림 소 해금
- [ ] 골드/재료 현황이 localStorage에 저장되어 브라우저 재방문 시 유지

### 비주얼 & UI
- [ ] 붕어빵 색상 변화 애니메이션 동작 (흰→노랑→황금→갈색→검정)
- [ ] 손님 표정 변화 애니메이션 동작 (웃음→불만→분노)
- [ ] PERFECT 완성 시 빛나는 이펙트 표시
- [ ] 손님 만족/불만족 하트/분노 이펙트 표시
- [ ] GDD 5.1 화면 구성(상단HUD/손님대기줄/틀그리드/하단메뉴) 모바일 레이아웃 구현

### 기술 & 플랫폼
- [ ] Phaser.js 3.x + TypeScript 프로젝트 구성
- [ ] Vercel 또는 GitHub Pages에 배포, URL로 모바일 브라우저에서 접근 가능
- [ ] iOS Safari / Android Chrome에서 터치 동작 확인
- [ ] 효과음 5종 이상 동작 (첫 탭 이후)

---

## Assumptions Exposed & Resolved

| 가정 | 도전 | 해결 |
|------|------|------|
| 처음부터 Phaser.js로 코딩 | "왜 노코드 툴을 안 쓰나? 더 빠를 수 있지 않나?" | AI 코딩 도구(Claude Code)로 제작 → Phaser.js가 최적. 노코드 불필요. |
| GDD 전체 구현 | "MVP에 무엇이 반드시 필요한가?" | 핵심 루프만 멋지게 = 레벨 1→3 아크. "(추후 제공)" 항목은 모두 v2. |
| 서버 백엔드 필요 | "서버가 없으면 어떻게 저장?" | localStorage로 충분. 서버 동기화는 v2에서 선택적으로 추가. |
| 픽셀 아트 스타일 | "어떤 픽셀 아트 느낌?" | 32~64px 디테일한 픽셀 아트 (GBA 스타일보다 큰 스프라이트). |
| 전체 5레벨 MVP 포함 | "1회 세션에서 얼마나 진행해야 '재밌다'?" | 레벨 3(슈크림 해금)까지가 MVP 완성 아크. |
| 주간 이벤트 필요 | "7일 플레이 분량이 MVP에 필요한가?" | 불필요. 리텐션 메커니즘으로 v2에서 추가. |

---

## Technical Context

### 기술 스택 결정
- **게임 엔진:** Phaser.js 3.x — HTML5 Canvas 네이티브, 모바일 웹 최적화, 픽셀 아트 스케일링 지원
- **언어:** TypeScript — 타입 안전성, Claude Code와의 협업에 유리
- **앱 확장:** Capacitor.js — 웹 코드를 Android/iOS 네이티브 앱으로 래핑
- **배포:** Vercel (추천) 또는 GitHub Pages — 무료, 즉시 배포, HTTPS 기본 지원
- **저장:** localStorage API — 키: `bungeo_save_v1`, JSON 직렬화
- **오디오:** Phaser.js Web Audio API + 첫 탭 이후 자동 재생 unlock 처리

### 권장 프로젝트 구조
```
BPT/
├── src/
│   ├── scenes/          # Phaser 씬 (Boot, Game, DailySummary, Shop)
│   ├── objects/         # 게임 오브젝트 (BungeaMold, Customer, UI)
│   ├── systems/         # 로직 시스템 (Economy, Save, Audio)
│   └── assets/          # 스프라이트, 사운드
├── public/
│   └── index.html
├── package.json         # Phaser, TypeScript
└── vite.config.ts       # 빌드 도구 (Vite 권장)
```

### 모바일 웹 고려사항
- 세로 화면 고정 (portrait lock)
- 터치 이벤트 기반 인터랙션 (pointerdown/pointerup)
- 320~430px 폭 기준 레이아웃
- 오디오 자동 재생 제한: `Phaser.Sound.Events.UNLOCKED` 활용

---

## Ontology (Key Entities)

| 엔티티 | 타입 | 주요 속성 | 관계 |
|-------|------|----------|------|
| 붕어빵틀 | core domain | slotId, state(empty/baking/done), cookProgress, fillingType | 가게가 4~8개의 틀을 보유 |
| 손님 | core domain | type(일반/직장인/가족/VIP), patience, order[], reward | 손님이 가게에 방문, 붕어빵을 주문 |
| 재료 | supporting | type(밀가루/단팥/크림치즈/슈크림), stock | 붕어빵 제작에 소비, 골드로 구매 |
| 골드 | supporting | amount | 붕어빵 판매로 획득, 업그레이드·재료 구매에 사용 |
| 가게 | core domain | level(1~3 MVP), maxSlots, unlockedFillings[] | 골드로 레벨업, 레벨에 따라 틀 수·재료 해금 |
| 붕어빵 | core domain | filling, quality(PERFECT/GOOD/UNDER/BURNT), price | 틀에서 생산, 손님에게 판매 |
| 하루사이클 | supporting | dayNumber, timer(5min), phase | 하루가 끝나면 일일 정산 화면으로 전환 |
| 일일정산 | supporting | totalSold, revenue, wasted, unhappy, stars | 하루 종료 후 표시, 경험치·골드 확정 |
| 판정이펙트 | supporting | type(PERFECT/BURNT/heart/anger), duration | 굽기 판정 및 손님 반응 시 시각 피드백 |
| 애니메이션상태 | supporting | colorStage, expression, effectActive | 틀과 손님의 현재 시각 상태 |
| 저장데이터 | supporting | key(bungeo_save_v1), fields(gold, level, day, stock) | localStorage에 JSON 직렬화 |

---

## Ontology Convergence

| 라운드 | 엔티티 수 | 신규 | 변경 | 안정 | 안정 비율 |
|--------|----------|------|------|------|----------|
| 1 | 6 | 6 | - | - | N/A |
| 2 | 6 | 0 | 0 | 6 | N/A (초기값) |
| 3 | 8 | 2 | 0 | 6 | 75% |
| 4 | 8 | 0 | 1 | 7 | 88% |
| 5~6 | 8 | 0 | 0 | 8 | 100% |
| 7 | 9 | 1 | 0 | 8 | 89% |
| 8 | 11 | 2 | 0 | 9 | 82% |
| 9~13 | 11 | 0 | 0 | 11 | 100% ← 수렴 완료 |

---

## Interview Transcript

<details>
<summary>전체 Q&A (13 라운드)</summary>

### Round 0 (Topology)
**Q:** 이 토폴로지(코어 게임플레이 / 성장·경제 시스템 / 비주얼&UI / 기술 기반&플랫폼 4개)가 맞나요?
**A:** 맞아요, 이 4개로 진행해요

### Round 1 | 기술 기반 & 플랫폼 | Constraint Clarity
**Q:** 게임 엔진/프레임워크 선호?
**A:** 실제로 어떤 게임 엔진을 써야 할지 모르겠어요, 추천해주세요
**Ambiguity:** 62% (Goal: 0.55, Constraints: 0.35, Criteria: 0.20)

### Round 2 | 코어 게임플레이 | Success Criteria
**Q:** v1.0 MVP에 반드시 들어가야 하는 것은?
**A:** 핵심 루프만 멋지게 돌아가면 OK
**Ambiguity:** 61% (Goal: 0.58, Constraints: 0.34, Criteria: 0.20)

### Round 3 | 비주얼 & UI | Constraint Clarity
**Q:** 귀여운 픽셀 아트 — 어떤 느낌/스타일?
**A:** 32×32~64×64, 디테일한 픽셀 아트
**Ambiguity:** 57% (Goal: 0.60, Constraints: 0.41, Criteria: 0.21)

### Round 4 | 기술 기반 & 플랫폼 | Constraint Clarity [CONTRARIAN]
**Q:** 왜 굳이 Phaser.js로 시작부터 코딩해야 하나요? (노코드 도구 대안)
**A:** 빠르게 만드는 게 중요 → 노코드 툴 검토할게요
**Ambiguity:** 55% (Goal: 0.62, Constraints: 0.45, Criteria: 0.23)

### Round 5 | 기술 기반 & 플랫폼 | Constraint Clarity
**Q:** 개발자의 코딩 능력 / 이 게임을 누가 만드나요?
**A:** AI 코딩 도구 (Claude Code 등)로 함께 제작
**Ambiguity:** 50% (Goal: 0.65, Constraints: 0.52, Criteria: 0.25)

### Round 6 | 성장/경제 시스템 | Success Criteria [SIMPLIFIER]
**Q:** 플레이어가 첫 세션에서 어디까지 가면 '재밌다' 하고 다시 오고 싶을까?
**A:** 3레벨까지 + 슈크림 해금 경험
**Ambiguity:** 43% (Goal: 0.69, Constraints: 0.56, Criteria: 0.40)

### Round 7 | 코어 게임플레이 | Constraint Clarity
**Q:** 게임 진행도(골드, 레벨, 날짜)를 어떻게 저장할까요?
**A:** 우선 localStorage, 나중에 서버 추가
**Ambiguity:** 40% (Goal: 0.69, Constraints: 0.62, Criteria: 0.43)

### Round 8 | 비주얼 & UI | Success Criteria
**Q:** MVP에서 어떤 애니메이션이 없으면 '게임이 헝하다' 느낄 것 같아요?
**A:** 색상변화 + 손님 표정변화 + PERFECT 이펙트 + 하트/분노 이펙트 (4종 모두)
**Ambiguity:** 33% (Goal: 0.72, Constraints: 0.65, Criteria: 0.60)

### Round 9 | 코어 게임플레이 | Constraint Clarity
**Q:** MVP에서 오디오를 어떻게 할까요?
**A:** 슬라임 + 완성 효과음 + 손님 리액션 효과음 (5~10종)
**Ambiguity:** 31% (Goal: 0.73, Constraints: 0.69, Criteria: 0.63)

### Round 10 | 기술 기반 & 플랫폼 | Success Criteria
**Q:** MVP를 어디에 배포할 계획인가요?
**A:** GitHub Pages / Vercel (무료, 링크 공유)
**Ambiguity:** 28% (Goal: 0.75, Constraints: 0.70, Criteria: 0.71)

### Round 11 | 성장/경제 시스템 | Constraint Clarity
**Q:** 이 게임의 수익화 모델은?
**A:** 추후 광고를 통해 수익 창출
**Ambiguity:** 26% (Goal: 0.76, Constraints: 0.73, Criteria: 0.73)

### Round 12 | 코어 게임플레이 | Success Criteria
**Q:** MVP 손님 종류: 4종 모두 필요한가요?
**A:** 4종 모두 MVP에 있어야 함
**Ambiguity:** 24% (Goal: 0.78, Constraints: 0.75, Criteria: 0.755)

### Round 13 | 코어 게임플레이 | Success Criteria
**Q:** 주간 이벤트(7일마다 특별 이벤트)는 MVP에 포함인가요?
**A:** MVP 제외, v2에서 (미리 마추는 시스템 업그레이드까지만)
**Ambiguity:** 19% ✅ (Goal: 0.83, Constraints: 0.79, Criteria: 0.80)

</details>
