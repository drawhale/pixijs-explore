import { Container, Text } from "pixi.js";

/** 한 팝업의 상태. Text는 무겁게 생성되므로 재사용한다. */
interface Popup {
  text: Text;
  life: number;
  maxLife: number;
}

/**
 * DamageNumbers — 적이 맞은 자리에 데미지 숫자를 띄우고, 위로 떠오르며 사라지게 한다.
 *
 * [배우는 것]
 * - Text는 내부적으로 글자를 텍스처로 렌더하므로 생성 비용이 크다 → 풀링이 특히 중요.
 * - alpha와 위치를 매 프레임 갱신해 "떠오르며 페이드아웃" 연출.
 */
export class DamageNumbers {
  private readonly active: Popup[] = [];
  private readonly pool: Text[] = [];

  constructor(private readonly layer: Container) {}

  spawn(x: number, y: number, value: number): void {
    const text = this.pool.pop() ?? this.create();
    text.text = String(Math.round(value));
    text.position.set(x, y);
    text.alpha = 1;
    text.visible = true;
    this.active.push({ text, life: 40, maxLife: 40 });
  }

  private create(): Text {
    const t = new Text({
      style: { fill: 0xfff2a8, fontSize: 16, fontFamily: "monospace", fontWeight: "bold" },
    });
    t.anchor.set(0.5);
    this.layer.addChild(t);
    return t;
  }

  update(delta: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= delta;
      p.text.y -= 1.2 * delta; // 위로 떠오름
      p.text.alpha = Math.max(0, p.life / p.maxLife); // 서서히 사라짐
      if (p.life <= 0) {
        p.text.visible = false;
        this.active.splice(i, 1);
        this.pool.push(p.text); // 파괴하지 않고 풀로
      }
    }
  }
}
