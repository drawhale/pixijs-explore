import type { Container } from "pixi.js";

/**
 * Camera — world 컨테이너를 어떻게 움직여 "무엇을 화면에 비출지" 결정한다.
 *
 * [배우는 것]
 * 플레이어 위치(월드 좌표)와 카메라는 완전히 별개다. 플레이어는 그대로 두고
 * 이 클래스만 바꾸면 연출이 달라진다 — 그게 둘을 분리한 이유다.
 *
 * 모드별 차이:
 * - instant  : 매 프레임 즉시 중앙 정렬. 딱딱하지만 정확(우리 Stage 1 기본).
 * - smooth   : 목표로 서서히 보간(lerp). 카메라가 살짝 지연되며 부드럽게 따라온다.
 * - lookahead: 진행 방향을 미리 보여주려 카메라를 그쪽으로 당긴다(+smooth).
 * - fixed    : 카메라 고정. world를 안 움직이므로 플레이어가 화면 위를 돌아다닌다.
 */
export type CameraMode = "instant" | "smooth" | "lookahead" | "fixed";

export const CAMERA_MODES: CameraMode[] = [
  "instant",
  "smooth",
  "lookahead",
  "fixed",
];

export class Camera {
  mode: CameraMode = "instant";

  /** smooth/lookahead 보간 계수(0~1). 클수록 빠르게 따라붙는다. */
  smoothing = 0.08;
  /** lookahead에서 진행 방향으로 당기는 거리(월드 단위). */
  lookAhead = 140;

  constructor(private readonly world: Container) {}

  /**
   * 매 프레임 호출. target=플레이어 월드 좌표, dir=현재 이동 방향.
   * "world.x가 (중앙 - target.x)이면 target이 화면 정중앙에 온다"가 모든 계산의 뿌리.
   */
  update(
    target: { x: number; y: number },
    screenW: number,
    screenH: number,
    dir: { x: number; y: number },
  ): void {
    const cx = screenW / 2;
    const cy = screenH / 2;

    if (this.mode === "fixed") {
      // 카메라를 "지금 위치 그대로" 정지시킨다(world를 안 건드림).
      // 플레이어는 계속 움직이므로 고정된 화면 밖으로 서서히 걸어나간다 → 의도된 데모.
      return;
    }

    let goalX = cx - target.x;
    let goalY = cy - target.y;

    if (this.mode === "lookahead") {
      goalX -= dir.x * this.lookAhead;
      goalY -= dir.y * this.lookAhead;
    }

    if (this.mode === "instant") {
      this.world.position.set(goalX, goalY);
    } else {
      // 지수 보간(lerp): 현재값을 목표값 쪽으로 매 프레임 일정 비율씩 당긴다.
      // (학습용 단순화 — 엄밀히는 프레임률 보정이 필요하지만 감을 잡기엔 충분)
      this.world.x += (goalX - this.world.x) * this.smoothing;
      this.world.y += (goalY - this.world.y) * this.smoothing;
    }
  }

  /** 다음 모드로 순환하고 새 모드를 반환. */
  cycle(): CameraMode {
    const i = CAMERA_MODES.indexOf(this.mode);
    this.mode = CAMERA_MODES[(i + 1) % CAMERA_MODES.length];
    return this.mode;
  }
}
