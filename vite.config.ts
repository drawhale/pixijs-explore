import { defineConfig } from "vite";

// 학습용 최소 설정. Vite는 TS를 그대로 서빙하고 HMR을 제공한다.
export default defineConfig({
  server: { open: true },
  // main.ts가 top-level await를 쓰고, WebGPU 대상은 모던 브라우저이므로 esnext.
  build: { target: "esnext" },
});
