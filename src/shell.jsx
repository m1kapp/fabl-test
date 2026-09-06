import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, AppShellHeader, AppShellContent, TabBar, Tab, Section, Divider, Button, Watermark, watermarkTint } from '@m1kapp/kit';
import './landing.css';
import { workModes, workTypeNames, workTypePeople, workTypeReasons } from './types.js';
import { keyedItems, qualityDimensionNames, KEYED_QUESTION_COUNT } from './keyed.js';

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

      <Section className="pb-2">
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

      <Divider />

      <Section>
        <p className="kit-eyebrow">MBTI 로 치면</p>
        <h2 className="kit-h2">겹칠 법한 성향은 이쪽</h2>
        <p className="kit-body">
          <b>맞춰 본 적은 없습니다.</b> 두 검사를 같이 받은 사람들의 답을 대조한 자료가
          없어서, 24유형을 16유형에 대응시키는 표는 만들지 않았어요. 아래는 네 가지 힘의
          정의에서 짐작한 <b>성향의 방향</b>까지입니다.
        </p>
        <div className="kit-mbti">
          {MBTI_HINTS.map(hint => (
            <div key={hint.key}>
              <b>{hint.key}</b>
              <span>{hint.ko}</span>
              <em>{hint.axis}</em>
              <p>{hint.why}</p>
            </div>
          ))}
        </div>
        <p className="kit-note">
          MBTI 쪽도 유형 분류로 사람을 가르기에는 근거가 약하다는 검토가 있습니다
          (<b>근거</b> 탭 참고). 두 결과가 다르게 나와도 둘 중 하나가 틀린 게 아니라
          애초에 다른 것을 봅니다 — MBTI 는 성향, FABL 은 <b>일이 왔을 때의 순서</b>예요.
        </p>
      </Section>

      <Divider />

      <Section className="kit-home-tail">
        <p className="kit-eyebrow">팀 조합</p>
        <h2 className="kit-h2">일잘러 유형은 없습니다</h2>
        <p className="kit-body">
          <b>어느 유형이 더 낫다는 답은 못 냅니다.</b> 유형 점수는 내 답 안에서 비중을
          나눈 값이라 사람끼리 비교되지 않고, 유형 라벨로 성과를 가른다는 근거도 약해요.
          실력을 보고 싶으면 정답이 있는 <b>역량 체크</b> 쪽입니다.
        </p>
        <p className="kit-body">
          대신 <b>빈칸이 겹치는지</b>는 셀 수 있어요. 넷이 모였는데 시작 모드가 같으면
          그 힘만 두꺼워지고, 모두가 마지막에 쓰는 힘이 팀 전체의 빈칸으로 남습니다.
        </p>

        {TEAM_SETS.map(set => (
          <div className="kit-team" key={set.label}>
            <div className="kit-team-head"><b>{set.label}</b><span>진할수록 먼저 쓰는 힘</span></div>
            <div className="kit-grid">
              <div className="kit-grid-row kit-grid-head">
                <span />
                {workModes.map(mode => <b key={mode.key}>{mode.key}</b>)}
              </div>
              {set.codes.map(code => (
                <div className="kit-grid-row" key={code}>
                  <span>
                    <img src={`/people/${code}.jpg`} alt="" loading="lazy" />
                    <em>{code}</em>
                  </span>
                  {workModes.map(mode => {
                    const rank = code.indexOf(mode.key);
                    return <i key={mode.key} className={rank === -1 ? 'rank-none' : `rank-${rank + 1}`} title={rank === -1 ? '거의 안 씀' : `${rank + 1}순위`} />;
                  })}
                </div>
              ))}
            </div>
            <p className="kit-grid-note">
              세로로 보면 F·A·B·L 마다 진한 칸이 하나씩 — 네 힘을 한 사람씩 맡는다.
            </p>
          </div>
        ))}

        <h3 className="kit-skew-title">한쪽으로 쏠리면 이렇게 됩니다</h3>
        <p className="kit-body">
          같은 힘을 먼저 쓰는 사람만 모이면 그 힘은 두꺼워지고, 아무도 안 보는 자리가
          생깁니다. 아래는 FABL 정의에서 따라 나오는 <b>예상</b>이지 조사 결과가 아니에요.
        </p>
        {SKEWS.map(skew => (
          <details className="kit-skew" key={skew.key}>
            <summary><b>{skew.key}</b>{skew.title}</summary>
            <p className="kit-skew-strong">잘하는 것 · {skew.strong}</p>
            <p className="kit-skew-missing">빠지는 것 · {skew.missing}</p>
            <ul>{skew.signs.map(sign => <li key={sign}>{sign}</li>)}</ul>
          </details>
        ))}

        <h3 className="kit-skew-title">고루 섞는 게 늘 좋은 건 아니에요</h3>
        <p className="kit-body">
          섞으면 보는 눈이 넓어지지만 <b>맞추는 비용</b>이 함께 붙습니다. 같은 순서로
          일하는 사람끼리는 말이 짧고 빠릅니다. 무엇을 하는 팀인지에 따라 답이 갈려요.
        </p>
        <div className="kit-tradeoff">
          <div>
            <b>섞는 쪽이 유리할 때</b>
            <ul>
              <li>문제가 아직 정의되지 않은 새 일</li>
              <li>놓치면 되돌리기 어려운 결정</li>
              <li>맞출 시간이 있는 긴 호흡의 일</li>
            </ul>
          </div>
          <div>
            <b>모으는 쪽이 유리할 때</b>
            <ul>
              <li>방법이 이미 정해진 반복 실행</li>
              <li>마감이 촉박해 합의할 틈이 없을 때</li>
              <li>조율 비용이 얻는 것보다 클 때</li>
            </ul>
          </div>
        </div>

        <div className="kit-callout">
          <b>상극은 없어요. 겹침이 있을 뿐입니다.</b>
          <p>
            잘 안 맞는 조합이란 성격이 부딪히는 게 아니라, 네 명이 같은 순서로 일해서
            아무도 안 보는 자리가 생기는 경우예요. 위 묶음은 그 자리가 안 생기게 짠
            예시일 뿐, <b>성과가 좋아진다는 예측이 아닙니다</b>. 섞는 것의 효과가
            작고 조건을 탄다는 연구는 <b>근거</b> 탭에 적어 뒀어요.
          </p>
        </div>
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
          상황 20개로 유형을 보고, 이어서 정답이 있는 {KEYED_QUESTION_COUNT}문항으로 판단이
          맞는지까지 봐요. 문항이 많아 시간이 걸려요.
        </p>
        <ul className="kit-facts">
          <li><b>상황 20개</b><span>고르기 · 이유 쓰기까지</span></li>
          <li><b>역량 {KEYED_QUESTION_COUNT}문항</b><span>정답 있음 · 틀리면 이유를 보여줘요</span></li>
        </ul>
        <div className="kit-dims">
          {dims.map(key => <span key={key}>{qualityDimensionNames[key]}</span>)}
        </div>
        <Button full shape="pill" onClick={() => on.start('full')}>유형 + 역량 시작 →</Button>
      </div>

      <div className="kit-actions">
        <Button full shape="pill" variant="light" onClick={on.startKeyed}>역량 {KEYED_QUESTION_COUNT}문항만 하기</Button>
        {archiveCount > 0 && (
          <Button full shape="pill" variant="light" onClick={on.latest}>최근 결과 보기 {archiveCount}</Button>
        )}
        <Button full shape="pill" variant="light" onClick={on.importResult}>결과 파일 불러오기</Button>
      </div>

      <p className="kit-note">
        유형 점수는 내 답 안에서의 상대적 선호라 사람끼리 비교되지 않아요. 역량 점수는
        정답으로 매기지만 {KEYED_QUESTION_COUNT}문항짜리 짧은 확인이고, 채용이나 인사평가의
        근거로 쓰지 마세요. 왜 그런지는 <b>근거</b> 탭에 적어 뒀어요.
      </p>
    </Section>
  );
}

