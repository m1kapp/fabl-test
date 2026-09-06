import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, AppShellHeader, AppShellContent, TabBar, Tab, Section, Divider, Button, Watermark, watermarkTint } from '@m1kapp/kit';
import './landing.css';
import { workModes, workTypeNames, workTypePeople, workTypeReasons } from './types.js';
import { keyedItems, qualityDimensionNames } from './keyed.js';

const ACCENT = '#6047d8';

// 24유형을 '시작 모드' 4묶음으로 세운다. 원래 랜딩의 5열 매트릭스는 가로 스크롤로 넣어도
// 430px 셸 안에서 칸이 한 글자 폭으로 접혀서 못 읽는다(실측). 세로 목록으로 바꿨다.
// 잘난 유형은 없다. 대신 내가 마지막에 쓰는 힘을 먼저 쓰는 사람이 짝으로 잘 맞는다.
// 코드 XYZ 에 빠진 모드 W 를 앞에 세우고 순서를 뒤집어 W-Z-Y 를 짝으로 본다.
function complementCode(code) {
  const missing = workModes.map(mode => mode.key).find(key => !code.includes(key));
  return `${missing}${code[2]}${code[1]}`;
}

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

function HomeTab({ on, ctaRef }) {
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
        {/* 두 코스를 나란히 둔다. 세로로 쌓으면 위가 기본, 아래는 덤처럼 읽힌다. */}
        <div className="kit-picker" ref={ctaRef}>
          <button className="kit-pick" onClick={() => on.start('short')}>
            <b>3분</b>
            <span>유형만</span>
            <p>내가 뭐부터 하는 사람인지</p>
            <i>시작 →</i>
          </button>
          <button className="kit-pick" onClick={() => on.start('full')}>
            <b>15분</b>
            <span>유형 + 역량</span>
            <p>정답 있는 문제로 실제 실력까지</p>
            <i>시작 →</i>
          </button>
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
        <div className="kit-callout">
          <b>더 좋은 유형은 없어요.</b>
          <p>
            네 가지 힘은 순서만 다르지 우열이 아니에요. 대신 <b>잘 맞는 조합</b>은 있어요.
            내가 마지막에 쓰는 힘을 먼저 쓰는 사람이 내 빈칸을 메웁니다. 아래 각 유형에
            그 짝을 적어 뒀어요.
          </p>
        </div>
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
                  <p className="kit-type-pair">
                    짝 · <b>{complementCode(code)}</b> {workTypeNames[complementCode(code)]}형
                  </p>
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

function TestTab({ archiveCount, on }) {
  const dims = [...new Set(keyedItems.map(item => item.dimension))];
  return (
    <Section className="pt-6 pb-8">
      <p className="kit-eyebrow">테스트</p>
      <h1 className="kit-h2 kit-tab-title">두 가지를 봅니다</h1>
      <p className="kit-body">
        하나는 <b>무엇부터 하는 사람인지</b>(유형), 다른 하나는 <b>판단이 맞는지</b>(역량)예요.
        유형은 정답이 없고, 역량은 정답이 있어요.
      </p>

      <div className="kit-course">
        <div className="kit-course-head"><b>짧게</b><span>3분</span></div>
        <p>상황 12개에서 내가 제일 먼저 할 것을 고르면 24유형 중 하나가 나와요.</p>
        <ul className="kit-facts">
          <li><b>12문항</b><span>정답 없음 · 넷 다 할 수 있는 행동</span></li>
          <li><b>결과</b><span>내 유형 · 닮은 인물 · 역량 그래프</span></li>
        </ul>
        <Button full shape="pill" onClick={() => on.start('short')}>유형 찾기 시작 →</Button>
      </div>

      <div className="kit-course">
        <div className="kit-course-head"><b>길게</b><span>15분</span></div>
        <p>
          상황 20개로 유형을 보고, 이어서 정답이 있는 {keyedItems.length}문항으로 판단이
          맞는지까지 봐요. 문항이 많아 시간이 걸려요.
        </p>
        <ul className="kit-facts">
          <li><b>상황 20개</b><span>고르기 · 이유 쓰기까지</span></li>
          <li><b>역량 {keyedItems.length}문항</b><span>정답 있음 · 틀리면 이유를 보여줘요</span></li>
        </ul>
        <div className="kit-dims">
          {dims.map(key => <span key={key}>{qualityDimensionNames[key]}</span>)}
        </div>
        <Button full shape="pill" onClick={() => on.start('full')}>유형 + 역량 시작 →</Button>
      </div>

      <div className="kit-actions">
        <Button full shape="pill" variant="light" onClick={on.startKeyed}>역량 {keyedItems.length}문항만 하기</Button>
        {archiveCount > 0 && (
          <Button full shape="pill" variant="light" onClick={on.latest}>최근 결과 보기 {archiveCount}</Button>
        )}
        <Button full shape="pill" variant="light" onClick={on.importResult}>결과 파일 불러오기</Button>
      </div>

      <p className="kit-note">
        유형 점수는 내 답 안에서의 상대적 선호라 사람끼리 비교되지 않아요. 역량 점수는
        정답으로 매기지만 {keyedItems.length}문항짜리 짧은 확인이고, 채용이나 인사평가의
        근거로 쓰지 마세요. 왜 그런지는 <b>근거</b> 탭에 적어 뒀어요.
      </p>
    </Section>
  );
}

// 근거 탭. 이 테스트가 무엇에 기대고 무엇을 못 하는지 출처와 함께 적는다.
// 링크는 걸지 않는다 — 확인 못 한 URL 을 붙이는 것보다 서지사항이 정확하다.
const EVIDENCE = [
  {
    claim: '유형 점수로는 사람끼리 비교할 수 없다',
    body: '본인의 답 안에서 비중을 나눠 매기는 방식(ipsative)은 합이 구조적으로 고정돼, 두 사람의 점수를 나란히 놓고 누가 높은지 말할 수 없다. 이 테스트의 유형 점수가 정확히 그 방식이다.',
    who: 'Hicks, L. E. (1970)',
    title: 'Some properties of ipsative, normative, and forced-choice normative measures',
    where: 'Psychological Bulletin, 74(3)'
  },
  {
    claim: '유형 라벨은 사람을 가르는 근거가 못 된다',
    body: '대표적인 유형 검사(MBTI)에 대해, 유형 분류의 재검사 일치도와 예측력이 채용·배치 결정을 뒷받침할 만큼은 아니라는 검토가 있다. 유형은 대화의 출발점이지 판정문이 아니다.',
    who: 'Pittenger, D. J. (2005)',
    title: 'Cautionary comments regarding the Myers-Briggs Type Indicator',
    where: 'Consulting Psychology Journal, 57(3)'
  },
  {
    claim: '상황을 주고 대응을 고르게 하는 문항은 실제 성과와 상관이 있다',
    body: '역량 체크가 쓰는 형식(상황판단검사, SJT)은 여러 연구를 모아 보면 업무 성과와 유의한 상관을 보인다. 다만 상관이 있다는 것과 개인을 선별할 만큼 정확하다는 것은 다른 말이다.',
    who: 'McDaniel, M. A., Morgeson, F. P., Finnegan, E. B., Campion, M. A., & Braverman, E. P. (2001)',
    title: 'Use of situational judgment tests to predict job performance: A clarification of the literature',
    where: 'Journal of Applied Psychology, 86(4)'
  },
  {
    claim: '선발 도구의 예측력은 과거에 알려진 것보다 낮게 잡아야 한다',
    body: '오랫동안 인용돼 온 선발 방법별 타당도 추정치가 범위 제한 보정 등을 다시 따지면서 하향 조정됐다. 짧은 온라인 검사 하나로 사람을 거르는 판단은 이 보정 이후 더 조심스러워졌다.',
    who: 'Sackett, P. R., Zhang, C., Berry, C. M., & Lievens, F. (2022)',
    title: 'Revisiting meta-analytic estimates of validity in personnel selection',
    where: 'Journal of Applied Psychology, 107(11)'
  },
  {
    claim: '문항이 적으면 점수가 흔들린다',
    body: '같은 성질의 문항을 늘릴수록 검사의 신뢰도가 올라간다는 관계는 100년 전에 공식으로 정리됐다. 역량 체크는 20문항이라, 맞은 개수의 차이가 실력 차인지 운인지 가르기에는 아직 짧다.',
    who: 'Spearman, C. (1910) · Brown, W. (1910)',
    title: 'Spearman–Brown 예측 공식 — 검사 길이와 신뢰도의 관계',
    where: 'British Journal of Psychology, 3(3)'
  }
];

const LIMITS = [
  '문항별 난이도·변별도를 응답 데이터로 검증한 적이 없다. 이 사이트는 답변을 서버로 보내지 않아 그런 데이터가 쌓이지 않는다.',
  '"이 점수가 높은 사람이 실제로 일을 잘하더라"를 확인한 준거 타당도 연구가 없다.',
  '공개 웹이라 재응시가 자유롭고 문항이 고정이다. 두 번째부터는 기억이 섞인다.',
  '24유형의 인물은 공개된 업적에서 연상한 예시이고, 성격이나 역량을 진단한 결과가 아니다.'
];

function EvidenceTab() {
  return (
    <Section className="pt-6 pb-8">
      <p className="kit-eyebrow">근거</p>
      <h1 className="kit-h2 kit-tab-title">무엇에 기대고, 무엇을 못 하나</h1>
      <p className="kit-body">
        이 테스트가 기대는 연구와, 이 테스트가 아직 못 하는 것을 같이 적어 둡니다.
        재미로 보는 결과와 사람을 판단하는 도구는 다릅니다.
      </p>

      {EVIDENCE.map(item => (
        <article className="kit-evidence" key={item.claim}>
          <h3>{item.claim}</h3>
          <p>{item.body}</p>
          <cite>
            <b>{item.who}</b> {item.title}. <b>{item.where}</b>.
          </cite>
        </article>
      ))}

      <h2 className="kit-h2 kit-evidence-title">이 테스트의 한계</h2>
      <ul className="kit-limits">
        {LIMITS.map(text => <li key={text}>{text}</li>)}
      </ul>

      <p className="kit-note">
        위 연구들은 검사 방식 일반에 대한 것이고, 이 사이트의 문항을 검증한 연구가 아닙니다.
        결과는 참고용이며 채용·인사평가의 근거로 쓰지 마세요.
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
  const handlers = { ...on, goKeyed: () => setTab('test') };
  const landing = mode === 'landing';
  const heroCtaRef = useRef(null);
  const [ctaOffscreen, setCtaOffscreen] = useState(false);

  // 히어로의 시작 버튼이 화면 밖으로 나갔을 때만 떠 있는 버튼을 띄운다.
  // 둘이 동시에 보이면 같은 버튼이 두 개 있는 화면이 된다.
  useEffect(() => {
    if (!landing || tab !== 'home') { setCtaOffscreen(false); return; }
    const target = heroCtaRef.current;
    const root = document.querySelector('.app-shell-root .tab-scroll');
    if (!target || !root) return;
    const observer = new IntersectionObserver(([entry]) => setCtaOffscreen(!entry.isIntersecting), { root, threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [landing, tab]);
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
          {landing && tab === 'home' && <HomeTab on={handlers} ctaRef={heroCtaRef} />}
          {landing && tab === 'test' && <TestTab archiveCount={archiveCount} on={handlers} />}
          {landing && tab === 'evidence' && <EvidenceTab />}
        </AppShellContent>
        {/* 홈은 길다. 스크롤 어디에서든 시작 버튼이 손에 닿게 탭바 위에 띄운다. */}
        {landing && tab === 'home' && ctaOffscreen && (
          <div className="kit-sticky-cta">
            <Button full shape="pill" onClick={() => on.start('short')}>3분 만에 내 유형 찾기 →</Button>
          </div>
        )}
        {landing && (
          <TabBar>
            <Tab active={tab === 'home'} onClick={() => setTab('home')} icon={<span className="kit-tab-icon">🏠</span>} label="홈" activeColor={ACCENT} />
            <Tab active={tab === 'test'} onClick={() => setTab('test')} icon={<span className="kit-tab-icon">📝</span>} label="테스트" activeColor={ACCENT} />
            <Tab active={tab === 'evidence'} onClick={() => setTab('evidence')} icon={<span className="kit-tab-icon">📚</span>} label="근거" activeColor={ACCENT} />
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
