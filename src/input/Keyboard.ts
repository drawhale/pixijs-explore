/**
 * Keyboard — 눌려 있는 키를 추적하는 최소 입력 헬퍼.
 *
 * [배우는 것]
 * PixiJS는 "게임 입력"을 직접 제공하지 않는다(마우스/터치용 Federated Events는 Stage 4에서).
 * 키보드는 그냥 브라우저의 keydown/keyup을 우리가 관리한다.
 *
 * 이벤트로 "지금 이 순간" 이동시키지 않고, 눌린 키를 Set에 담아두는 게 핵심.
 * 실제 이동은 매 프레임 update에서 이 상태를 "읽어서" 처리한다(입력과 로직의 분리).
 */
export class Keyboard {
  private pressed = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (e) => this.pressed.add(e.code));
    window.addEventListener("keyup", (e) => this.pressed.delete(e.code));
  }

  isDown(code: string): boolean {
    return this.pressed.has(code);
  }

  /**
   * WASD/화살표를 정규화된 방향 벡터로 변환. 각 축 -1..1.
   * 대각선일 때 정규화하지 않으면 √2배 빨라지므로 보정한다.
   */
  direction(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.isDown("KeyA") || this.isDown("ArrowLeft")) x -= 1;
    if (this.isDown("KeyD") || this.isDown("ArrowRight")) x += 1;
    if (this.isDown("KeyW") || this.isDown("ArrowUp")) y -= 1;
    if (this.isDown("KeyS") || this.isDown("ArrowDown")) y += 1;

    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2; // ≈0.707
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }
}