// 4인 팀 조합. 네 명의 '시작 모드'가 모두 다르고 '마지막 모드'도 겹치지 않는 묶음이다.
// 성과 예측이 아니라 커버리지 계산이라는 점을 화면에도 적는다.
const TEAM_SETS = [
  { label: '균형형', codes: ['FAB', 'ABL', 'BLF', 'LFA'] },
  { label: '실행 중심', codes: ['FBA', 'BAL', 'ALF', 'LFB'] },
  { label: '조율 중심', codes: ['FLA', 'LAB', 'ABF', 'BFL'] }
];

// MBTI 대응은 데이터로 확인한 게 아니다. 두 검사를 같이 받은 사람들의 응답을 맞춰 본
// 적이 없으므로, 축 수준의 '겹칠 법한 성향'까지만 적고 24유형 대 16유형 표는 만들지 않는다.
const MBTI_HINTS = [
  { key: 'F', ko: '해석', axis: 'N · T 쪽', why: '눈앞의 사실보다 패턴과 원인을 먼저 본다' },
  { key: 'A', ko: '판단', axis: 'J · T 쪽', why: '먼저 정하고 닫는 것을 편하게 여긴다' },
  { key: 'B', ko: '실행', axis: 'S · P 쪽', why: '말보다 손이 먼저 나가고 하면서 고친다' },
  { key: 'L', ko: '조율', axis: 'E · F 쪽', why: '사람과 맞추는 과정에서 답을 찾는다' }
];

