import { createRoot } from 'react-dom/client';
import { AppShell, AppShellHeader, AppShellContent, Section, Divider, Button, Watermark, watermarkTint } from '@m1kapp/kit';
import './landing.css';
import { workModes, workTypeNames, workTypePeople, workTypeReasons } from './types.js';

const ACCENT = '#6047d8';

// 랜딩만 @m1kapp/kit 앱셸로 간다. 테스트 진행·결과 화면은 기존 바닐라 렌더 그대로다.
// 셸은 430px 모바일 컨테이너라, 원래 와이드 히어로에 맞춰 있던 레이아웃 대신
// 세로 한 줄 구성으로 다시 짰다. 유형 매트릭스처럼 폭이 필요한 블록만
// 가로 스크롤 상자에 넣는다.
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

function Landing({ archiveCount, on }) {
  const modes = workModes.map((mode, index) => (
    <article className={`kit-mode mode-${mode.key.toLowerCase()}`} key={mode.key}>
      <div><span>0{index + 1}</span><b>{mode.key}</b></div>
      <small>{mode.en} · {mode.ko}</small>
      <h3>{mode.question}</h3>
      <p>{mode.desc}</p>
    </article>
  ));

  return (
    <Watermark color={watermarkTint(ACCENT)} text="fabl">
      <AppShell accent={ACCENT}>
        <AppShellHeader>
          <b className="kit-brand">FABL TEST <span>β</span></b>
          <a className="kit-navlink" href="#types">24 TYPES</a>
        </AppShellHeader>
        <AppShellContent>
          <Section className="pt-6">
            <p className="kit-eyebrow">FRAME · AIM · BUILD · LINK</p>
            <h1 className="kit-h1">일이 떨어지면<br />나는 <em>뭐부터</em><br />할까?</h1>
            <p className="kit-lead">
              상황부터 파악하는 사람, 뭐가 중요한지 먼저 정하는 사람, 일단 만들어보는 사람,
              관련된 사람부터 맞추는 사람. 성격이 아니라 <b>먼저 손대는 곳</b>이 다릅니다.
            </p>
            <div className="kit-example" aria-label="결과 예시 FAB">
              <b className="kit-example-tag">결과는 이렇게 나옵니다 · 예시</b>
              <div><span>F</span><i /><span>A</span><i /><span>B</span></div>
              <small>FRAME → AIM → BUILD</small>
              <strong>FAB · 분석추진형</strong>
            </div>
            <div className="kit-actions">
              <Button full shape="pill" onClick={() => on.start('short')}>내 업무 유형 찾기 →</Button>
              <Button full shape="pill" variant="light" onClick={() => on.start('full')}>정밀 코스로 하기</Button>
              {archiveCount > 0 && (
                <Button full shape="pill" variant="light" onClick={on.latest}>최근 결과 보기 {archiveCount}</Button>
              )}
            </div>
            <p className="kit-meta">12개 상황 · 약 2~3분<br />정밀 코스는 서술형까지 20상황 · 약 6~8분</p>
          </Section>

          <Divider />

          <Section>
            <p className="kit-eyebrow">FOUR WORK MODES</p>
            <h2 className="kit-h2">FABL — 일은 네 가지 힘으로 흘러갑니다.</h2>
            <p className="kit-body">
              일이 주어지면 사람마다 먼저 손대는 곳이 다릅니다. 그 네 갈래가 FABL 이고,
              자주 쓰는 세 가지를 <b>먼저 쓰는 차례대로</b> 이으면 내 유형이 됩니다.
            </p>
            <div className="kit-modes">{modes}</div>
          </Section>

          <Divider />

          <Section>
            <p className="kit-eyebrow" id="types">24 WORKING TYPES</p>
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

          <Divider />

          <Section className="pb-10">
            <p className="kit-eyebrow">READY TO FIND YOUR TYPE?</p>
            <h2 className="kit-h2">당신이 먼저 손대는 곳은 어디일까요?</h2>
            <div className="kit-actions">
              <Button full shape="pill" onClick={() => on.start('short')}>테스트 시작 →</Button>
              <Button full shape="pill" variant="light" onClick={on.importResult}>결과 파일 불러오기</Button>
            </div>
          </Section>
        </AppShellContent>
      </AppShell>
    </Watermark>
  );
}

let root = null;

export function mountLanding(container, props) {
  // 다른 화면이 innerHTML 로 남긴 노드를 React 가 치워주지 않는다. 루트를 새로 만들 때 비운다.
  if (!root) { container.innerHTML = ''; root = createRoot(container); }
  root.render(<Landing {...props} />);
}

export function unmountLanding() {
  if (!root) return;
  root.unmount();
  root = null;
}
