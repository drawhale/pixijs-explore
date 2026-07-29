import type { Container } from "pixi.js";
import { Projectile } from "../entities/Projectile";
import type { EnemyManager } from "./EnemyManager";

const PROJECTILE_SPEED = 7;
const PROJECTILE_LIFE = 70; // 수명(프레임)
const DAMAGE = 25;
const HIT_RADIUS = 16; // 투사체-적 충돌 반경

/**
 * ProjectileManager — 자동 조준 발사 + 투사체 이동 + 적과의 충돌 처리.
 *
 * [배우는 것]
 * - 자동 조준: 가장 가까운 적을 향해 속도 벡터를 만들어 발사.
 * - 투사체 풀링(적/데미지숫자와 동일 패턴).
 * - 원-원 충돌: 매 프레임 각 투사체가 적과 겹치는지 제곱거리로 검사.
 * - 명중 시: 적 HP 감소 → 죽으면 EnemyManager.kill, 그리고 데미지 숫자 콜백 호출.
 */
export class ProjectileManager {
  private readonly active: Projectile[] = [];
  private readonly pool: Projectile[] = [];
  private fireCooldown = 0;
  /** 발사 간격(프레임). 레벨업으로 줄어든다(=발사 빨라짐). */
  fireInterval = 16;

  constructor(
    private readonly layer: Container,
    private readonly enemies: EnemyManager,
    /** 명중 지점에 데미지 숫자를 띄우는 콜백. */
    private readonly onHit: (x: number, y: number, damage: number) => void,
    /** 적이 죽은 지점에서 이펙트(파티클·흔들림)를 내는 콜백. */
    private readonly onKill: (x: number, y: number) => void,
  ) {}

  get activeCount(): number {
    return this.active.length;
  }

  update(player: { x: number; y: number }, delta: number): void {
    this.fireCooldown -= delta;
    if (this.fireCooldown <= 0) {
      const target = this.enemies.nearest(player.x, player.y);
      if (target) {
        this.fireCooldown = this.fireInterval;
        this.fire(player, target);
      }
    }

    // 이동 + 수명 + 충돌
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life -= delta;

      const hit = this.enemies.hitTest(p.x, p.y, HIT_RADIUS);
      if (hit) {
        const dead = hit.takeDamage(DAMAGE);
        this.onHit(hit.x, hit.y, DAMAGE);
        if (dead) {
          this.onKill(hit.x, hit.y); // kill 전에 위치를 읽어 이펙트
          this.enemies.kill(hit);
        }
        this.despawn(i);
      } else if (p.life <= 0) {
        this.despawn(i);
      }
    }
  }

  private fire(from: { x: number; y: number }, target: { x: number; y: number }): void {
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const dist = Math.hypot(dx, dy) || 1;
    const vx = (dx / dist) * PROJECTILE_SPEED;
    const vy = (dy / dist) * PROJECTILE_SPEED;
    const p = this.pool.pop() ?? this.create();
    p.reset(from.x, from.y, vx, vy, PROJECTILE_LIFE);
    this.active.push(p);
  }

  private create(): Projectile {
    const p = new Projectile();
    this.layer.addChild(p);
    return p;
  }

  private despawn(index: number): void {
    const p = this.active[index];
    p.visible = false;
    this.active.splice(index, 1);
    this.pool.push(p);
  }
}
