# PixiJS Explore — 탑다운 생존 게임으로 PixiJS 깊게 배우기

> 목적: **하나의 게임을 점진적으로 키우며 PixiJS(v8)의 렌더 파이프라인 전체를 손으로 만져보기.**
> 밸파이어 서바이버 스타일 — 화면에 수백~수천 마리가 쏟아지므로, 튜토리얼로는 절대 안 만나는
> "성능"이라는 벽까지 자연스럽게 밀어붙여진다. 그 벽을 넘는 과정에서 렌더러의 내부를 이해하게 된다.

## 왜 이 컨셉인가

PixiJS는 결국 **2D WebGL/WebGPU 렌더러**다. 깊게 이해한다는 건 아래를 *직접 겪는다*는 뜻:
씬 그래프 · 텍스처/배칭 · 게임 루프 · 인터랙션 · 벡터 그래픽스 · 필터/셰이더 · **그리고 성능**.
기능 데모를 나열하는 대신, 하나의 게임이 커지며 이 모든 걸 필요에 의해 끌어당기게 설계했다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 타입체크 + 프로덕션 빌드
```

## 학습 로드맵 (스테이지 단위로 성장)

각 스테이지는 하나의 마일스톤이다. **이전 스테이지 위에 얹어** PixiJS 표면적을 넓힌다.

| Stage | 무엇을 만드나 | 배우는 PixiJS 개념 |
|:---:|---|---|
| **0** ✅ | 부트스트랩: 캔버스·게임 루프·레이어 뼈대 | `Application`(async init), Renderer(WebGPU→WebGL 폴백), `Ticker`/deltaTime, `Container` 계층, `resizeTo`, `autoDensity` |
| **1** | 플레이어 이동 + 카메라 | transform, 로컬/월드 좌표, world 컨테이너를 역이동시키는 카메라, 키보드 입력 |
| **2** | 스프라이트 & 걷기 애니메이션 | `Assets` 로더, 스프라이트시트, `Texture`, `Sprite`/`AnimatedSprite`, anchor, flip |
| **3** | 적 스폰 + 추적(대량) | 오브젝트 풀링, 수백 개 스프라이트, 배칭이 왜 중요한지 첫 체감 |
| **4** | 자동 공격 · 투사체 · 충돌 · 데미지 숫자 | 원-원 충돌, `Text`/`BitmapText`, 풀링 심화, z-정렬 |
| **5** | 파티클 · 히트 이펙트 · 화면 흔들림 | 파티클, `Filter`(ColorMatrix 등), blend mode, `RenderTexture` |
| **6** | HUD · 체력/경험치 바 · 레벨업 화면 | `Graphics` 벡터 드로잉, HUD 레이어 고정, 마스크 |
| **7** | 성능 최적화 (수천 마리) | 컬링, `ParticleContainer`, 텍스처 아틀라스 배칭, 프로파일링, WebGL vs WebGPU 비교 — **렌더러 이해의 정점** |
| **8** (선택) | 커스텀 셰이더 배경/필터 | GLSL/WGSL, 커스텀 `Filter`/`Shader`, uniform |

## 구조

```
src/
  main.ts            # 엔트리: #app에 Game을 마운트
  engine/
    Game.ts          # 코어: Application + world/hud 레이어 + 게임 루프
```

의도적으로 미리 다 만들지 않았다. **필요해질 때 파일을 추가**하며 각 개념이 왜 등장하는지 맥락과 함께 배운다.

## 조작

- **이동**: WASD 또는 화살표 키 (대각선 이동은 속도 정규화됨)
- **카메라 모드 전환**: `C` — instant → smooth → lookahead → fixed 순환 (좌상단 라벨에 현재 모드 표시)

## 진행 상황

- [x] Stage 0 — 부트스트랩
- [x] Stage 1 — 플레이어 이동 & 카메라 (world 역이동 방식)
- [ ] Stage 2 — 스프라이트 & 애니메이션
