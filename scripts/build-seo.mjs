// 유형별 정적 페이지 24장을 찍는다.
//
// 카카오톡·X 같은 미리보기 크롤러는 자바스크립트를 실행하지 않고 해시(#)도 못 읽는다.
// 그래서 유형마다 og 메타가 박힌 실제 HTML 파일이 dist 안에 있어야 한다.
// 유형이 24개로 유한하니 빌드 때 전부 찍어두면 런타임 렌더링이 필요 없다.
//
// 방식은 carboxsize/scripts/build-seo.mjs 와 같다 — 빌드된 SPA 셸을 복사해
// 메타만 문자열 치환한다. 앱은 마운트되면서 경로를 보고 알아서 유형 화면을 그린다.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { workTypeNames, workTypePeople, workTypeReasons } from '../src/types.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ORIGIN = process.env.SITE_ORIGIN || 'https://fabl.m1k.app';

const shell = readFileSync(join(dist, 'index.html'), 'utf8');
const escapeAttr = (value) => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// content="..." 를 통째로 갈아끼운다. 속성 순서에 의존하지 않게 프로퍼티명으로 찾는다.
function setMeta(html, key, value) {
  const attr = key.startsWith('og:') || key.startsWith('article:') ? 'property' : 'name';
  const pattern = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  if (!pattern.test(html)) throw new Error(`메타 태그를 찾지 못함: ${key}`);
  return html.replace(pattern, `$1${escapeAttr(value)}$2`);
}
function setTitle(html, value) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(value)}</title>`);
}
function setCanonical(html, value) {
  return html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${escapeAttr(value)}$2`);
}

const codes = Object.keys(workTypeNames);
const urls = [`${ORIGIN}/`];

for (const code of codes) {
  const title = `${code} · ${workTypeNames[code]}형 — FABL 테스트`;
  const description = `${workTypePeople[code]} 아키타입. ${workTypeReasons[code]} 나의 일하는 순서도 확인해보세요.`;
  const url = `${ORIGIN}/t/${code}/`;

  let html = setTitle(shell, title);
  html = setCanonical(html, url);
  html = setMeta(html, 'description', description);
  html = setMeta(html, 'og:title', title);
  html = setMeta(html, 'og:description', description);
  html = setMeta(html, 'og:url', url);
  html = setMeta(html, 'og:image', `${ORIGIN}/og/${code}.png`);

  const dir = join(dist, 't', code);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  urls.push(url);
}

writeFileSync(join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')
  + `\n</urlset>\n`);

console.log(`유형 페이지 ${codes.length}장 + robots + sitemap 생성 → dist/t/`);