// 한 모드로 쏠린 조직에서 생기는 일. 연구 결과가 아니라 FABL 정의에서 따라 나오는
// 예상이라는 점을 화면에 적는다.
const SKEWS = [
  {
    key: 'F',
    title: '해석만 두꺼운 조직',
    strong: '문제를 깊게 판다. 남들이 놓친 이상을 먼저 찾는다.',
    missing: '정하고 손대는 사람',
    signs: ['자료는 쌓이는데 뭘 할지가 안 정해진다', '“조금 더 보고 정하자”가 반복된다', '분석이 끝나면 이미 상황이 바뀌어 있다']
  },
  {
    key: 'A',
    title: '판단만 두꺼운 조직',
    strong: '방향과 우선순위가 빨리 선다. 회의가 짧다.',
    missing: '현장을 보는 눈과 만드는 손',
    signs: ['계획과 로드맵은 많은데 나온 것이 적다', '근거가 얇아 결정이 자주 뒤집힌다', '정한 사람과 하는 사람이 갈린다']
  },
  {
    key: 'B',
    title: '실행만 두꺼운 조직',
    strong: '빨리 만든다. 일단 굴러가는 것이 나온다.',
    missing: '왜 하는지와 서로 맞추기',
    signs: ['만든 것끼리 서로 안 맞는다', '다 만든 뒤에 필요 없던 일이었음이 드러난다', '고쳐 만드는 시간이 계속 늘어난다']
  },
  {
    key: 'L',
    title: '조율만 두꺼운 조직',
    strong: '합의가 잘 되고 사람 사이 마찰이 적다.',
    missing: '문제를 규명하고 끝내는 힘',
    signs: ['회의는 좋은데 결론이 안 남는다', '책임이 흩어져 아무도 안 끝낸다', '갈등을 피하느라 이상 신호를 늦게 말한다']
  }
];

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
    claim: '팀을 다양하게 섞는 효과는 작고 종류를 탄다',
    body: '여러 연구를 모아 보면 다양성과 팀 성과의 관계는 일관되게 크지 않았다. 하는 일과 관련된 다양성(전문성·경험)은 성과와 약한 양의 관계를 보였고, 인구통계 다양성은 거의 관계가 없었다. "섞으면 좋다"는 조건 없이 성립하는 말이 아니다.',
    who: 'Horwitz, S. K., & Horwitz, I. B. (2007)',
    title: 'The effects of team diversity on team outcomes: A meta-analytic review of team demography',
    where: 'Journal of Management, 33(6)'
  },
  {
    claim: '서로 같은 그림을 갖고 있으면 더 잘 굴러간다',
    body: '팀원들이 일과 서로에 대해 비슷한 이해를 공유할수록 협업 과정과 성과가 좋았다. 다르게 보는 사람이 모이면 이 공유된 그림을 만드는 데 시간이 더 든다 — 섞는 데 드는 비용이 여기 있다.',
    who: 'Mathieu, J. E., Heffner, T. S., Goodwin, G. F., Salas, E., & Cannon-Bowers, J. A. (2000)',
    title: 'The influence of shared mental models on team process and performance',
    where: 'Journal of Applied Psychology, 85(2)'
  },
  {
    claim: '같은 것을 아는 사람끼리 모이면 아는 것만 다시 확인한다',
    body: '집단은 이미 모두가 알고 있는 정보를 주로 이야기하고, 한 사람만 가진 정보는 잘 꺼내지 않는다는 실험이 있다. 한쪽으로 쏠린 조직에서 놓치는 자리가 생기는 이유와 맞닿는다.',
    who: 'Stasser, G., & Titus, W. (1985)',
    title: 'Pooling of unshared information in group decision making',
    where: 'Journal of Personality and Social Psychology, 48(6)'
  },
  {
    claim: '팀을 잘 굴리는 것은 구성원 조합보다 대화 방식이었다',
    body: '집단의 성과를 예측한 것은 구성원 개개인의 능력 평균이나 성향 조합이 아니라, 발언 기회가 고르게 돌아가는지와 상대의 상태를 읽는 능력이었다. 유형을 골고루 섞는 것이 좋은 팀을 만든다는 보장은 없다.',
    who: 'Woolley, A. W., Chabris, C. F., Pentland, A., Hashmi, N., & Malone, T. W. (2010)',
    title: 'Evidence for a collective intelligence factor in the performance of human groups',
    where: 'Science, 330(6004)'
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
  '24유형의 인물은 공개된 업적에서 연상한 예시이고, 성격이나 역량을 진단한 결과가 아니다.',
  '홈의 4인 팀 조합은 네 가지 힘이 겹치지 않게 짠 계산일 뿐, 그렇게 모으면 성과가 오른다는 근거는 없다.',
  '어떤 팀에 섞는 편이 유리하고 어떤 팀에 모으는 편이 유리한지는 이 사이트가 판별하지 못한다. 조건을 적어 두었을 뿐이다.'
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
