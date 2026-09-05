// 유형별 공유 카드(1200x630) 24장을 만든다.
//
// 정적 호스팅에서 링크마다 다른 미리보기를 띄우려면 유형 수만큼 실제 PNG 파일이 있어야 한다.
// 유형이 24개로 유한하니 빌드 때 전부 찍어두면 런타임 이미지 생성기가 필요 없다.
//
// Satori 대신 SVG 문자열을 직접 만들고 @resvg/resvg-js 로 래스터화한다.
// 폰트는 scripts/fonts 에 동봉한다 — 폰트를 못 찾으면 에러 없이 글자만 조용히 사라진다.
// (리눅스는 파일명 대소문자를 구분한다.)

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { workTypeNames, workTypePeople, workTypeReasons } from '../src/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const fontDir = join(here, 'fonts');
const outDir = join(root, 'public', 'og');

const W = 1200, H = 630;
const BG = '#12101a', FG = '#ffffff', ACCENT = '#8b7cf0', MUTED = '#a9a3c2';

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// 한글은 글자폭이 거의 일정해서 글자수 기준 줄바꿈이면 충분하다.
function wrap(text, perLine) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if ([...candidate].length > perLine && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

function card(code) {
  const portraitPath = join(root, 'public', 'people', `${code}.jpg`);
  const portrait = existsSync(portraitPath)
    ? `data:image/jpeg;base64,${readFileSync(portraitPath).toString('base64')}`
    : null;

  const reasonLines = wrap(workTypeReasons[code], 26).slice(0, 3);
  const letters = [...code].map((letter, i) => `
    <text x="${86 + i * 92}" y="336" font-family="Pretendard" font-weight="700"
          font-size="112" fill="${i === 0 ? ACCENT : FG}">${letter}</text>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#12101a"/><stop offset="1" stop-color="#2c1f4a"/>
    </linearGradient>
    <clipPath id="pc"><rect x="792" y="96" width="322" height="438" rx="24"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="86" y="120" font-family="Pretendard" font-weight="700" font-size="26"
        fill="${ACCENT}" letter-spacing="6">PEBBLE TEST</text>
  <text x="86" y="196" font-family="Pretendard" font-weight="400" font-size="30"
        fill="${MUTED}">나의 일하는 순서는</text>
  ${letters}
  <text x="86" y="410" font-family="Pretendard" font-weight="700" font-size="58"
        fill="${FG}">${escapeXml(workTypeNames[code])}형</text>
  <text x="86" y="470" font-family="Pretendard" font-weight="700" font-size="34"
        fill="${ACCENT}">${escapeXml(workTypePeople[code])} 아키타입</text>
  ${reasonLines.map((line, i) => `
  <text x="86" y="${524 + i * 34}" font-family="Pretendard" font-weight="400" font-size="25"
        fill="${MUTED}">${escapeXml(line)}</text>`).join('')}
  ${portrait ? `<image href="${portrait}" x="792" y="96" width="322" height="438"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#pc)"/>` : ''}
  <rect x="792" y="96" width="322" height="438" rx="24" fill="none"
        stroke="${ACCENT}" stroke-opacity="0.45" stroke-width="2"/>
</svg>`;
}

mkdirSync(outDir, { recursive: true });
const codes = Object.keys(workTypeNames);
let written = 0;

for (const code of codes) {
  const png = new Resvg(card(code), {
    fitTo: { mode: 'width', value: W },
    font: { fontDirs: [fontDir], defaultFontFamily: 'Pretendard', loadSystemFonts: false }
  }).render().asPng();
  writeFileSync(join(outDir, `${code}.png`), png);
  written += 1;
}

// 유형이 아직 없는 진입 페이지용 기본 카드
const intro = card('FAB')
  .replace(/>나의 일하는 순서는</, '>일을 잘한다는 말을 12개 상황으로<')
  .replace(/>분석추진형</, '>당신은 어떤 순서로 일할까?<');
writeFileSync(join(outDir, 'default.png'), new Resvg(intro, {
  fitTo: { mode: 'width', value: W },
  font: { fontDirs: [fontDir], defaultFontFamily: 'Pretendard', loadSystemFonts: false }
}).render().asPng());

console.log(`OG 카드 ${written}장 + 기본 1장 생성 → public/og/`);
