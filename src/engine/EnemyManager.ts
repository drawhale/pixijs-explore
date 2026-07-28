import type { Container, Texture } from "pixi.js";
import { Enemy } from "../entities/Enemy";

/** 접촉으로 간주하는 거리의 제곱(제곱근 계산을 피하려고 제곱끼리 비교). */
const CONTACT_SQ = 22 * 22;
/** 이 스테이지의 동시 적 상한(Stage 7에서 수천까지 밀어붙인다). */
const MAX_ENEMIES = 350;

/**
 * EnemyManager — 적의 스폰·추적·재활용을 담당.
 *
 * [배우는 것: 오브젝트 풀링]
 * 적이 접촉으로 사라질 때 delete/new 하지 않고 pool 배열에 넣어둔다.
 * 다시 스폰할 땐 pool에서 꺼내 reset()으로 재사용 → GC 부담과 객체 생성 비용을 없앤다.
 * 비활성 적은 removeChild 하지 않고 visible=false로만 두고 active 배열에서 빼서,
 * 씬 그래프 변경 비용도 피한다(활성 것만 순회).
 */
export class EnemyManager {
  private readonly active: Enemy[] = [];
  private readonly pool: Enemy[] = [];
  private spawnCooldown = 0;

  constructor(
    private readonly layer: Container,
    private readonly frames: Texture[],
  ) {}

  get activeCount(): number {
    return this.active.length;
  }
  /** 지금까지 생성된 총 인스턴스 수(활성 + 풀). 풀링이 이 값을 낮게 유지한다. */
  get allocatedCount(): number {
    return this.active.length + this.pool.length;
  }

  update(
    player: { x: number; y: number },
    screenW: number,
    screenH: number,
    delta: number,
    elapsed: number,
  ): void {
    // 난이도 램프: 시간이 지날수록 목표 동시 적 수 증가.
    const target = Math.min(MAX_ENEMIES, 40 + Math.floor(elapsed / 30));

    // 스폰: 쿨다운마다, 목표에 못 미치면 화면 밖 링에 하나 생성.
    this.spawnCooldown -= delta;
    if (this.spawnCooldown <= 0 && this.active.length < target) {
      this.spawnCooldown = 2;
      this.spawn(player, screenW, screenH);
    }

    // 추적 + 접촉 시 despawn(뒤에서부터 순회해 splice 안전).
    for (let i = this.active.length - 1; i >= 0; i--) {
      const e = this.active[i];
      e.chase(player, delta);
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy < CONTACT_SQ) {
        // Stage 4에서 이 자리가 "플레이어 피격/적 사망"으로 바뀐다. 지금은 접촉=재활용.
        this.despawn(i);
      }
    }
  }

  private spawn(player: { x: number; y: number }, w: number, h: number): void {
    const e = this.pool.pop() ?? this.create();
    // 화면 대각선 절반보다 살짝 바깥 = 항상 시야 밖에서 등장.
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.hypot(w, h) / 2 + 40;
    e.reset(
      player.x + Math.cos(angle) * radius,
      player.y + Math.sin(angle) * radius,
    );
    this.active.push(e);
  }

  /** 새 인스턴스는 이때 딱 한 번만 만들어 layer에 붙인다. 이후로는 재활용된다. */
  private create(): Enemy {
    const e = new Enemy(this.frames);
    this.layer.addChild(e);
    return e;
  }

  private despawn(index: number): void {
    const e = this.active[index];
    e.visible = false;
    e.stop();
    this.active.splice(index, 1);
    this.pool.push(e); // 파괴하지 않고 풀로 반환
  }
}
