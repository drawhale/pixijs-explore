import { AnimatedSprite, Container, type Texture } from "pixi.js";

/**
 * Player — 플레이어 엔티티.
 *
 * [Stage 1] Container 상속, 월드 좌표 이동
 * [Stage 2에서 바뀐 것]
 * - 몸통을 Graphics 원 → AnimatedSprite(걷기 스프라이트시트)로 교체
 * - anchor: 스프라이트의 기준점. 기본(0,0)은 좌상단이라, 0.5로 중심에 맞춰야
 *   Container 원점 = 캐릭터 중심이 된다(카메라가 중심을 화면 중앙에 놓도록).
 * - flip: 이동 방향에 따라 scale.x를 ±1로 뒤집어 좌우를 바라보게 한다.
 * - 정지하면 애니메이션을 멈추고(첫 프레임), 움직이면 재생.
 *
 * Container로 감싼 구조 덕분에 이동/카메라 코드(Stage 1)는 전혀 바뀌지 않았다.
 */
export class Player extends Container {
  readonly speed = 4;
  private readonly sprite: AnimatedSprite;

  constructor(walkFrames: Texture[]) {
    super();
    this.sprite = new AnimatedSprite(walkFrames);
    this.sprite.anchor.set(0.5); // 프레임 중심을 원점에 정렬
    this.sprite.animationSpeed = 0.18; // 프레임 진행 속도(tick당)
    this.sprite.play();
    this.addChild(this.sprite);
  }

  update(dir: { x: number; y: number }, delta: number): void {
    this.x += dir.x * this.speed * delta;
    this.y += dir.y * this.speed * delta;

    // 좌우 방향 전환: 오른쪽 이동이면 원본(+1), 왼쪽이면 수평 반전(-1).
    // anchor가 0.5라 중심을 축으로 깔끔하게 뒤집힌다.
    if (dir.x > 0) this.sprite.scale.x = 1;
    else if (dir.x < 0) this.sprite.scale.x = -1;

    // 움직일 때만 걷기 애니메이션 재생, 멈추면 첫 프레임에서 정지.
    const moving = dir.x !== 0 || dir.y !== 0;
    if (moving && !this.sprite.playing) this.sprite.play();
    else if (!moving && this.sprite.playing) this.sprite.gotoAndStop(0);
  }
}
