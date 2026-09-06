import { defineConfig } from 'vite';

// 공개판은 순수 정적이다. 서버 라우트도, 외부 API 호출도 없다.
// 원본(iljaller-test)에 있던 /api/evaluate 개발 미들웨어는 옮기지 않았다.
// OpenAI 키를 다루던 코드였고, 익명 사용자가 몰리는 공개 사이트에서는
// 비용을 통제할 방법이 없다. 심층 대화 채점은 브라우저 로컬 규칙으로만 한다.
// 랜딩만 React(@m1kapp/kit 앱셸)라서 .jsx 를 자동 런타임으로 변환한다.
// @vitejs/plugin-react 는 vite 7 을 peer 로 받지 않아 esbuild 기본 변환만 쓴다
// (dev fast refresh 없음, 랜딩은 상태가 거의 없어 문제되지 않는다).
export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  build: { target: 'es2020' }
});
