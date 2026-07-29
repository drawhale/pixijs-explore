import { Graphics } from "pixi.js";

/**
 * Projectile — 플레이어가 발사하는 탄환.
 *
 * [배우는 것]
 * - Graphics로 그린 간단한 탄환을 풀링해서 재사용(투사체도 적처럼 많이 생겼다 사라진다).
 * - 속도 벡터(vx, vy)를 미리 계산해 저장 → 매 프레임 등속 직진.
 * - life(수명): 일정 프레임 뒤 자동 소멸(화면 밖으로 무한히 날아가지 않도록).
 */
export class Projectile extends Graphics {
  vx = 0;
  vy = 0;
  life = 0;

  constructor() {
    super();
    // 탄환 모양을 한 번만 그려두고 위치만 옮겨 재사용.
    this.circle(0, 0, 5).fill(0xfff2a8).stroke({ width: 1.5, color: 0xffb700 });
  }

  /** 풀에서 꺼내 재사용: 위치·속도·수명 초기화. */
  reset(x: number, y: number, vx: number, vy: number, life: number): void {
    this.position.set(x, y);
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.visible = true;
  }
}
