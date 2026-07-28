import { Assets, Rectangle, Texture } from "pixi.js";

/**
 * 캐릭터 걷기 스프라이트시트를 "코드로" 생성하고 프레임 텍스처로 잘라주는 모듈.
 *
 * [배우는 것]
 * - Texture vs Sprite: Texture = GPU에 올라간 픽셀 데이터. Sprite = 그 Texture를 화면에 놓는 인스턴스.
 * - 스프라이트시트: 여러 프레임을 "한 장"에 모은 것. 텍스처 1개만 GPU에 올리므로 배칭에 유리(Stage 3).
 * - Assets API: 이미지 로딩은 비동기다. 실제 파일이면 Assets.load('hero.png').
 *   여기선 런타임 캔버스를 data URL로 만들어 "똑같은 비동기 파이프라인"을 태운다.
 * - 프레임 슬라이스: 한 Texture의 source를 공유하며 frame(Rectangle)만 다르게 준다 → 부분 텍스처.
 */

export const FRAME_W = 48;
export const FRAME_H = 48;
export const FRAME_COUNT = 6;

/** 걷기 사이클 6프레임을 가로로 이어 그린 캔버스를 만든다. */
function drawWalkCycleCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W * FRAME_COUNT;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d 컨텍스트를 얻지 못했습니다.");

  for (let i = 0; i < FRAME_COUNT; i++) {
    drawFrame(ctx, i * FRAME_W, i / FRAME_COUNT);
  }
  return canvas;
}

/**
 * 한 프레임(작은 생명체)을 그린다. t=0..1은 걷기 사이클 위상. 기본적으로 오른쪽을 본다.
 *
 * 중요: 몸통을 "흰색"으로 그린다 → tint로 어떤 색이든 입힐 수 있다(흰색×tint=tint).
 * 시안으로 그렸다면 빨간 tint를 곱해도 어두워지기만 한다. 어두운 외곽선/눈은 tint를 곱해도
 * 어둡게 유지되어 형태를 잡아준다.
 */
function drawFrame(ctx: CanvasRenderingContext2D, ox: number, t: number): void {
  const cx = ox + FRAME_W / 2;
  const groundY = FRAME_H - 8;
  const swing = Math.sin(t * Math.PI * 2) * 6; // 다리 앞뒤 흔들림
  const bob = Math.abs(Math.cos(t * Math.PI * 2)) * 2; // 위아래 반동

  // 다리 두 개(반대 위상으로 흔들림) — 밝은 회색이라 tint가 색을 입힌다.
  ctx.strokeStyle = "#c8d0dc";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  const hipY = groundY - 14 - bob;
  ctx.beginPath();
  ctx.moveTo(cx - 4, hipY);
  ctx.lineTo(cx - 4 - swing, groundY);
  ctx.moveTo(cx + 4, hipY);
  ctx.lineTo(cx + 4 + swing, groundY);
  ctx.stroke();

  // 몸통 — 흰색(tint로 색 결정). 외곽선은 어둡게(형태 유지).
  const bodyY = groundY - 20 - bob;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#1a1a24";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, bodyY, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 눈(오른쪽 = 정면 방향) — 어두워서 tint와 무관하게 눈으로 보인다.
  ctx.fillStyle = "#1a1a24";
  ctx.beginPath();
  ctx.arc(cx + 5, bodyY - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 걷기 프레임 텍스처 배열을 비동기로 만든다.
 * Assets.load가 Promise를 반환하므로 await 필요 — 실제 파일 로딩과 동일한 흐름.
 */
export async function loadWalkFrames(): Promise<Texture[]> {
  const canvas = drawWalkCycleCanvas();

  // 실제 프로젝트: await Assets.load('assets/hero.png')
  // 여기선 캔버스를 PNG data URL로 변환해 같은 로더를 태운다.
  const sheet: Texture = await Assets.load(canvas.toDataURL());

  // 한 장(sheet)의 source를 공유하며, frame(사각형)만 다르게 해서 프레임별 텍스처를 만든다.
  const frames: Texture[] = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    frames.push(
      new Texture({
        source: sheet.source,
        frame: new Rectangle(i * FRAME_W, 0, FRAME_W, FRAME_H),
      }),
    );
  }
  return frames;
}
