import { Container, Texture } from "pixi.js";
import { Particle } from "../entities/Particle";

/** 흰 점 텍스처를 한 번만 생성(방사형 그라디언트라 부드러운 입자가 된다). */
function makeDotTexture(): Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d 컨텍스트 실패");
  const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(8, 8, 8, 0, Math.PI * 2);
  ctx.fill();
  return Texture.from(c);
}

/**
 * ParticleManager — 입자 버스트를 풀링으로 관리.
 * 모든 입자가 같은 텍스처를 tint해서 쓰므로 draw call이 배칭된다.
 */
export class ParticleManager {
  private readonly active: Particle[] = [];
  private readonly pool: Particle[] = [];
  private readonly tex = makeDotTexture();

  constructor(private readonly layer: Container) {}

  get activeCount(): number {
    return this.active.length;
  }

  /** (x,y)에서 사방으로 입자 count개를 터뜨린다. */
  burst(x: number, y: number, color: number, count = 12): void {
    for (let i = 0; i < count; i++) {
      const p = this.pool.pop() ?? this.create();
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      p.reset(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 18 + Math.random() * 14, color);
      this.active.push(p);
    }
  }

  private create(): Particle {
    const p = new Particle(this.tex);
    this.layer.addChild(p);
    return p;
  }

  update(delta: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vx *= 0.9; // 마찰로 점점 느려짐
      p.vy *= 0.9;
      p.life -= delta;
      const t = Math.max(0, p.life / p.maxLife);
      p.alpha = t; // 서서히 투명
      p.scale.set(0.3 + t * 0.9); // 점점 작아짐
      if (p.life <= 0) {
        p.visible = false;
        this.active.splice(i, 1);
        this.pool.push(p);
      }
    }
  }
}
