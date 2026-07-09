import { Application, Container, Graphics, type Ticker } from "pixi.js";

/**
 * Game — 애플리케이션의 코어.
 *
 * [Stage 0에서 배우는 개념]
 * - Application: 렌더러 + 캔버스 + 스테이지 + 티커를 묶은 최상위 객체
 * - Renderer: v8은 init 시점에 WebGPU를 시도하고 안 되면 WebGL로 폴백한다
 * - Scene Graph: 모든 화면 요소는 Container 트리에 addChild 되어야 그려진다
 * - Ticker: 매 프레임 콜백을 호출하는 게임 루프. delta 기반 이동이 핵심
 *
 * 이후 스테이지에서 world/hud 컨테이너 위에 플레이어·적·투사체·HUD가 쌓인다.
 */
export class Game {
  /** PixiJS 애플리케이션. init() 이후에만 유효하다. */
  readonly app = new Application();

  /**
   * world: 카메라가 움직이는 "게임 세계" 레이어.
   * 나중에 이 컨테이너 자체를 이동시켜 카메라를 구현한다(플레이어 반대 방향).
   */
  readonly world = new Container();

  /**
   * hud: 화면에 고정되는 UI 레이어(체력바, 점수 등).
   * world보다 나중에 addChild 되므로 항상 위에 그려진다.
   */
  readonly hud = new Container();

  // Stage 0 확인용 임시 오브젝트. Stage 1에서 진짜 플레이어로 교체된다.
  private probe = new Graphics().circle(0, 0, 24).fill(0x00e5ff);
  private elapsed = 0;

  /** 비동기 초기화. v8의 Application.init()은 Promise를 반환한다. */
  async init(mount: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: mount, // 컨테이너 크기에 맞춰 캔버스를 자동 리사이즈
      background: "#10101a",
      antialias: true,
      autoDensity: true, // CSS 픽셀과 디바이스 픽셀을 맞춘다(레티나 대응)
      resolution: window.devicePixelRatio || 1,
      preference: "webgpu", // WebGPU 우선, 미지원 시 자동으로 WebGL 폴백
    });

    // PixiJS가 만든 <canvas>를 DOM에 붙인다. v8은 app.view가 아니라 app.canvas.
    mount.appendChild(this.app.canvas);

    // 씬 그래프 구성: stage 아래에 world → hud 순서로 쌓는다.
    this.app.stage.addChild(this.world, this.hud);

    // 임시 프로브를 world 중앙에 배치.
    this.world.addChild(this.probe);
    this.centerProbe();

    // 게임 루프 시작. 화살표 함수로 this 바인딩 유지.
    this.app.ticker.add(this.update);

    console.info(
      `[Game] renderer=${this.app.renderer.type === 1 ? "WebGL" : "WebGPU"}`,
    );
  }

  /**
   * 매 프레임 호출. ticker.deltaTime은 "이상적 60fps 대비 프레임 비율"이다.
   * (60fps면 ≈1, 30fps면 ≈2). 이 값을 곱해야 프레임률과 무관하게 같은 속도로 움직인다.
   */
  private update = (ticker: Ticker): void => {
    this.elapsed += ticker.deltaTime;
    // 원을 좌우로 부드럽게 흔들어 루프가 도는 것을 눈으로 확인한다.
    this.probe.x = this.app.screen.width / 2 + Math.sin(this.elapsed * 0.05) * 120;
  };

  private centerProbe(): void {
    this.probe.x = this.app.screen.width / 2;
    this.probe.y = this.app.screen.height / 2;
  }
}
