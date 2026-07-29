import { Sprite, type Texture } from "pixi.js";

/**
 * Particle — 사망 이펙트 등에 쓰는 작은 입자.
 *
 * [배우는 것]
 * - 파티클도 결국 Sprite다. 공유 텍스처(흰 점) 하나를 tint해서 쓰면 배칭된다.
 * - 속도·수명·마찰로 "퍼졌다 사라지는" 움직임을 만든다.
 * - 대량 생성/소멸이므로 당연히 풀링(Stage 7에서 ParticleContainer로 더 최적화).
 */
export class Particle extends Sprite {
  vx = 0;
  vy = 0;
  life = 0;
  maxLife = 1;

  constructor(texture: Texture) {
    super(texture);
    this.anchor.set(0.5);
  }

  reset(x: number, y: number, vx: number, vy: number, life: number, color: number): void {
    this.position.set(x, y);
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.tint = color;
    this.alpha = 1;
    this.scale.set(1);
    this.visible = true;
  }
}
