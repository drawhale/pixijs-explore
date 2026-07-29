import { Container, Graphics } from "pixi.js";

/**
 * Bar — Graphics로 그린 둥근 진행 바(체력/경험치 등).
 *
 * [배우는 것: Graphics + 마스크]
 * - Graphics 벡터 드로잉: roundRect / rect / fill / stroke.
 * - 마스크: fill(채움)을 둥근 사각형 모양으로 잘라낸다. mask도 화면 트리에 addChild 해야 동작.
 * - 갱신 방법 두 가지 중 "scale" 채택:
 *     (a) 매 프레임 clear() 후 새 width로 다시 그리기 → 매번 도형을 재생성(테셀레이션) 비용
 *     (b) 미리 그린 fill의 scale.x만 바꾸기 → GPU에서 스케일만, 훨씬 쌈  ← 이걸 사용
 *   fill은 x=0에서 시작하는 사각형이라 scale.x=ratio면 오른쪽부터 줄어든다.
 */
export class Bar extends Container {
  private readonly fill: Graphics;

  constructor(width: number, height: number, color: number, bg = 0x222634) {
    super();
    const radius = height / 2;

    // 배경 트랙
    const track = new Graphics().roundRect(0, 0, width, height, radius).fill(bg);

    // 채움: 전체 너비의 사각형(나중에 scale.x로 비율 조절)
    this.fill = new Graphics().rect(0, 0, width, height).fill(color);

    // 마스크: 둥근 사각형. fill을 이 모양으로 잘라 둥근 모서리를 얻는다.
    const mask = new Graphics().roundRect(0, 0, width, height, radius).fill(0xffffff);
    this.fill.mask = mask;

    // 테두리
    const border = new Graphics()
      .roundRect(0, 0, width, height, radius)
      .stroke({ width: 1.5, color: 0x000000, alpha: 0.4 });

    this.addChild(track, this.fill, mask, border);
  }

  /** 0~1 비율로 채움 갱신. scale만 바꾸므로 매 프레임 호출해도 저렴. */
  setRatio(ratio: number): void {
    this.fill.scale.x = Math.max(0, Math.min(1, ratio));
  }
}
