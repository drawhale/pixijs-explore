import {
  Application,
  ColorMatrixFilter,
  Container,
  Graphics,
  Text,
  type Ticker,
} from "pixi.js";
import { Keyboard } from "../input/Keyboard";
import { Player } from "../entities/Player";
import { Camera, type CameraMode } from "./Camera";
import { loadWalkFrames } from "../assets/character";
import { EnemyManager } from "./EnemyManager";
import { ProjectileManager } from "./ProjectileManager";
import { DamageNumbers } from "./DamageNumbers";
import { ParticleManager } from "./ParticleManager";

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

  // world 내부 레이어(그리기 순서: 아래 → 위).
  private readonly enemyLayer = new Container();
  private readonly projectileLayer = new Container();
  private readonly particleLayer = new Container();
  private readonly fxLayer = new Container(); // 데미지 숫자 등 최상단 이펙트

  private readonly keyboard = new Keyboard();
  private readonly camera = new Camera(this.world);
  // 스프라이트 텍스처를 비동기로 로드한 뒤 생성하므로 init에서 할당한다.
  private player!: Player;
  private enemies!: EnemyManager;
  private projectiles!: ProjectileManager;
  private damageNumbers!: DamageNumbers;
  private particles!: ParticleManager;
  private elapsed = 0; // 누적 틱(난이도 램프용)

  // 피격 시 전체 화면 붉은 플래시용 필터. 안 쓸 땐 world.filters에서 빼서 렌더 패스 비용을 없앤다.
  private readonly hurtFilter = new ColorMatrixFilter();
  private hurtFlash = 0; // 플래시 강도 1→0
  private hurtFilterAttached = false; // world.filters에 붙어있는지(기본 filters는 null이라 플래그로 추적)
  private prevHp = 0; // 직전 프레임 HP(감소 감지용)

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

    // 그리기 순서: 그리드 → 적 → 투사체 → 파티클 → 플레이어 → 이펙트(데미지 숫자).
    this.world.addChild(this.enemyLayer, this.projectileLayer, this.particleLayer);

    // 걷기 스프라이트시트를 비동기 로드한 뒤 플레이어/적 생성(Assets.load가 Promise라 await).
    const walkFrames = await loadWalkFrames();
    this.player = new Player(walkFrames);
    this.prevHp = this.player.hp;
    // 플레이어는 월드 원점(0,0)에서 시작. 카메라가 이를 화면 중앙에 놓는다.
    this.player.position.set(0, 0);
    this.world.addChild(this.player, this.fxLayer);

    // 적: 플레이어와 같은 프레임 텍스처를 재활용(tint로 색만 변경) → 배칭됨.
    this.enemies = new EnemyManager(this.enemyLayer, walkFrames);
    this.particles = new ParticleManager(this.particleLayer);
    // 데미지 숫자(Text 풀링) → 투사체가 적을 맞히면 이 콜백으로 팝업.
    this.damageNumbers = new DamageNumbers(this.fxLayer);
    this.projectiles = new ProjectileManager(
      this.projectileLayer,
      this.enemies,
      (x, y, dmg) => this.damageNumbers.spawn(x, y, dmg),
      (x, y) => {
        // 적 사망: 파티클 버스트 + 짧은 화면 흔들림
        this.particles.burst(x, y, 0xff6a6a, 12);
        this.camera.shake(4, 8);
      },
    );

    // 붉은 플래시 색상(곱셈 tint)을 필터에 한 번만 설정. 강도는 alpha로 조절.
    this.hurtFilter.tint(0xff2020, false);

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

    // 2) 적: 스폰·추적·플레이어 접촉 피해
    this.enemies.update(
      this.player,
      this.app.screen.width,
      this.app.screen.height,
      ticker.deltaTime,
      this.elapsed,
    );

    // 3) 투사체: 자동 발사·이동·충돌(명중=데미지숫자, 처치=파티클/흔들림 콜백)
    this.projectiles.update(this.player, ticker.deltaTime);

    // 4) 파티클 + 데미지 숫자 갱신
    this.particles.update(ticker.deltaTime);
    this.damageNumbers.update(ticker.deltaTime);

    // 5) HP가 줄었으면 붉은 플래시 + 화면 흔들림 발동
    if (this.player.hp < this.prevHp) {
      this.hurtFlash = 1;
      this.camera.shake(14, 14);
    }
    this.prevHp = this.player.hp;
    this.updateHurtFlash(ticker.deltaTime);

    // 6) 카메라가 world를 어떻게 움직일지 결정(모드 + 흔들림).
    this.camera.update(
      this.player,
      this.app.screen.width,
      this.app.screen.height,
      dir,
      ticker.deltaTime,
    );

    // 7) HUD 갱신
    this.stats.text =
      `HP: ${Math.max(0, Math.round(this.player.hp))}/${this.player.maxHp}   ` +
      `킬: ${this.enemies.killCount}   적: ${this.enemies.activeCount}   ` +
      `탄: ${this.projectiles.activeCount}   FPS: ${Math.round(this.app.ticker.FPS)}`;
  };

  /**
   * 붉은 피격 플래시. 필터는 렌더 패스를 추가하므로, 플래시 중에만 world.filters에 붙이고
   * 끝나면 빈 배열로 되돌려 비용을 없앤다(필터 사용의 핵심 습관).
   */
  private updateHurtFlash(delta: number): void {
    if (this.hurtFlash <= 0) return;
    if (!this.hurtFilterAttached) {
      this.world.filters = [this.hurtFilter];
      this.hurtFilterAttached = true;
    }
    this.hurtFilter.alpha = this.hurtFlash * 0.6; // 0~0.6 강도로 붉게 블렌드
    this.hurtFlash -= delta * 0.08;
    if (this.hurtFlash <= 0) {
      this.hurtFlash = 0;
      this.world.filters = []; // 필터 제거 → 추가 렌더 패스 사라짐
      this.hurtFilterAttached = false;
    }
  }

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
