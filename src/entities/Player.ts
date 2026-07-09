import { Container, Graphics } from "pixi.js";

/**
 * Player — 플레이어 엔티티.
 *
 * [배우는 것]
 * - Container를 상속해 "화면 요소이자 로직을 가진 엔티티"로 만든다(PixiJS 관용구).
 * - 이 Container의 x/y는 부모(world) 기준 좌표 = 월드 좌표다.
 * - 지금은 몸통을 Graphics 원으로 그리지만, Stage 2에서 AnimatedSprite로 교체된다.
 *   (Container에 담아뒀기에 내부 표현만 바꾸면 되고 카메라/이동 코드는 안 건드린다.)
 */
export class Player extends Container {
  /** 초당 이동 속도가 아니라 "60fps 기준 한 프레임당" 월드 단위. delta로 보정한다. */
  readonly speed = 4;

  constructor() {
    super();
    const body = new Graphics().circle(0, 0, 20).fill(0x00e5ff);
    // 진행 방향 감각을 주는 작은 표식(위쪽). Stage 2에서 스프라이트가 대신한다.
    const nose = new Graphics().circle(0, -14, 5).fill(0x0a0a14);
    this.addChild(body, nose);
  }

  /**
   * 방향 벡터와 프레임 delta를 받아 월드 좌표를 갱신한다.
   * deltaTime을 곱하므로 프레임률과 무관하게 같은 속도로 움직인다.
   */
  update(dir: { x: number; y: number }, delta: number): void {
    this.x += dir.x * this.speed * delta;
    this.y += dir.y * this.speed * delta;
  }
}
