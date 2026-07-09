import { Application, Container, Graphics, type Ticker } from "pixi.js";
import { Keyboard } from "../input/Keyboard";
import { Player } from "../entities/Player";

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

  private readonly keyboard = new Keyboard();
  private readonly player = new Player();

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

    // 플레이어는 월드 원점(0,0)에서 시작. 카메라가 이를 화면 중앙에 놓는다.
    this.player.position.set(0, 0);
    this.world.addChild(this.player);

    this.app.ticker.add(this.update);

    console.info(
      `[Game] renderer=${this.app.renderer.type === 1 ? "WebGL" : "WebGPU"} — WASD/화살표로 이동`,
    );
  }

  private update = (ticker: Ticker): void => {
    // 1) 입력을 읽어 플레이어의 월드 좌표를 갱신
    this.player.update(this.keyboard.direction(), ticker.deltaTime);

    // 2) 카메라: world를 플레이어의 반대 방향으로 밀어 플레이어를 화면 중앙에 고정.
    //    world.x = (화면중앙) - (플레이어 월드 x)
    //    → 플레이어가 오른쪽으로 갈수록 world는 왼쪽으로 밀려 배경이 스크롤된다.
    this.world.x = this.app.screen.width / 2 - this.player.x;
    this.world.y = this.app.screen.height / 2 - this.player.y;
  };

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
