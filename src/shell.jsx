import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, AppShellHeader, AppShellContent, TabBar, Tab, Section, Divider, Button, Watermark, watermarkTint } from '@m1kapp/kit';
import './landing.css';
import { workModes, workTypeNames, workTypePeople, workTypeReasons } from './types.js';
import { keyedItems, qualityDimensionNames } from './keyed.js';

const ACCENT = '#6047d8';

// 24유형을 '시작 모드' 4묶음으로 세운다. 원래 랜딩의 5열 매트릭스는 가로 스크롤로 넣어도
// 430px 셸 안에서 칸이 한 글자 폭으로 접혀서 못 읽는다(실측). 세로 목록으로 바꿨다.
function typeGroups() {
  return workModes.map(primary => {
    const items = [];
    workModes.forEach(secondary => {
      if (secondary.key === primary.key) return;
      workModes.forEach(third => {
        if (third.key === primary.key || third.key === secondary.key) return;
        items.push(`${primary.key}${secondary.key}${third.key}`);
      });
    });
    return { primary, items };
  });
}

function HomeTab({ on }) {
  return (
    <>
      <Section className="pt-6">
        <p className="kit-eyebrow">FRAME · AIM · BUILD · LINK</p>
        <h1 className="kit-h1">일이 떨어지면<br />나는 <em>뭐부터</em> 할까?</h1>
        <p className="kit-lead">
          상황부터 파악하는 사람, 뭐가 중요한지 먼저 정하는 사람, 일단 만들어보는 사람,
          관련된 사람부터 맞추는 사람. 성격이 아니라 <b>먼저 손대는 곳</b>이 다릅니다.
        </p>
        <figure className="kit-hero-shot">
          <img src="/landing/hero.jpg" alt="새 일감 앞에서 어느 길로 갈지 고르는 사람" />
        </figure>
        <div className="kit-actions">
          <Button full shape="pill" onClick={() => on.start('short')}>3분 만에 내 유형 찾기 →</Button>
          <Button full shape="pill" variant="light" onClick={on.goKeyed}>역량 체크 보기</Button>
        </div>
      </Section>

      <Divider />

      <Section>
        <p className="kit-eyebrow">FOUR WORK MODES</p>
        <h2 className="kit-h2">FABL — 일은 네 가지 힘으로 흘러갑니다.</h2>
        <p className="kit-body">
          일이 주어지면 사람마다 먼저 손대는 곳이 다릅니다. 그 네 갈래가 FABL 이고,
          자주 쓰는 세 가지를 <b>먼저 쓰는 차례대로</b> 이으면 내 유형이 됩니다.
        </p>
        <div className="kit-modes">
          {workModes.map((mode, index) => (
            <article className={`kit-mode mode-${mode.key.toLowerCase()}`} key={mode.key}>
              <img className="kit-mode-shot" src={`/landing/mode-${mode.en.toLowerCase()}.jpg`} alt="" loading="lazy" />
              <div><span>0{index + 1}</span><b>{mode.key}</b></div>
              <small>{mode.en} · {mode.ko}</small>
              <h3>{mode.question}</h3>
              <p>{mode.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      <Divider />

      <Section className="kit-home-tail">
        <p className="kit-eyebrow">24 WORKING TYPES</p>
        <h2 className="kit-h2">같은 강점도 먼저 쓰는 게 다르면 다른 유형입니다.</h2>
        <p className="kit-body">
          자주 쓰는 세 가지 힘을 <b>먼저 쓰는 차례대로</b> 이은 것이 유형 코드입니다.
          시작 모드가 같아도 그다음 순서가 다르면 다른 유형입니다.
        </p>
        {typeGroups().map(({ primary, items }) => (
          <div className="kit-type-group" key={primary.key}>
            <h3><b>{primary.key}</b>로 시작하는 유형 <span>{primary.en} · {primary.ko}</span></h3>
            {items.map(code => (
              <article className="kit-type" key={code}>
                <img src={`/people/${code}.jpg`} alt={`${workTypePeople[code]} 초상`} loading="lazy" />
                <div>
                  <b className="kit-type-code">{[...code].map((letter, index) => (
                    <em className={`rank-${index + 1}`} key={index}>{letter}</em>
                  ))}</b>
                  <strong>{workTypeNames[code]}형</strong>
                  <small>{workTypePeople[code]}</small>
                  <p>{workTypeReasons[code]}</p>
                </div>
              </article>
            ))}
          </div>
        ))}
        <p className="kit-people-note">
          인물은 공개된 업적과 행동에서 연상한 아키타입 예시이며, 실제 성격이나 역량을
          진단한 결과가 아닙니다.
        </p>
      </Section>
    </>
  );
}

function TypeTab({ archiveCount, on }) {
  return (
    <Section className="pt-6 pb-8">
      <p className="kit-eyebrow">평가 1 · 유형 찾기</p>
      <h1 className="kit-h2 kit-tab-title">나는 뭐부터 하는 사람일까</h1>
      <p className="kit-body">
        일이 생긴 상황 12개에서 <b>내가 제일 먼저 할 것</b>을 고르면 돼요.
        자주 고른 세 가지를 순서대로 이으면 24유형 중 하나가 나와요.
        시간이 있으면 상황 20개에 역량 체크까지 이어서 하는 긴 코스도 있어요.
      </p>
      <ul className="kit-facts">
        <li><b>12문항</b><span>2~3분이면 끝나요</span></li>
        <li><b>정답 없음</b><span>넷 다 할 수 있는 행동이에요</span></li>
        <li><b>결과</b><span>내 유형 · 닮은 인물 · 역량 그래프</span></li>
      </ul>
      <div className="kit-actions">
        <Button full shape="pill" onClick={() => on.start('short')}>짧은 코스 시작 →</Button>
        <Button full shape="pill" variant="light" onClick={() => on.start('full')}>유형 + 역량 다 하기 · 약 15분</Button>
        {archiveCount > 0 && (
          <Button full shape="pill" variant="light" onClick={on.latest}>최근 결과 보기 {archiveCount}</Button>
        )}
        <Button full shape="pill" variant="light" onClick={on.importResult}>결과 파일 불러오기</Button>
      </div>
      <p className="kit-note">
        유형은 잘하고 못하고를 보지 않아요. 내 답 안에서 어느 쪽을 더 자주 쓰는지만
        봅니다. 실력이 궁금하면 역량 체크를 해보세요.
      </p>
    </Section>
  );
}

function KeyedTab({ on }) {
  const dims = [...new Set(keyedItems.map(item => item.dimension))];
  return (
    <Section className="pt-6 pb-8">
      <p className="kit-eyebrow">평가 2 · 역량 체크</p>
      <h1 className="kit-h2 kit-tab-title">일머리를 맞혀 볼까요</h1>
      <p className="kit-body">
        유형 찾기와 달리 <b>정답이 있는</b> {keyedItems.length}문항이에요. 정답으로 매기니까
        사람끼리 비교가 되는 점수가 나와요. 다섯 가지 영역을 네 문항씩 봅니다.
      </p>
      <ul className="kit-facts">
        <li><b>{keyedItems.length}문항</b><span>5~6분이면 끝나요</span></li>
        <li><b>정답 있음</b><span>틀리면 더 맞는 답과 이유를 보여줘요</span></li>
        <li><b>결과</b><span>맞은 개수 · 영역별 점수</span></li>
      </ul>
      <div className="kit-dims">
        {dims.map(key => <span key={key}>{qualityDimensionNames[key]}</span>)}
      </div>
      <div className="kit-actions">
        <Button full shape="pill" onClick={on.startKeyed}>역량 체크 시작 →</Button>
      </div>
      <p className="kit-note">
        {keyedItems.length}문항짜리 짧은 확인이에요. 점수가 낮다고 능력이 부족한 건 아니고,
        채용이나 인사평가의 근거로 쓰지 마세요.
      </p>
    </Section>
  );
}

// 문항·결과 화면은 여전히 바닐라가 innerHTML 로 그린다. 그 출력이 들어갈 자리를
// 셸 안에 고정된 노드 하나로 두고, React 는 이 노드를 붙였다 뗐다 할 뿐 내용은 건드리지 않는다.
const hostNode = document.createElement('div');
hostNode.className = 'screen-host';

function ScreenSlot() {
  return <div ref={el => { if (el && el.firstChild !== hostNode) el.appendChild(hostNode); }} />;
}

// 랜딩과 진행 화면이 같은 @m1kapp/kit 앱셸을 공유한다.
// 탭은 홈 + 평가 두 개(유형 · 판단)로, 두 평가가 다른 것을 잰다는 게 첫 화면에서 보이게 한다.
function Shell({ mode, archiveCount, initialTab, on }) {
  const [tab, setTab] = useState(initialTab || 'home');
  const handlers = { ...on, goKeyed: () => setTab('keyed') };
  const landing = mode === 'landing';
  return (
    <Watermark color={watermarkTint(ACCENT)} text="fabl">
      <AppShell accent={ACCENT}>
        {landing && (
          <AppShellHeader>
            <b className="kit-brand">FABL TEST</b>
            <span className="kit-navlink">24 TYPES</span>
          </AppShellHeader>
        )}
        <AppShellContent key={landing ? tab : 'screen'}>
          {!landing && <ScreenSlot />}
          {landing && tab === 'home' && <HomeTab on={handlers} />}
          {landing && tab === 'type' && <TypeTab archiveCount={archiveCount} on={handlers} />}
          {landing && tab === 'keyed' && <KeyedTab on={handlers} />}
        </AppShellContent>
        {/* 홈은 길다. 스크롤 어디에서든 시작 버튼이 손에 닿게 탭바 위에 띄운다. */}
        {landing && tab === 'home' && (
          <div className="kit-sticky-cta">
            <Button full shape="pill" onClick={() => on.start('short')}>3분 만에 내 유형 찾기 →</Button>
          </div>
        )}
        {landing && (
          <TabBar>
            <Tab active={tab === 'home'} onClick={() => setTab('home')} icon={<span className="kit-tab-icon">🏠</span>} label="홈" activeColor={ACCENT} />
            <Tab active={tab === 'type'} onClick={() => setTab('type')} icon={<span className="kit-tab-icon">🧭</span>} label="유형 찾기" activeColor={ACCENT} />
            <Tab active={tab === 'keyed'} onClick={() => setTab('keyed')} icon={<span className="kit-tab-icon">✅</span>} label="역량 체크" activeColor={ACCENT} />
          </TabBar>
        )}
      </AppShell>
    </Watermark>
  );
}

let root = null;

export function mountShell(container, props) {
  if (!root) { container.innerHTML = ''; root = createRoot(container); }
  root.render(<Shell {...props} />);
}

/** 바닐라 화면이 innerHTML 을 쓰는 대상. 셸 안에 있고 재렌더에도 같은 노드다. */
export function screenHost() {
  return hostNode;
}

/** 셸 콘텐츠의 스크롤 컨테이너. 문항을 넘길 때 최상단으로 되돌린다. */
export function shellScroller() {
  return document.querySelector('.app-shell-root .tab-scroll');
}
