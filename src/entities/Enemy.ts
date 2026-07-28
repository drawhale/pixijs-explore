import { AnimatedSprite, type Texture } from "pixi.js";

/**
 * Enemy — 플레이어를 추적하는 적.
 *
 * [배우는 것]
 * - 텍스처 재활용 + tint: 플레이어와 "똑같은 프레임 텍스처"를 쓰고 색만 tint로 바꾼다.
 *   같은 source를 공유하므로 draw call이 배칭된다(수백 마리도 가벼운 이유).
 * - AnimatedSprite를 직접 상속: 적은 Container로 감쌀 필요가 없어 더 가볍다(Stage 7 성능과 연결).
 * - reset(): 풀에서 꺼내 재사용할 때 상태를 초기화한다(오브젝트 풀링의 핵심).
 */
export class Enemy extends AnimatedSprite {
  speed = 1.3;

  constructor(frames: Texture[]) {
    super(frames);
    this.anchor.set(0.5);
    this.tint = 0xff5a5a; // 같은 텍스처, 색만 빨갛게
    this.animationSpeed = 0.15;
  }

  /** 풀에서 재사용할 때 호출: 위치와 애니메이션 위상을 새로 설정. */
  reset(x: number, y: number): void {
    this.position.set(x, y);
    this.visible = true;
    // 개체마다 걷기 위상을 흩뿌려 군집이 로봇처럼 동기화돼 보이지 않게.
    this.gotoAndPlay(Math.floor(Math.random() * this.totalFrames));
  }

  /** 매 프레임 플레이어 쪽으로 이동. */
  chase(target: { x: number; y: number }, delta: number): void {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy) || 1; // 0 나눗셈 방지
    this.x += (dx / dist) * this.speed * delta;
    this.y += (dy / dist) * this.speed * delta;
    // 플레이어를 바라보게 좌우 반전(프레임 기본은 오른쪽 보기).
    this.scale.x = dx < 0 ? -1 : 1;
  }
}
