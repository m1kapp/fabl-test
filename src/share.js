// 공유. 원본에는 결과가 메모리와 localStorage 에만 남아 링크로 보낼 수가 없었다.
//
// @m1kapp/kit 의 ShareButton 과 같은 동작이지만 그쪽은 React 라 그대로 못 쓴다.
// 동작만 옮겼다 — navigator.share 가 있으면 그것, 없거나 취소되면 클립보드 복사.

import { workTypeNames, workTypePeople } from './types.js';

// 공유 링크는 크롤러가 읽을 수 있는 경로여야 한다.
// 해시(#)는 미리보기 크롤러가 못 보기 때문에 유형마다 실제 경로를 쓴다.
export function typeUrl(code, answers, scenarioSet) {
  const url = new URL(`/t/${code}/`, location.origin);
  if (Array.isArray(answers) && answers.length) url.searchParams.set('a', answers.join(''));
  // 매번 다른 12문항이 출제되므로 어떤 문항이었는지도 같이 실어야 레이더가 복원된다.
  if (Array.isArray(scenarioSet) && scenarioSet.length) {
    url.searchParams.set('s', scenarioSet.map(index => index.toString(36)).join(''));
  }
  return url.toString();
}

export function shareText(code) {
  return `나의 일하는 순서는 ${code} · ${workTypeNames[code]}형 (${workTypePeople[code]} 아키타입)`;
}

// 경로에서 유형 코드를 읽는다. /t/FAB/ → 'FAB'
export function codeFromPath() {
  const match = location.pathname.match(/^\/t\/([FABL]{3})\/?$/i);
  if (!match) return null;
  const code = match[1].toUpperCase();
  return workTypeNames[code] ? code : null;
}

export function scenarioSetFromQuery() {
  const raw = new URLSearchParams(location.search).get('s');
  if (!raw || !/^[0-9a-z]+$/.test(raw)) return null;
  return [...raw].map(character => parseInt(character, 36));
}

export function answersFromQuery() {
  const raw = new URLSearchParams(location.search).get('a');
  if (!raw || !/^\d+$/.test(raw)) return null;
  return [...raw].map(Number);
}

async function copy(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // clipboard 는 안전하지 않은 컨텍스트(http)와 일부 인앱 브라우저에서 막힌다.
    const field = document.createElement('textarea');
    field.value = url;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(field);
    field.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    field.remove();
    return ok;
  }
}

/** 공유하고, 링크가 클립보드로 갔으면 true 를 돌려준다(버튼 문구 전환용). */
export async function share(code, answers, scenarioSet) {
  const url = typeUrl(code, answers, scenarioSet);
  const text = shareText(code);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'FABL 테스트', text, url });
      return false;
    } catch (error) {
      // 사용자가 공유 시트를 닫은 경우까지 복사로 넘기지는 않는다.
      if (error && error.name === 'AbortError') return false;
    }
  }
  return copy(url);
}
