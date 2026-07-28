import { Application, Container, Graphics, Text, type Ticker } from "pixi.js";
import { Keyboard } from "../input/Keyboard";
import { Player } from "../entities/Player";
import { Camera, type CameraMode } from "./Camera";
import { loadWalkFrames } from "../assets/character";
import { EnemyManager } from "./EnemyManager";

/**
 * Game — 애플리케이션의 코어.
 *
 * [Stage 0에서 배운 것] Application(async init), Ticker/deltaTime, Container 계층
 * [Stage 1에서 배우는 것]
 * - 월드 좌표 vs 스크린 좌표: 엔티티는 world 안 좌표를 갖고, 카메라가 그걸 화면으로 옮긴다
 * - 카메라 구현: 카메라 객체를 만드는 게 아니라 world 컨테이너를 플레이어 반대로 민다
 * - 키보드 입력을 매 프레임 "읽어" 이동에 반영(이벤트가 아니라 폴링)
 */
export class Game {
  readonly app = new Application();

  /** 카메라가 움직이는 게임 세계 레이어. 이 컨테이너 자체를 이동시켜 카메라를 만든다. */
  readonly world = new Container();

  /** 화면에 고정되는 UI 레이어(다음 스테이지에서 채운다). */
  readonly hud = new Container();

  // 적 전용 레이어(플레이어 아래에 그려지도록 world에 먼저 추가).
  private readonly enemyLayer = new Container();

  private readonly keyboard = new Keyboard();
  private readonly camera = new Camera(this.world);
  // 스프라이트 텍스처를 비동기로 로드한 뒤 생성하므로 init에서 할당한다.
  private player!: Player;
  private enemies!: EnemyManager;
  private elapsed = 0; // 누적 틱(난이도 램프용)

  // HUD 라벨(hud에 고정). Text는 Stage 4에서 제대로 다룬다 — 여기선 미리보기.
  private readonly label = new Text({
    style: { fill: 0xffffff, fontSize: 15, fontFamily: "monospace" },
  });
  private readonly stats = new Text({
    style: { fill: 0x9ad0ff, fontSize: 14, fontFamily: "monospace" },
  });

  async init(mount: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: mount,
      background: "#10101a",
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      preference: "webgpu",
    });

    mount.appendChild(this.app.canvas);
    this.app.stage.addChild(this.world, this.hud);

    // world에 정지된 배경 그리드를 깔아, 카메라(=world)가 움직이는 걸 눈으로 확인한다.
    // 그리드가 없으면 빈 배경이라 플레이어가 멈춰 있는 것처럼 보인다.
    this.world.addChild(this.makeGrid());

    // 그리기 순서: 그리드 → 적 레이어 → 플레이어 (플레이어가 적 위에 보이도록).
    this.world.addChild(this.enemyLayer);

    // 걷기 스프라이트시트를 비동기 로드한 뒤 플레이어/적 생성(Assets.load가 Promise라 await).
    const walkFrames = await loadWalkFrames();
    this.player = new Player(walkFrames);
    // 플레이어는 월드 원점(0,0)에서 시작. 카메라가 이를 화면 중앙에 놓는다.
    this.player.position.set(0, 0);
    this.world.addChild(this.player);

    // 적: 플레이어와 같은 프레임 텍스처를 재활용(tint로 색만 변경) → 배칭됨.
    this.enemies = new EnemyManager(this.enemyLayer, walkFrames);

    // HUD: 라벨을 화면 좌상단에 고정.
    this.label.position.set(12, 12);
    this.stats.position.set(12, 34);
    this.hud.addChild(this.label, this.stats);
    this.setModeLabel(this.camera.mode);

    // 카메라 모드 순환(C키). keydown은 OS 키반복으로 연속 발생하므로 e.repeat로 1회만.
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyC" && !e.repeat) {
        this.setModeLabel(this.camera.cycle());
      }
    });

    this.app.ticker.add(this.update);

    console.info(
      `[Game] renderer=${this.app.renderer.type === 1 ? "WebGL" : "WebGPU"} — WASD 이동, C 카메라모드`,
    );
  }

  private update = (ticker: Ticker): void => {
    const dir = this.keyboard.direction();
    this.elapsed += ticker.deltaTime;

    // 1) 입력을 읽어 플레이어의 월드 좌표를 갱신
    this.player.update(dir, ticker.deltaTime);

    // 2) 적: 스폰·추적·재활용
    this.enemies.update(
      this.player,
      this.app.screen.width,
      this.app.screen.height,
      ticker.deltaTime,
      this.elapsed,
    );

    // 3) 카메라가 world를 어떻게 움직일지 결정(모드에 따라 다름).
    this.camera.update(
      this.player,
      this.app.screen.width,
      this.app.screen.height,
      dir,
    );

    // 4) HUD 통계 갱신. allocated(총 생성)가 active와 비슷하게 유지되면 풀링이 잘 도는 것.
    this.stats.text = `적: ${this.enemies.activeCount}  (생성된 인스턴스: ${this.enemies.allocatedCount})  FPS: ${Math.round(this.app.ticker.FPS)}`;
  };

  private setModeLabel(mode: CameraMode): void {
    this.label.text = `카메라: ${mode}   [C로 전환]  이동: WASD`;
  }

  /** 월드 좌표계에 그린 정적 그리드. 카메라 이동의 기준점 역할. */
  private makeGrid(): Graphics {
    const g = new Graphics();
    const extent = 2000; // 원점 기준 ±2000
    const step = 80;
    for (let x = -extent; x <= extent; x += step) {
      g.moveTo(x, -extent).lineTo(x, extent);
    }
    for (let y = -extent; y <= extent; y += step) {
      g.moveTo(-extent, y).lineTo(extent, y);
    }
    g.stroke({ width: 1, color: 0x2a2a40 });
    // 원점(0,0)을 눈에 띄게 표시해 좌표 감각을 준다.
    g.circle(0, 0, 6).fill(0xff5a5a);
    return g;
  }
}
