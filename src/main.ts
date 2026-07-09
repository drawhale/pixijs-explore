import { Game } from "./engine/Game";

// 엔트리 포인트. #app 엘리먼트에 게임을 마운트한다.
const mount = document.getElementById("app");
if (!mount) throw new Error("#app 엘리먼트를 찾을 수 없습니다.");

const game = new Game();
await game.init(mount);

// 개발 중 콘솔에서 살펴볼 수 있도록 노출(학습용).
(globalThis as unknown as { game: Game }).game = game;
