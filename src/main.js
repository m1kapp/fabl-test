import './style.css';
import './chat.css';
import { workModes, workTypeNames, workTypePeople, workTypeReasons } from './types.js';
import { share, typeUrl, codeFromPath, answersFromQuery, worstAnswersFromQuery, scenarioSetFromQuery } from './share.js';
import { keyedItems, scoreKeyed, qualityDimensionNames, KEYED_QUESTION_COUNT } from './keyed.js';
import { mountShell, screenHost, shellScroller } from './shell.jsx';

const capabilities = [
  { key: 'sensemaking', ko: '맥락추론력', en: 'Sensemaking', desc: '불완전한 정보에서도 전체 흐름과 의미를 파악한다.' },
  { key: 'validation', ko: '정합검증력', en: 'Validation', desc: '전제와 실제 결과를 대조해 이상을 발견한다.' },
  { key: 'focus', ko: '문제수렴력', en: 'Focus', desc: '확장 가능성을 분리하고 현재 문제의 범위를 유지한다.' },
  { key: 'priority', ko: '우선판단력', en: 'Prioritization', desc: '영향과 비용을 비교해 먼저 할 일을 정한다.' },
  { key: 'impact', ko: '성과전환력', en: 'Impact', desc: '업무를 고객 해결과 실제 사용 가능한 결과로 연결한다.' },
  { key: 'delivery', ko: '실행완결력', en: 'Delivery', desc: '맡은 일을 예측 가능한 품질과 일정으로 끝낸다.' },
  { key: 'pioneering', ko: '개척력', en: 'Pioneering', desc: '정답이 없는 영역에서 작동하는 첫 길을 만든다.' },
  { key: 'alignment', ko: '소통정렬력', en: 'Alignment', desc: '상대와 문제·의도·완료 기준을 일치시킨다.' },
  { key: 'collaboration', ko: '협업추진력', en: 'Collaboration', desc: '권한 밖의 사람과 의존성을 움직여 공동 결과를 만든다.' },
  { key: 'recalibration', ko: '판단갱신력', en: 'Recalibration', desc: '피드백과 결정에 맞춰 기존 판단을 수정하고 실행한다.' }
];

const qualityDimensions = [
  { key: 'problem_definition', ko: '문제 정의', desc: '현상과 원인을 구분해 풀 문제를 특정함' },
  { key: 'prioritization', ko: '우선순위', desc: '영향과 비용을 비교해 먼저 할 일을 고름' },
  { key: 'customer_impact', ko: '고객 영향', desc: '전체 평균 너머 실제 불편과 결과를 봄' },
  { key: 'actionability', ko: '실행 가능성', desc: '누가 무엇을 할지 다음 행동으로 구체화함' },
  { key: 'verification', ko: '검증', desc: '완료와 성공 여부를 확인할 기준을 둠' }
];





const workModeCapabilityKeys = {
  F: ['sensemaking', 'validation', 'focus'],
  A: ['priority', 'impact'],
  B: ['delivery', 'pioneering'],
  L: ['alignment', 'collaboration', 'recalibration']
};

const workModeColors = { F: '#6047d8', A: '#df705f', B: '#239575', L: '#3e78c5' };
const capabilityWorkMode = Object.fromEntries(Object.entries(workModeCapabilityKeys).flatMap(([mode, keys]) => keys.map(key => [key, mode])));

// 모드 점수는 역량 점수의 평균이 아니라 모드에 속한 역량을 묶어 한 번에 비율을 낸다.
// 평균을 쓰면 신호가 적은 역량 하나가 튀면서 모드 순위까지 뒤집힌다.
// 관찰 기회가 적은 역량은 한 번만 골라도 비율이 튄다. 기대 신호에 상수를 더해
// 관찰이 적을수록 전체 평균 쪽으로 당긴다(수축 추정). 기회가 충분하면 사실상 그대로다.
const SIGNAL_PRIOR = 1.5;
// '제일 나중' 선택에 줄 음의 가중치. 1 로 두면 '먼저' 와 대칭이 되어 신호가 과하게 흔들린다.
const WORST_WEIGHT = 0.6;
function shrunkRate(obtained, chance, globalRate) {
  return (obtained + SIGNAL_PRIOR * globalRate) / (chance + SIGNAL_PRIOR);
}

function calculateWorkType(result) {
  const byKey = Object.fromEntries(result.map(item => [item.key, item]));
  const globalRate = result[0] && result[0].globalRate;
  const scores = Object.fromEntries(result.map(item => [item.key, item.score]));
  const pooled = Number.isFinite(globalRate) && globalRate
    ? workModes.map(mode => {
        const keys = workModeCapabilityKeys[mode.key];
        const obtained = keys.reduce((sum, key) => sum + (byKey[key].obtained || 0), 0);
        const chance = keys.reduce((sum, key) => sum + (byKey[key].chance || 0), 0);
        return shrunkRate(obtained, chance, globalRate);
      })
    : null;
  const meanRate = pooled ? pooled.reduce((sum, rate) => sum + rate, 0) / pooled.length : 0;
  const modes = workModes.map((mode, index) => {
    const keys = workModeCapabilityKeys[mode.key];
    const score = pooled && meanRate
      ? 2 + Math.min(3, (pooled[index] / meanRate) * 1.5)
      : keys.reduce((sum, key) => sum + scores[key], 0) / keys.length;
    return { ...mode, score };
  }).sort((a, b) => b.score - a.score);
  return { code: modes.slice(0, 3).map(mode => mode.key).join(''), modes };
}

const behaviorScenarios = [
  {
    title: '처음 보는 문제가 들어오면',
    actions: {
      F: '자료와 맥락을 살펴 진짜 문제가 무엇인지 선명하게 만듭니다.',
      A: '고객 영향과 긴급도를 비교해 먼저 해결할 목표를 고릅니다.',
      B: '작게라도 작동하는 결과를 만들어 문제의 실체를 확인합니다.',
      L: '관련된 사람에게 상황과 기대 결과를 물어 기준부터 맞춥니다.'
    }
  },
  {
    title: '시간이 부족한 출시 직전에는',
    actions: {
      F: '겉으로 드러난 증상과 실제 원인을 구분해 치명적인 구멍을 찾습니다.',
      A: '지금 반드시 지켜야 할 고객 가치와 포기할 범위를 결정합니다.',
      B: '출시에 필요한 최소 단위를 직접 완성하고 동작 여부를 확인합니다.',
      L: '담당자와 의존성을 연결하고 모두가 같은 완료 기준으로 움직이게 합니다.'
    }
  },
  {
    title: '다른 팀과 의견이 엇갈리면',
    actions: {
      F: '각 주장의 전제와 사실을 분리해 충돌이 생긴 지점을 찾아냅니다.',
      A: '공동 성과에 가장 중요한 기준을 세워 선택지를 좁힙니다.',
      B: '말로만 논쟁하기보다 작은 결과나 실험으로 판단 근거를 만듭니다.',
      L: '상대의 제약과 의도를 확인하고 함께 실행할 역할과 약속을 정렬합니다.'
    }
  }
];

function renderBehaviorInsights(selectedModes) {
  return behaviorScenarios.map((scenario, index) => `<article><span>0${index + 1}</span><div><b>${scenario.title}</b><div class="behavior-steps">${selectedModes.map((mode, step) => `<span><em>${step + 1}</em><i>${scenario.actions[mode.key]}</i></span>`).join('')}</div></div></article>`).join('');
}


const scenarioImageAlts = [
  '주간 보고서의 수치 불일치를 살피는 장면',
  '추천 목록에서 빠진 강의와 전체 시스템을 비교하는 장면',
  '새 포장법을 작은 배송 실험으로 검증하는 장면',
  '여러 협력사의 일정과 개점 계획을 조율하는 장면',
  '다른 최종 결정을 받아들이고 측정 계획을 세우는 장면',
  '출시 직전 작은 표시 오류를 발견한 장면',
  '전체 흥행과 충성 고객의 반복 불편을 함께 보는 장면',
  '전체 물류는 원활하지만 한 서점에 문제가 생긴 장면',
  '긍정적인 중간 발표 뒤에 원자료를 점검하는 장면',
  '스마트 농장의 센서 이상을 현장에서 확인하는 장면',
  '전시 직전 문구 변경을 여러 관계자와 조율하는 장면',
  '인기 여행 경로에 문의가 몰린 원인을 찾는 장면',
  '일부 건물에서만 반복되는 야간 온도 경보를 보는 장면',
  '온라인 경매 마감 시각의 혼선을 바로잡는 장면',
  '급식 알레르기 안내와 배식 동선을 점검하는 장면',
  '스포츠 센터 이용자별 숙련도 차이를 분석하는 장면',
  '병원 외래 접수 창구 앞에 오전 대기 줄이 길게 늘어선 장면',
  '카페 주방에서 신메뉴 준비로 다른 주문이 밀리는 장면',
  '게임 화면 앞에서 사흘 만에 접속을 끊은 이용자 흐름을 살피는 장면',
  '아파트 주차장에서 자리를 두고 마주 선 두 입주민 장면',
  '도서관 강좌실의 빈 좌석과 대기자 명단을 함께 보는 장면',
  '정비소에서 같은 고장으로 다시 들어온 차를 점검하는 장면',
  '광고 클릭 그래프는 오르고 구매 그래프는 평평한 화면을 보는 장면',
  '민원 접수함에 서류가 쌓이고 담당자가 처리 순서를 정하는 장면',
  '대다수는 빠르지만 특정 이용자는 계속 느린 장면',
  '국내 처리는 원활하지만 해외 주소에서 막히는 장면',
  '축제 입장 동선의 병목을 찾아 경로를 바꾸는 장면',
  '공유 주방의 자동 배정 불균형을 분석하는 장면'
];

const scenarioBlueprints = [
  {
    domain: '물류 운영', title: '주문 750건, 자동 처리 270건',
    body: '주간 회의에서 하루 주문 750건, 자동화율 60%, 자동 처리 270건이 담긴 자료가 공유됐다. 발표자는 지난주보다 처리 시간이 줄어 운영 효율이 개선되고 있다고 설명한 뒤 다음 안건으로 넘어가려 한다.',
    options: [
      { text: '예상값과 차이가 나는 지점을 직접 계산하고 집계 조건부터 대조한다.', scores: { validation: 3, focus: 2 } },
      { text: '담당자와 숫자의 정의·기간·필터를 맞추고 같은 기준으로 다시 확인한다.', scores: { alignment: 3, collaboration: 2 } },
      { text: '이 숫자를 쓰는 보고와 의사결정을 찾아 무엇부터 바로잡을지 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '집계 조건을 바로잡아 같은 자료를 내가 다시 만들어 공유한다.', scores: { delivery: 3, pioneering: 2 } }
    ]
  },
  {
    domain: '교육 서비스', title: '찾는 강의가 목록에 없다는 문의',
    body: '수강생이 특정 강의를 찾을 수 없다고 문의했다. 동료는 추천 알고리즘 전체를 교체해야 한다고 주장한다.',
    options: [
      { text: '강의가 보이지 않는 상황부터 다시 확인하고, 추천 방식 전체의 문제는 나중에 따로 살펴본다.', scores: { focus: 3, validation: 2 } },
      { text: '그 강의가 지금 검색 결과에 바로 뜨도록 손봐서 내보낸다.', scores: { delivery: 3, impact: 2 } },
      { text: '이 강의의 수강 규모와 매출 비중을 견줘 지금 다룰 일인지 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '동료와 역할을 나눠 한쪽은 빠르게 강의를 다시 보이게 하고, 다른 쪽은 추천 방식의 문제를 살펴본다.', scores: { collaboration: 3, alignment: 2 } }
    ]
  },
  {
    domain: '식품 제조', title: '해외 업체가 쓰는 포장법',
    body: '해외 물류업체의 포장 방식이 자사의 배송 파손 문제와 맞을 가능성이 있어 보인다. 아직 국내 적용 사례는 없다.',
    options: [
      { text: '작은 포장 실험을 설계해 실제 파손률이 달라지는지 먼저 시험한다.', scores: { pioneering: 3, delivery: 2, validation: 2 } },
      { text: '적용 조건과 국내 환경의 차이를 조사해 우리 문제와 연결되는 원리를 찾는다.', scores: { sensemaking: 3, validation: 3 } },
      { text: '현재 파손 과제들과 비교해 지금 실험할 가치가 있는지 우선순위를 판단한다.', scores: { priority: 3, impact: 2, focus: 2 } },
      { text: '물류·구매 담당자에게 발견 내용을 설명하고 함께 가능한 시험 범위를 정한다.', scores: { collaboration: 3, alignment: 3, pioneering: 2 } }
    ]
  },
  {
    domain: '신규 매장', title: '업체 세 곳이 말한 날짜가 다르다',
    body: '개점을 위해 인테리어 업체·결제사·물류센터의 작업이 필요하지만 일정과 우선순위가 서로 다르다.',
    options: [
      { text: '어떤 일이 끝나야 다음 일을 시작할 수 있는지 정리해, 개점일을 늦출 가능성이 큰 일부터 확인한다.', scores: { sensemaking: 3, validation: 2 } },
      { text: '각 업체의 제약을 듣고 모두가 실행 가능한 하나의 일정으로 조율한다.', scores: { collaboration: 3, alignment: 2 } },
      { text: '각 일의 담당자와 기한, 끝났다고 볼 조건을 적고 매일 지연되는 일을 해결한다.', scores: { delivery: 3, focus: 2 } },
      { text: '개점에 꼭 필요한 범위와 나중에 보완할 범위를 나눠 대안을 제시한다.', scores: { priority: 3, impact: 2 } }
    ]
  },
  {
    domain: '지역 센터', title: '운영시간을 짧게 시작하기로 정해졌다',
    body: '나는 운영시간을 늘려야 한다고 판단했지만, 검토 후 책임자는 짧은 운영시간으로 시작하기로 결정했다.',
    options: [
      { text: '내 우려와 근거를 기록으로 남긴 뒤 최종 결정에 맞춰 실행한다.', scores: { recalibration: 3, alignment: 2 } },
      { text: '짧게 운영하면 어떤 이용자가 얼마나 불편해지는지 숫자로 재 본다.', scores: { validation: 3, sensemaking: 2 } },
      { text: '짧게 운영해 지키려는 것과 잃는 것을 견줘 무엇이 먼저인지 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '결정된 범위 안에서 운영 성과를 높일 새로운 방법을 찾아 시험한다.', scores: { delivery: 3, pioneering: 2 } }
    ]
  },
  {
    domain: '예약 서비스', title: '공개 하루 전, 할인 문구가 실제와 다르다',
    body: '공개를 하루 앞두고 일부 조건에서 할인 문구가 잘못 표시된다. 결제 금액은 정확하며 전체 정책 개편 논의도 진행 중이다.',
    options: [
      { text: '발생 조건과 노출 범위를 빠르게 확인해 출시 판단에 필요한 위험을 계산한다.', scores: { validation: 3, sensemaking: 2 } },
      { text: '잘못된 문구만 고친 뒤 같은 상황에서 다시 확인하고 예정대로 출시한다.', scores: { delivery: 3, focus: 2 } },
      { text: '고객센터와 안내 문구·문의 답변을 같은 기준으로 맞춘다.', scores: { alignment: 3, collaboration: 2 } },
      { text: '지금 고칠 문구와 나중에 바꿀 정책을 나눠 무엇을 먼저 할지 정한다.', scores: { priority: 3, impact: 2 } }
    ]
  },
  {
    domain: '공연 운영', title: '매진 공연에 좌석 관련 글이 이어진다',
    body: '신규 공연이 전석 매진됐고 만족도도 높다. 다만 장기 회원 게시판에는 좌석 선택이 어렵다는 글이 반복해서 올라오고 있다.',
    options: [
      { text: '전체 만족도보다 장기 회원의 이용 흐름을 따로 나눠 불편이 집중되는 조건을 찾는다.', scores: { sensemaking: 3, validation: 3 } },
      { text: '매진 성과를 유지하면서 다음 예매 때 좌석 안내를 먼저 개선한다.', scores: { delivery: 3, impact: 2 } },
      { text: '장기 회원에게 구체적인 이용 화면과 기대했던 방식을 물어본다.', scores: { alignment: 3, collaboration: 2 } },
      { text: '매진 성과와 장기 회원의 불편 중 무엇을 먼저 챙길지 정한다.', scores: { priority: 3, impact: 2 } }
    ]
  },
  {
    domain: '출판 유통', title: '전체 반품은 줄고 한 곳은 늘었다',
    body: '신간의 전체 반품률이 지난 분기보다 낮아졌다. 한 대형 서점만 배송 지연으로 반품이 늘었지만 전체 수치에는 거의 영향을 주지 않는다.',
    options: [
      { text: '서점 규모와 거래 지속성을 견줘 이 문제를 지금 다룰지 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '전체 반품률 개선을 먼저 확정하고 해당 서점 문제는 별도 과제로 분리한다.', scores: { focus: 3, validation: 2 } },
      { text: '물류사·서점 담당자와 어느 단계부터 늦어졌는지 함께 맞춰 본다.', scores: { collaboration: 3, alignment: 2 } },
      { text: '다음 배송부터 적용할 임시 경로를 정하고 반품률 변화를 확인한다.', scores: { delivery: 3, pioneering: 2 } }
    ]
  },
  {
    domain: '연구 지원', title: '연구소가 성공을 먼저 알려왔다',
    body: '외부 연구소가 예정일보다 일찍 실험 완료를 알렸다. 결과 요약은 긍정적이지만 원본 데이터와 실패 조건은 다음 주에 전달할 수 있다고 한다.',
    options: [
      { text: '결론을 공유하기 전에 원본 데이터와 실패 조건을 확인할 범위를 정한다.', scores: { validation: 3, focus: 2 } },
      { text: '아직 확인이 끝나지 않은 결과라고 밝히고, 원본 데이터를 확인할 날짜를 함께 알린다.', scores: { alignment: 3, collaboration: 2 } },
      { text: '이 결과로 바뀌는 의사결정이 무엇인지 확인해 필요한 검증 수준을 정한다.', scores: { priority: 3, impact: 3 } },
      { text: '긍정적 신호를 활용해 후속 실험 후보를 먼저 설계한다.', scores: { pioneering: 3, delivery: 2 } }
    ]
  },
  {
    domain: '도시 농업', title: '새 장비를 쓴 농장에서 수확이 늘었다',
    body: '한 농장에서 새 센서를 도입한 뒤 수확량이 12% 늘었다. 현장팀은 모든 농장에 빠르게 확대하자고 제안한다.',
    options: [
      { text: '날씨·품종·작업 방식의 차이를 대조해 센서 효과인지 확인한다.', scores: { validation: 3, sensemaking: 2 } },
      { text: '환경이 다른 농장 한 곳에서도 같은 효과가 나는지 작은 규모로 시험한다.', scores: { pioneering: 3, delivery: 2 } },
      { text: '확대 비용과 기대 수확량을 계산해 적용 순서를 정한다.', scores: { priority: 3, impact: 3 } },
      { text: '현장팀과 성공 기준·중단 기준을 합의한 뒤 단계적으로 확대한다.', scores: { alignment: 3, collaboration: 3 } }
    ]
  },
  {
    domain: '박물관 전시', title: '전문가가 안내문 표현을 지적했다',
    body: '개막 이틀 전 전문가가 핵심 설명문의 표현이 부정확하다고 지적했다. 인쇄물은 이미 제작됐고 디지털 안내는 즉시 바꿀 수 있다.',
    options: [
      { text: '관람객 오해의 크기를 판단해 반드시 바꿀 표현부터 좁힌다.', scores: { priority: 3, impact: 2 } },
      { text: '디지털 안내를 먼저 수정하고 현장 인쇄물의 보완 방법을 실행한다.', scores: { delivery: 3, focus: 2 } },
      { text: '전문가에게 반드시 고쳐야 할 표현과 그대로 써도 되는 표현을 구분해 달라고 요청한다.', scores: { alignment: 3, collaboration: 2 } },
      { text: '지적받은 문장이 실제로 틀렸는지 원자료와 대조한다.', scores: { validation: 3, sensemaking: 2 } }
    ]
  },
  {
    domain: '여행 상품', title: '예약은 늘고 일정 문의도 늘었다',
    body: '새 여행 코스의 예약 전환율이 높다. 운영팀은 일정이 빠듯해 현장 문의가 늘었다고 하지만 취소율은 아직 낮다.',
    options: [
      { text: '전환율과 별개로 현장 문의가 집중되는 일정 구간을 찾아본다.', scores: { sensemaking: 3, validation: 2 } },
      { text: '예약 고객에게 일정의 난도를 더 명확히 안내해 기대를 맞춘다.', scores: { alignment: 3, impact: 2 } },
      { text: '예약이 늘어 얻은 것과 문의 대응 비용을 견줘 코스를 손댈지 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '가장 부담이 큰 한 구간을 골라 다음 회차부터 바꿔 본다.', scores: { delivery: 3, pioneering: 2 } }
    ]
  },
  {
    domain: '건물 관리', title: '전기 사용은 줄고 밤에 경보가 울린다',
    body: '새 냉난방 제어 후 에너지 사용량은 줄었다. 야간에만 일부 층에서 온도 경보가 발생하지만 출근 시간에는 정상으로 돌아온다.',
    options: [
      { text: '경보가 발생한 층·시간·외부 기온을 묶어 공통 조건을 찾는다.', scores: { sensemaking: 3, validation: 3 } },
      { text: '야간 근무자가 있는 층의 영향부터 확인해 대응 우선순위를 정한다.', scores: { impact: 3, priority: 3 } },
      { text: '한 층의 설정을 바꿔 경보가 사라지는지 다음 날까지 검증한다.', scores: { delivery: 3, pioneering: 2 } },
      { text: '시설팀과 몇 도까지 정상으로 볼지 정하고 담당 층을 나눈다.', scores: { alignment: 3, collaboration: 3 } }
    ]
  },
  {
    domain: '온라인 경매', title: '참여자는 늘고 마감 문의도 늘었다',
    body: '화면 개편 후 입찰 참여자는 늘었지만 문의 게시판에는 마감 시간을 오해했다는 글도 증가했다. 낙찰 자체는 정상 처리됐다.',
    options: [
      { text: '이용자들이 어느 화면을 거쳐 입찰했고 어디서 마감 시간을 오해했는지 확인한다.', scores: { sensemaking: 3, validation: 3 } },
      { text: '마감 직전 이용자에게 시간을 더 분명히 보여주는 수정을 우선한다.', scores: { delivery: 3, impact: 2 } },
      { text: '문의 고객에게 어떤 표현을 어떻게 이해했는지 구체적으로 확인한다.', scores: { alignment: 3, collaboration: 2 } },
      { text: '참여자가 는 성과와 마감 오해 민원 중 무엇을 먼저 다룰지 정한다.', scores: { priority: 3, impact: 2 } }
    ]
  },
  {
    domain: '급식 운영', title: '만족도는 오르고 대체식 대기는 길어졌다',
    body: '새 식단의 평균 만족도가 높고 잔반도 줄었다. 알레르기 대체식을 신청한 이용자들의 배식 대기시간은 이전보다 길어졌다.',
    options: [
      { text: '대체식이 준비되고 전달되는 과정 중 어느 단계에서 시간이 더 걸리는지 찾는다.', scores: { sensemaking: 3, validation: 3 } },
      { text: '이용자 수와 불편의 크기를 함께 보고 개선 투입 순서를 판단한다.', scores: { priority: 3, impact: 3 } },
      { text: '대체식 준비 순서를 바꿔 다음 운영에서 바로 시험한다.', scores: { delivery: 3, pioneering: 2 } },
      { text: '신청자에게 예상 대기시간을 먼저 안내하고 수령 방식을 선택하게 한다.', scores: { alignment: 3, collaboration: 2 } }
    ]
  },
  {
    domain: '스포츠 센터', title: '예약은 많고 재신청은 적다',
    body: '신규 프로그램은 예약률이 높지만 첫 달 재등록률은 기존 프로그램보다 낮다. 강사는 참여자의 숙련도 차이가 크다고 말한다.',
    options: [
      { text: '신규·숙련 참여자의 재등록률과 중도 이탈 지점을 나눠본다.', scores: { sensemaking: 3, validation: 3 } },
      { text: '첫 수업 전에 난도와 준비사항을 안내해 기대 차이를 줄인다.', scores: { alignment: 3, collaboration: 2 } },
      { text: '난도별 소규모 세션을 열어 재등록률 변화를 시험한다.', scores: { pioneering: 3, delivery: 2 } },
      { text: '예약 성과와 장기 유지 중 무엇을 우선할지 운영 목표부터 맞춘다.', scores: { priority: 3, impact: 2 } }
    ]
  },
  {
    domain: '병원 외래', title: '전체 대기는 줄고 오전만 길어졌다',
    body: '외래 접수 방식을 바꾼 뒤 전체 대기 시간은 줄었다. 그런데 오전 첫 시간대 환자들의 대기만 유독 길어졌다는 민원이 이어진다.',
    options: [
      { text: '어느 시간대와 진료과에서만 길어지는지 접수 기록을 갈라 확인한다.', scores: { sensemaking: 3, validation: 2 } },
      { text: '민원 수와 진료 지연의 영향을 비교해 먼저 손댈 구간을 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '한 진료과의 접수 순서를 바꿔 다음 날 대기가 줄어드는지 본다.', scores: { delivery: 3, pioneering: 2 } },
      { text: '접수 담당자와 간호팀에 어디서 막히는지 묻고 순서를 정한다.', scores: { alignment: 3, collaboration: 2 } }
    ]
  },
  {
    domain: '카페 운영', title: '신메뉴 매출은 늘고 준비 시간도 늘었다',
    body: '신메뉴 매출은 목표를 넘겼다. 그런데 점주들은 준비 시간이 길어 다른 주문이 밀린다고 말한다.',
    options: [
      { text: '어느 공정에서 시간이 더 드는지 매장 기록으로 확인한다.', scores: { sensemaking: 3, focus: 2 } },
      { text: '매출 증가분과 밀린 주문의 손해를 견줘 계속할지 정한다.', scores: { priority: 3, impact: 3 } },
      { text: '한 매장에서 준비 순서를 바꿔 시간이 주는지 시험한다.', scores: { delivery: 3, pioneering: 2 } },
      { text: '점주 대표들과 어떤 메뉴를 줄일지 정한 뒤 조정한다.', scores: { alignment: 3, recalibration: 2 } }
    ]
  },
  {
    domain: '게임 서비스', title: '접속자는 늘고 사흘째 복귀는 줄었다',
    body: '새 시즌을 열고 접속자는 늘었다. 그런데 사흘째 이후 돌아오지 않는 이용자가 이전보다 많아졌다.',
    options: [
      { text: '돌아오지 않는 이용자가 어디까지 하고 멈췄는지 구간을 나눠 본다.', scores: { sensemaking: 3, validation: 2 } },
      { text: '이번 시즌 목표와 견줘 먼저 잡을 숫자를 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '난이도를 조금 낮춘 버전을 일부에게 열어 복귀율을 본다.', scores: { pioneering: 3, delivery: 2 } },
      { text: '기획팀과 운영팀이 이번 시즌 난이도를 어디까지 할지 정한다.', scores: { alignment: 3, collaboration: 2 } }
    ]
  },
  {
    domain: '아파트 관리', title: '전체 민원은 줄고 한 동은 다툼이 있다',
    body: '주차 구역을 다시 나눈 뒤 전체 민원은 줄었다. 그런데 특정 동에서는 밤마다 자리 다툼이 생긴다.',
    options: [
      { text: '그 동만 다른 조건이 무엇인지 세대 수와 차량 수를 대조한다.', scores: { validation: 3, sensemaking: 2 } },
      { text: '피해 세대 수와 반복되는 정도를 보고 먼저 해결할 곳을 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '그 동에 임시 구획을 그어 한 주 동안 다툼이 주는지 본다.', scores: { delivery: 3, pioneering: 2 } },
      { text: '입주민 대표와 관리소가 함께 지킬 규칙을 정한다.', scores: { collaboration: 3, alignment: 2 } }
    ]
  },
  {
    domain: '도서관 운영', title: '신청은 마감되고 참석은 절반이다',
    body: '주말 강좌는 신청이 열리자마자 마감된다. 그런데 실제 참석률은 절반쯤이라는 기록이 남아 있다.',
    options: [
      { text: '신청은 했는데 오지 않은 사람들의 공통점을 기록에서 찾는다.', scores: { sensemaking: 3, validation: 2 } },
      { text: '빈자리 손해와 대기자 불만을 견줘 무엇부터 고칠지 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '한 강좌에 대기자 승계를 넣어 참석률이 오르는지 본다.', scores: { delivery: 3, pioneering: 2 } },
      { text: '강사와 담당자가 정원 수와 취소 마감일을 정한다.', scores: { alignment: 3, recalibration: 2 } }
    ]
  },
  {
    domain: '자동차 정비', title: '수리한 차가 두 주 안에 다시 왔다',
    body: '수리를 마친 차가 두 주 안에 같은 증상으로 다시 들어오는 일이 늘었다. 정비 기록에는 정상 처리로 남아 있다.',
    options: [
      { text: '다시 온 차들의 부품과 작업 내용을 대조해 공통점을 찾는다.', scores: { validation: 3, sensemaking: 2 } },
      { text: '재작업 비용과 신규 예약 손실을 비교해 먼저 볼 것을 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '의심되는 부품을 바꾼 차를 따로 표시해 다시 오는지 본다.', scores: { delivery: 3, pioneering: 2 } },
      { text: '정비사들과 어디까지를 수리 완료로 볼지 정한다.', scores: { alignment: 3, recalibration: 3 } }
    ]
  },
  {
    domain: '온라인 광고', title: '클릭은 40% 늘고 구매는 그대로다',
    body: '새 광고 문구로 바꾼 뒤 클릭은 40% 늘었다. 그런데 구매 건수는 거의 변하지 않았다.',
    options: [
      { text: '클릭한 사람들이 어느 화면에서 멈추는지 흐름을 갈라 본다.', scores: { sensemaking: 3, focus: 2 } },
      { text: '광고비 대비 구매를 기준으로 이 문구를 계속 쓸지 정한다.', scores: { priority: 3, impact: 3 } },
      { text: '도착 화면 문구를 광고와 맞춘 버전을 만들어 비교한다.', scores: { delivery: 3, pioneering: 2 } },
      { text: '마케팅과 상품팀이 볼 숫자를 하나로 정한다.', scores: { alignment: 3, collaboration: 2 } }
    ]
  },
  {
    domain: '공공 민원', title: '접수는 두 배, 인력은 그대로다',
    body: '온라인 접수를 열자 민원 수가 두 배가 됐다. 담당 인력은 그대로라 처리 기한을 넘기는 건이 쌓인다.',
    options: [
      { text: '밀리는 민원이 어떤 종류인지 갈라 원인을 찾는다.', scores: { sensemaking: 3, focus: 2 } },
      { text: '기한을 넘겼을 때 피해가 큰 순서로 처리 순서를 정한다.', scores: { priority: 3, impact: 2 } },
      { text: '자주 오는 문의는 자동 답변으로 돌려 처리량을 줄여 본다.', scores: { pioneering: 3, delivery: 2 } },
      { text: '어느 종류의 민원까지 우리가 맡을지 부서와 정한다.', scores: { alignment: 3, collaboration: 2 } }
    ]
  }
];

// 문항 텍스트. 채점은 원본 blueprint 의 선택지 순서를 그대로 쓰므로 여기서는 문장만 바꾼다.
// 읽자마자 이해되는 게 목표라 해요체 두 문장, 선택지는 20자 안쪽 행동 한 줄로 맞췄다.
const plainScenarioCopy = [
  {
    title: '주문 750건 · 자동 처리 270건',
    body: '주문은 하루 750건이고, 그중 60%를 자동 처리했다고 발표했어요. 그런데 자동 처리는 270건으로 적혀 있어요.',
    options: ['두 숫자를 직접 계산해 보기', '담당자에게 어떻게 센 건지 묻기', '이 숫자로 뭘 먼저 바로잡을지 정하기', '자료를 내가 다시 만들어 공유하기']
  },
  {
    title: '찾는 강의가 목록에 없대요',
    body: '수강생이 원하는 강의를 못 찾겠다고 해요. 동료는 추천 방식을 전부 바꾸자고 해요.',
    options: ['왜 안 보이는지부터 확인하기', '그 강의가 바로 뜨게 고쳐 내보내기', '이 강의가 매출에 얼마나 큰지 따져보기', '동료와 역할 나눠 하나는 고치고 하나는 원인 보기']
  },
  {
    title: '해외 업체가 쓰는 포장법이 있어요',
    body: '해외 업체가 쓰는 포장법이 배송 파손을 줄일 것 같아요. 국내에서 써본 사례는 아직 없어요.',
    options: ['몇 개에 써보고 파손이 주는지 보기', '우리 배송에도 통할지 차이 알아보기', '지금 시험할 만한 일인지 따져보기', '배송·구매 담당자에게 같이 하자고 하기']
  },
  {
    title: '업체 세 곳이 말한 날짜가 달라요',
    body: '가게를 열려면 공사·결제 설치·상품 배송이 끝나야 해요. 업체 세 곳이 말한 날짜가 서로 달라요.',
    options: ['뭐가 늦으면 개점이 늦는지 찾기', '업체 셋과 가능한 날짜 다시 잡기', '담당자와 완료일 적어 매일 확인하기', '꼭 할 일과 나중 할 일 나누기']
  },
  {
    title: '운영시간을 짧게 시작하기로 정해졌어요',
    body: '나는 운영시간을 길게 하자고 했어요. 책임자는 짧게 시작하기로 정했어요.',
    options: ['우려는 기록으로 남기고 결정대로 준비하기', '짧게 열면 누가 얼마나 불편한지 재보기', '짧게 해서 지키는 것과 잃는 것 견주기', '정해진 시간 안에서 더 잘할 방법 찾기']
  },
  {
    title: '공개 하루 전, 할인 문구가 실제와 달라요',
    body: '일부 화면의 할인 문구가 틀렸어요. 실제 결제 금액은 맞고, 할인 정책을 통째로 바꾸는 논의도 따로 진행 중이에요.',
    options: ['누구에게 얼마나 자주 보이는지 확인하기', '문구만 고치고 예정대로 공개하기', '고객센터와 안내·문의 답변 맞추기', '지금 고칠 것과 나중 고칠 것 나누기']
  },
  {
    title: '공연은 매진, 좌석 글은 계속 올라와요',
    body: '새 공연은 매진이고 만족도도 높아요. 그런데 단골들은 좌석 고르기가 어렵다는 글을 계속 남겨요.',
    options: ['단골에게만 생기는 이유 찾기', '다음 예매 전에 좌석 안내 고치기', '회원에게 어디서 막혔는지 직접 묻기', '매진 성과와 단골 불편 중 뭘 먼저 챙길지 정하기']
  },
  {
    title: '전체 반품은 줄고 한 곳은 늘었어요',
    body: '전체 서점의 반품은 줄었어요. 그런데 거래가 큰 한 곳은 배송이 늦어 반품이 늘었어요.',
    options: ['그 거래처 문제를 지금 다룰지 정하기', '전체 성과와 그 거래처 문제를 따로 보기', '물류사·서점 담당자와 늦은 단계 맞춰보기', '다음 배송은 다른 길로 보내보기']
  },
  {
    title: '연구소가 성공을 먼저 알려왔어요',
    body: '외부 연구소가 실험이 성공했다고 먼저 알려왔어요. 자세한 자료는 다음 주에 와요.',
    options: ['알리기 전에 자세한 자료 확인하기', '확인 중이라고 밝히고 날짜도 알리기', '이 결과로 뭘 정할지 먼저 확인하기', '결과를 바탕으로 다음 실험 준비하기']
  },
  {
    title: '새 장비를 쓴 농장에서 수확이 늘었어요',
    body: '한 농장에서 새 장비를 쓰고 수확이 늘었어요. 현장팀은 모든 농장에 바로 넣자고 해요.',
    options: ['날씨 덕인지 장비 덕인지 확인하기', '환경이 다른 농장에서 먼저 해보기', '비용과 효과 비교해 순서 정하기', '현장팀과 늘릴 기준·멈출 기준 정하기']
  },
  {
    title: '전문가가 안내문 표현을 지적했어요',
    body: '행사 이틀 전, 전문가가 중요한 표현이 부정확하다고 했어요. 종이 안내문은 이미 만들었고, 화면 안내는 지금 바로 바꿀 수 있어요.',
    options: ['크게 오해할 부분부터 골라내기', '화면부터 고치고 종이엔 정정문 끼우기', '전문가에게 꼭 고칠 문장 골라달라 하기', '지적한 문장이 진짜 틀렸는지 원자료와 대조하기']
  },
  {
    title: '예약은 늘고 일정 문의도 늘었어요',
    body: '새 여행 상품은 예약이 잘돼요. 그런데 일정이 빠듯하다는 문의가 계속 늘어요. 취소는 아직 안 늘었어요.',
    options: ['어느 일정에 문의가 몰리는지 찾기', '예약 전에 빠듯하다고 분명히 알리기', '늘어난 예약과 문의 부담 견줘 정하기', '제일 힘든 일정 하나 바꿔 다음 회차 보기']
  },
  {
    title: '전기 사용은 줄고 밤에 경보가 울려요',
    body: '냉난방 설정을 바꾼 뒤 전기는 줄었어요. 그런데 몇 층은 밤마다 온도 경보가 울려요.',
    options: ['어느 층에서 언제 반복되는지 확인하기', '밤에 쓰는 사람이 불편한지 확인하기', '한 층 설정 바꿔 다음 날 보기', '관리자와 몇 도까지 정상인지 정하기']
  },
  {
    title: '참여자는 늘고 마감 문의도 늘었어요',
    body: '경매 화면을 바꾸고 참여자는 늘었어요. 그런데 마감을 잘못 알았다는 문의도 늘었어요.',
    options: ['어느 화면에서 헷갈렸는지 찾기', '마감 시간 더 크게 보이게 고치기', '문의한 사람에게 어떻게 읽었는지 묻기', '참여 성과와 오해 민원 중 뭘 먼저 할지 정하기']
  },
  {
    title: '만족도는 오르고 대체식 대기는 길어졌어요',
    body: '새 식단은 만족도가 높고 남는 음식도 줄었어요. 그런데 알레르기 대체식 줄이 길어졌어요.',
    options: ['대체식 준비에서 느린 곳 찾기', '기다리는 사람 수와 불편 크기 보기', '배식 순서 바꿔 다음 끼니에 해보기', '기다릴 시간 미리 알리고 고르게 하기']
  },
  {
    title: '예약은 많고 재신청은 적어요',
    body: '새 운동 수업은 예약이 많아요. 그런데 다음 달 재신청은 적고 실력 차이도 커요.',
    options: ['초보와 숙련자가 언제 그만두는지 보기', '수업 전에 난이도와 준비물 알리기', '실력별 수업 작게 열어 보기', '예약과 재신청 중 뭐가 중요한지 정하기']
  },
  {
    title: '전체 대기는 줄고 오전만 길어졌어요',
    body: '접수 방식을 바꾼 뒤 전체 대기는 줄었어요. 그런데 오전 첫 시간대만 유독 길다는 민원이 이어져요.',
    options: ['어느 시간대·진료과만 긴지 확인하기', '민원 수와 진료 지연 중 급한 쪽 정하기', '한 진료과 순서를 바꿔 내일 보기', '접수·간호팀에 뭐가 막히는지 묻기']
  },
  {
    title: '신메뉴 매출은 늘고 준비 시간도 늘었어요',
    body: '신메뉴 매출은 목표를 넘겼어요. 그런데 점주들은 준비가 오래 걸려 다른 주문이 밀린대요.',
    options: ['어느 공정이 오래 걸리는지 보기', '매출과 밀린 주문 손해를 견주기', '한 매장에서 순서 바꿔 재보기', '점주들과 어떤 메뉴를 줄일지 정하기']
  },
  {
    title: '접속자는 늘고 사흘째 복귀는 줄었어요',
    body: '새 시즌을 열고 접속자는 늘었어요. 그런데 사흘째 이후 돌아오지 않는 사람이 많아졌어요.',
    options: ['어디까지 하고 멈췄는지 나눠 보기', '이번 시즌에 뭘 성공으로 볼지 정하기', '난이도 낮춘 판을 일부에게 열기', '기획·운영팀과 난이도를 어디까지 할지 정하기']
  },
  {
    title: '전체 민원은 줄고 한 동은 다툼이 있어요',
    body: '주차 구역을 다시 나눈 뒤 전체 민원은 줄었어요. 그런데 한 동만 밤마다 자리 다툼이 생겨요.',
    options: ['그 동만 다른 조건이 뭔지 대조하기', '피해 세대 수와 반복 횟수로 순서 정하기', '임시 구획 긋고 한 주 지켜보기', '입주민 대표와 규칙 함께 정하기']
  },
  {
    title: '신청은 마감되고 참석은 절반이에요',
    body: '주말 강좌는 열자마자 마감돼요. 그런데 실제로 오는 사람은 절반쯤이에요.',
    options: ['안 온 사람들의 공통점 찾기', '빈자리 손해와 대기 불만 견주기', '대기자 승계 넣고 참석률 보기', '강사와 정원 수와 취소 마감일 정하기']
  },
  {
    title: '수리한 차가 두 주 안에 다시 왔어요',
    body: '수리한 차가 두 주 안에 같은 증상으로 다시 와요. 기록에는 정상 처리로 남아 있어요.',
    options: ['다시 온 차들의 공통점 찾기', '재작업 비용과 예약 손실 견주기', '의심 부품 바꾼 차를 표시해 보기', '정비사와 어디까지가 수리 완료인지 정하기']
  },
  {
    title: '클릭은 40% 늘고 구매는 그대로예요',
    body: '광고 문구를 바꾸고 클릭이 40% 늘었어요. 그런데 구매 수는 거의 그대로예요.',
    options: ['클릭한 사람이 어디서 멈추는지 보기', '광고비 대비 구매로 계속할지 정하기', '도착 화면 문구를 맞춰 비교하기', '마케팅·상품팀이 볼 숫자를 하나로 정하기']
  },
  {
    title: '접수는 두 배, 인력은 그대로예요',
    body: '온라인 접수를 열자 민원이 두 배가 됐어요. 인력은 그대로라 기한을 넘기는 건이 쌓여요.',
    options: ['밀리는 민원이 어떤 종류인지 갈라 보기', '기한 넘길 때 피해 큰 순서로 정하기', '자주 오는 문의는 자동 답변 돌리기', '어느 민원까지 우리가 맡을지 정하기']
  }
];

// 짧은 코스: 선택지 4개를 모두 남긴다. 긴 코스는 매번 하나를 빼지만(omittedOptionIndex),
// 12문항으로 모드 순서를 가르려면 문항마다 F·A·B·L 네 방향이 다 열려 있어야 한다.
// 아래 인덱스는 각 선택지의 지배 모드를 계산해 고른 것이다 — 앞의 9개는 네 모드를 모두
// 가르고, 뒤의 3개는 세 모드를 가른다. 나머지 4개는 두세 모드로 쏠려 제외했다.
const SHORT_SCENARIO_INDEXES = [0, 2, 3, 8, 9, 11, 12, 13, 14, 1, 4, 6];

const scenarios = scenarioBlueprints.map((scenario, index) => {
  const omittedOptionIndex = index % 4;
  return {
    ...scenario,
    imageIndex: index,
    title: plainScenarioCopy[index].title,
    body: plainScenarioCopy[index].body,
    options: scenario.options
      .map((option, optionIndex) => ({ ...option, text: plainScenarioCopy[index].options[optionIndex] }))
      .filter((_, optionIndex) => optionIndex !== omittedOptionIndex)
  };
});

// 짧은 코스 후보. 예전에는 아래 12개를 고정으로 냈는데, 두세 번만 풀어도 문항을 외운다.
// 이제 후보 전체에서 매번 12개를 뽑고, 직전 회차에 나온 문항은 뒤로 미룬다.
const SHORT_QUESTION_COUNT = 12;
const SEEN_KEY = 'fabl-seen-scenarios';

function buildScenario(index) {
  return {
    ...scenarioBlueprints[index],
    imageIndex: index,
    title: plainScenarioCopy[index].title,
    body: plainScenarioCopy[index].body,
    options: scenarioBlueprints[index].options.map((option, optionIndex) => ({
      ...option,
      text: plainScenarioCopy[index].options[optionIndex]
    }))
  };
}

function loadSeenScenarios() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || []; } catch { return []; }
}

function saveSeenScenarios(indexes) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(indexes)); } catch { /* 저장 불가여도 진행한다 */ }
}

/** 이번 회차에 낼 문항 12개. 직전에 낸 문항은 후순위로 밀어 겹침을 줄인다. */
function pickShortScenarioSet() {
  const seen = new Set(loadSeenScenarios());
  const all = scenarioBlueprints.map((_, index) => index);
  const fresh = shuffleValues(all.filter(index => !seen.has(index)));
  const rest = shuffleValues(all.filter(index => seen.has(index)));
  const picked = [...fresh, ...rest].slice(0, SHORT_QUESTION_COUNT);
  saveSeenScenarios(picked);
  return picked;
}

function shuffleValues(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const shortScenarios = SHORT_SCENARIO_INDEXES.map(index => ({
  ...scenarioBlueprints[index],
  imageIndex: index,
  title: plainScenarioCopy[index].title,
  body: plainScenarioCopy[index].body,
  options: scenarioBlueprints[index].options.map((option, optionIndex) => ({
    ...option,
    text: plainScenarioCopy[index].options[optionIndex]
  }))
}));

// 지금 진행 중인 코스의 문항 목록. 짧은 코스와 긴 코스가 같은 채점을 쓰게 하는 지점이다.
function activeScenarios() {
  if (!state || state.course !== 'short') return scenarios;
  const set = state.scenarioSet;
  return Array.isArray(set) && set.length ? set.map(buildScenario) : shortScenarios;
}

const deepScenarios = [
  {
    domain: '문서 찾기', title: '대부분은 빠른데 일부는 계속 느리다',
    opening: '검색은 거의 항상 0.5초 안에 끝난다는 보고가 나왔다. 그런데 일부 이용자는 검색할 때마다 오래 기다린다고 말한다.',
    turns: [
      '가장 먼저 무엇을 물어보겠습니까?',
      '담당자는 “느린 경우는 0.5%뿐이라 더 살펴볼 필요가 없다”고 말합니다. 무엇을 확인해달라고 하겠습니까?',
      '자주 쓰는 이용자 100명은 검색할 때마다 5초 이상 기다린다는 사실을 찾았습니다. 이제 무엇을 먼저 하겠습니까?'
    ]
  },
  {
    domain: '정기 배송', title: '전체 배송은 좋아졌지만 해외에서 막힌다',
    opening: '주소 입력 화면을 바꾼 뒤 전체 배송 성공률은 올랐다. 하지만 해외 고객의 주소 문의가 늘었고 새 나라 출시는 사흘 뒤다.',
    turns: [
      '회의에서 무엇을 가장 먼저 확인하겠습니까?',
      '책임자는 “전체 결과는 좋아졌고 출시일도 바꿀 수 없다”고 말합니다. 어떻게 하자고 제안하겠습니까?',
      '새 화면이 해외 고객이 자주 쓰는 주소 형식을 받지 못한다는 사실을 찾았습니다. 다음 행동을 말해주세요.'
    ]
  },
  {
    domain: '축제 운영', title: '내 의견과 다른 입장 길이 정해졌다',
    opening: '축제 입구로 쓰려는 길이 두 개다. 나는 조금 돌아가더라도 넓은 길이 안전하다고 보지만 책임자는 준비가 쉬운 짧은 길로 결정했다.',
    turns: [
      '결정 직후 무엇을 말하고 행동하겠습니까?',
      '책임자는 더 이야기하지 말고 준비를 시작해달라고 합니다. 걱정이 남는다면 어떻게 하겠습니까?',
      '미리 시험해보니 사람이 몰리는 시간에는 입구가 막힐 수 있었습니다. 계획을 어떻게 바꾸겠습니까?'
    ]
  },
  {
    domain: '공유 주방', title: '주문을 자동으로 나누는 방법을 발견했다',
    opening: '다른 주방이 주문을 빈 조리대에 자동으로 보내는 방법을 쓰고 있다. 우리도 쓸 수 있어 보이지만 해본 사람은 없고 지금 방식도 큰 문제는 없다.',
    turns: [
      '이 방법을 발견한 뒤 가장 먼저 무엇을 하겠습니까?',
      '동료는 “될지 모르는 일에 시간을 쓰기 어렵다”고 말합니다. 시험할지 말지 어떻게 정하겠습니까?',
      '작게 시험하니 전체 준비시간은 줄었지만 한 조리대에만 일이 몰렸습니다. 결과를 어떻게 보고 무엇을 하겠습니까?'
    ]
  }
];

const chatScenarios = [
  ...scenarios.map(scenario => ({
    domain: scenario.domain,
    title: scenario.title,
    opening: scenario.body,
    turns: ['이 상황에서 가장 먼저 어떤 질문을 하거나 행동을 취하겠습니까?']
  })),
  ...deepScenarios
];

const STORAGE_KEY = 'iljaller-assessment-session-v1';
const ARCHIVE_KEY = 'iljaller-assessment-archives-v1';

function createState() {
  return { screen: 'intro', course: 'short', scenarioSet: null, current: 0, answers: [], lastAnswers: [], keyedAnswers: [], keyedOrders: [], keyedSet: null, keyedSequence: [], keyedCurrent: 0, optionOrders: [], scenarioOrder: [], scenarioStartedAt: [], assessmentStartedAt: null, completedAt: null, assessmentDurationMs: null, deepCurrent: 0, deepTurn: 0, deepAnswers: [], chatSignals: [], awaitingNext: false, pendingChoice: null };
}

function createSampleState() {
  const sample = createState();
  sample.screen = 'result';
  sample.answers = scenarios.slice(0, 16).map((scenario, index) => (index * 3 + 1) % scenario.options.length);
  sample.chatSignals = [
    { scenario: '대부분 빠른 검색 서비스', scores: { sensemaking: 3, validation: 3, impact: 2 }, text: '샘플 응답' },
    { scenario: '성공적으로 끝난 주소 개편', scores: { priority: 3, collaboration: 2, delivery: 2 }, text: '샘플 응답' },
    { scenario: '결정된 입장 동선', scores: { recalibration: 3, alignment: 3, validation: 2 }, text: '샘플 응답' },
    { scenario: '처음 도입하는 자동 배정', scores: { pioneering: 3, focus: 2, delivery: 3 }, text: '샘플 응답' }
  ];
  return sample;
}

function loadState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return saved && ['intro', 'test', 'chat', 'result'].includes(saved.screen) ? { ...createState(), ...saved } : createState();
  } catch {
    return createState();
  }
}

function saveState() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadArchives() {
  try {
    const archives = JSON.parse(localStorage.getItem(ARCHIVE_KEY));
    return Array.isArray(archives) ? archives : [];
  } catch {
    return [];
  }
}

function archiveCurrentResult() {
  if (state.isExample) return;
  if (!state.resultId) state.resultId = crypto.randomUUID?.() || `result-${Date.now()}`;
  if (!state.completedAt) state.completedAt = new Date().toISOString();
  if (!state.assessmentDurationMs && state.assessmentStartedAt) {
    state.assessmentDurationMs = Math.max(0, new Date(state.completedAt).getTime() - new Date(state.assessmentStartedAt).getTime());
  }
  const archives = loadArchives();
  const snapshot = JSON.parse(JSON.stringify(state));
  const existing = archives.findIndex(item => item.resultId === state.resultId);
  if (existing >= 0) archives[existing] = snapshot;
  else archives.unshift(snapshot);
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives.slice(0, 30)));
  saveState();
}

function downloadCurrentResult() {
  const payload = {
    format: 'iljaller-result-v1',
    exportedAt: new Date().toISOString(),
    state,
    scores: calculate()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `일잘러-테스트-${state.completedAt?.slice(0, 10) || '결과'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function restoreResultFile(file) {
  const payload = JSON.parse(await file.text());
  const restored = payload?.format === 'iljaller-result-v1' ? payload.state : payload;
  if (!restored || restored.screen !== 'result' || !Array.isArray(restored.chatSignals)) throw new Error('invalid_result_file');
  state = { ...createState(), ...restored, screen: 'result' };
  render();
}

const sampleRequested = new URLSearchParams(location.search).has('sample');
let state = sampleRequested ? createSampleState() : loadState();
if (sampleRequested) history.replaceState(null, '', location.pathname);
// 받침에 따라 '을/를'을 붙인다. '문제수렴력를' 같은 문장이 나오던 자리다.
function withObjectParticle(word) {
  const last = word.charCodeAt(word.length - 1);
  const hasFinal = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return `${word}${hasFinal ? '을' : '를'}`;
}

const app = document.querySelector('#app');

// 바닐라 화면은 셸 안의 고정 노드(screenHost)에 그려진다. 그 노드는 React 가
// 슬롯에 붙이기 전까지 문서에 없어서, document.querySelector 로 찾으면 null 이
// 나오고 핸들러가 하나도 안 붙는다(실제로 '다음' 버튼이 죽었다).
// 화면 안 요소는 호스트에서 먼저 찾고, body 에 붙는 것(확인 모달 등)만 문서로 넘어간다.
const pick = selector => screenHost().querySelector(selector) || document.querySelector(selector);
const pickAll = selector => {
  const inHost = screenHost().querySelectorAll(selector);
  return inHost.length ? inHost : document.querySelectorAll(selector);
};
let quickTimerId;

function shuffledIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  return indexes;
}

// 긴 코스에 낼 상황 20개. 객관식·하이브리드 16개를 24개 후보에서 뽑고, 서술형 4개는 항상 낸다.
function pickChatOrder() {
  const quickPool = shuffleValues(scenarios.map((_, index) => index)).slice(0, 16);
  const deepIndexes = deepScenarios.map((_, index) => scenarios.length + index);
  return [...quickPool, ...deepIndexes];
}

function beginTest(course = 'short') {
  const scenarioSet = course === 'short' ? pickShortScenarioSet() : null;
  const list = course === 'short' ? scenarioSet.map(buildScenario) : scenarios;
  const chatOrder = course === 'short' ? [] : pickChatOrder();
  state = {
    // 짧은 코스는 순수 객관식('test')이라 서술형·대화 단계를 거치지 않는다.
    screen: course === 'short' ? 'test' : 'chat',
    course,
    scenarioSet,
    current: 0,
    answers: [],
    lastAnswers: [],
    optionOrders: list.map(scenario => shuffledIndexes(scenario.options.length)),
    scenarioOrder: course === 'short' ? shuffledIndexes(list.length) : chatOrder,
    scenarioStartedAt: [],
    // 긴 코스는 역량 체크까지 이어지므로 여기서 같이 초기화한다.
    keyedAnswers: [],
    keyedCurrent: 0,
    keyedOrders: [],
    keyedSet: null,
    keyedSequence: [],
    assessmentStartedAt: new Date().toISOString(),
    completedAt: null,
    assessmentDurationMs: null,
    deepCurrent: 0,
    deepTurn: 0,
    deepAnswers: [],
    chatSignals: [],
    awaitingNext: false,
    pendingChoice: null,
    pendingWorst: null
  };
  render();
}

// 공유 링크(/t/CODE/)로 들어온 방문자 화면.
// 답변이 없으면 점수를 지어내지 않는다. 유형 카드만 보여주고 직접 해보게 한다.
function renderSharedType(code) {
  const modeByKey = Object.fromEntries(workModes.map(mode => [mode.key, mode]));
  const order = [...code].map(letter => modeByKey[letter]);
  screenHost().innerHTML = `<main class="intro landing shared-type">
    <nav class="landing-nav"><div class="brand">FABL TEST</div><a href="/">테스트 하기</a></nav>
    <section class="hero landing-hero"><div>
      <p class="eyebrow">SHARED RESULT · ${code}</p>
      <h1>${workTypeNames[code]}형<br><em>${workTypePeople[code]}</em> 아키타입</h1>
      <p class="lead">${workTypeReasons[code]}</p>
      <p class="lead">먼저 <b>${order[0].plain}</b>, 그다음 <b>${order[1].plain}</b>, 마지막에 <b>${order[2].plain}</b>.</p>
      <div class="hero-actions"><button class="primary" id="startShared">나도 테스트 하기 <b>→</b></button></div>
      <p class="meta">12개 상황 · 약 2~3분</p>
    </div>
    <figure class="shared-portrait">
      <img src="/people/${code}.jpg" alt="${workTypePeople[code]} 초상">
      <figcaption>${code} · ${workTypeNames[code]}형</figcaption>
    </figure></section>
    <footer class="landing-footer"><b>FABL TEST</b><span>FRAME · AIM · BUILD · LINK</span></footer>
  </main>`;
  pick('#startShared').onclick = () => { history.replaceState(null, '', '/'); beginTest('short'); };
}

// 역량 체크 화면. 유형 문항과 달리 정답이 있고, 정답 위치는 매번 섞는다.
function renderKeyed() {
  // 문항 순서도 매번 섞는다(state.keyedSequence). 답은 원본 문항 위치에 저장해야
  // scoreKeyed 의 정답 대조가 그대로 맞는다.
  const itemIndex = (state.keyedSequence || [])[state.keyedCurrent] ?? state.keyedCurrent;
  const item = keyedItems[itemIndex];
  const order = state.keyedOrders[itemIndex];
  const total = keyedTotal();
  const progress = ((state.keyedCurrent + 1) / total) * 100;
  const picked = state.keyedAnswers[itemIndex];
  const last = state.keyedCurrent === total - 1;
  // 업무 용어를 모르면 문항 자체를 못 푼다. 남겨야 하는 말만 아래에 뜻을 붙인다.
  const terms = item.terms
    ? `<dl class="term-note">${item.terms.map(term => `<div><dt>${term.word}</dt><dd>${term.meaning}</dd></div>`).join('')}</dl>`
    : '';
  const picture = `<div class="scenario-visual"><figure class="scenario-image"><img src="/keyed/keyed-${String(itemIndex + 1).padStart(2, '0')}.jpg" alt="" loading="lazy"></figure></div>`;
  screenHost().innerHTML = `<main class="test-shell"><header class="test-head"><button class="home-button" id="backToResult"><b>←</b><span>${state.answers.length ? '결과로' : '나가기'}</span></button><strong>역량 체크</strong><span>${state.keyedCurrent + 1} / ${total}</span></header><div class="progress"><i style="width:${progress}%"></i></div><section class="question">${picture}<p class="domain">역량 · ${qualityDimensionNames[item.dimension]}</p><h2>${item.question}</h2><p class="situation">${item.situation}</p>${terms}<div class="options">${order.map((optionIndex, displayIndex) => `<button class="option${picked === optionIndex ? ' selected' : ''}" data-index="${optionIndex}" aria-pressed="${picked === optionIndex}"><span>${String.fromCharCode(65 + displayIndex)}</span><p>${item.options[optionIndex]}</p></button>`).join('')}</div><p class="hint">이 문제는 정답이 있어요. 가장 맞다고 보는 하나를 고르세요.</p><nav class="q-nav"><button class="ghost" id="prevQ"${state.keyedCurrent === 0 ? ' disabled' : ''}>← 이전</button><button class="primary" id="nextQ"${picked === undefined ? ' disabled' : ''}>${last ? '채점 보기' : '다음 →'}</button></nav></section></main>`;
  // 유형 테스트를 거치지 않고 시작한 역량 체크는 돌아갈 결과 화면이 없다.
  pick('#backToResult').onclick = () => { state.screen = state.answers.length ? 'result' : 'intro'; render(); };
  scrollToQuestionTop();

  const nextButton = pick('#nextQ');
  pickAll('.option').forEach(btn => btn.onclick = () => {
    const optionIndex = Number(btn.dataset.index);
    state.keyedAnswers[itemIndex] = optionIndex;
    pickAll('.option').forEach(other => {
      const on = Number(other.dataset.index) === optionIndex;
      other.classList.toggle('selected', on);
      other.setAttribute('aria-pressed', String(on));
    });
    nextButton.disabled = false;
    saveState();
  });
  pick('#prevQ').onclick = () => {
    if (state.keyedCurrent === 0) return;
    state.keyedCurrent -= 1;
    render();
  };
  nextButton.onclick = () => {
    if (state.keyedAnswers[itemIndex] === undefined) return;
    if (state.keyedCurrent < total - 1) state.keyedCurrent += 1;
    else state.screen = state.answers.length ? 'result' : 'keyedResult';
    render();
  };
}

// 유형 테스트 없이 역량 체크만 한 경우의 결과. 유형 결과 화면은 유형 답변을 전제한다.
function renderKeyedOnly() {
  screenHost().innerHTML = `<main class="result-shell"><header class="result-head"><div><p class="eyebrow">역량 체크</p><h1>정답으로 매긴<br>역량 점수예요.</h1></div><button class="ghost" id="toIntro">처음으로</button></header>${renderKeyedPanel()}<section class="keyed-panel keyed-invite"><div><p class="eyebrow">평가 1 · 유형 찾기</p><h2>일하는 순서도 볼까요?</h2><p>역량 체크는 맞고 틀림만 봐요. 무엇부터 하는 사람인지는 유형 찾기 12문항에서 나와요.</p></div><button class="primary" id="toType">유형 테스트 하기 <b>→</b></button></section><footer>낮은 점수는 능력 부족을 뜻하지 않으며, 채용·인사평가의 단독 근거로 사용하지 마세요.</footer></main>`;
  pick('#toIntro').onclick = () => { state.screen = 'intro'; render(); };
  pick('#toType').onclick = () => beginTest('short');
  const retryKeyed = pick('#retryKeyed');
  if (retryKeyed) retryKeyed.onclick = beginKeyed;
}

// 역량 문항도 매번 뽑는다. 후보에서 KEYED_QUESTION_COUNT 개를 내고, 직전에 낸 문항은 뒤로 미룬다.
const KEYED_SEEN_KEY = 'fabl-seen-keyed';

function pickKeyedSet() {
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(KEYED_SEEN_KEY)) || []; } catch { seen = []; }
  const seenSet = new Set(seen);
  // 단순 무작위로 뽑으면 어떤 차원이 2문항만 나오는 회차가 생긴다(6문항 풀 기준 7.6%).
  // 2문항짜리 차원은 찍기로도 만점이 떠서 차원 점수가 의미를 잃는다. 차원마다 같은 수를 낸다.
  const byDimension = new Map();
  keyedItems.forEach((item, index) => {
    if (!byDimension.has(item.dimension)) byDimension.set(item.dimension, []);
    byDimension.get(item.dimension).push(index);
  });
  const order = shuffleValues([...byDimension.keys()]);
  const perDimension = Math.floor(KEYED_QUESTION_COUNT / order.length);
  const picked = [];
  const leftover = [];
  order.forEach(dimension => {
    const indexes = byDimension.get(dimension);
    const fresh = shuffleValues(indexes.filter(index => !seenSet.has(index)));
    const rest = shuffleValues(indexes.filter(index => seenSet.has(index)));
    const sorted = [...fresh, ...rest];
    picked.push(...sorted.slice(0, perDimension));
    leftover.push(...sorted.slice(perDimension));
  });
  picked.push(...leftover.slice(0, Math.max(0, KEYED_QUESTION_COUNT - picked.length)));
  try { localStorage.setItem(KEYED_SEEN_KEY, JSON.stringify(picked)); } catch { /* 저장 못 해도 진행 */ }
  return picked;
}

/** 이번 회차에 답한 문항 수. 배열이 듬성듬성 차므로 length 로는 셀 수 없다. */
function keyedAnsweredCount() {
  const answers = state.keyedAnswers || [];
  const asked = state.keyedSet || keyedItems.map((_, index) => index);
  return asked.filter(index => answers[index] !== undefined).length;
}

function keyedTotal() {
  return (state.keyedSet || []).length || Math.min(KEYED_QUESTION_COUNT, keyedItems.length);
}

function beginKeyed() {
  state.keyedAnswers = [];
  state.keyedCurrent = 0;
  state.keyedOrders = keyedItems.map(item => shuffledIndexes(item.options.length));
  state.keyedSet = pickKeyedSet();
  state.keyedSequence = shuffleValues(state.keyedSet);
  state.screen = 'keyed';
  render();
}

// 결과 화면 안의 역량 체크 영역. 아직 안 했으면 권유, 했으면 채점 결과.
function renderKeyedPanel() {
  const done = state.keyedSet && keyedAnsweredCount() === state.keyedSet.length;
  if (!done) {
    return `<section class="keyed-panel keyed-invite"><div><p class="eyebrow">역량 체크 · ${KEYED_QUESTION_COUNT}문항</p><h2>여기까지는 &lsquo;무엇부터 하는가&rsquo;였어요</h2><p>유형은 자주 쓰는 순서만 봐요. 선택지가 다 가능한 대응이라 틀린 답이 없거든요. 정답이 있는 ${KEYED_QUESTION_COUNT}문항은 따로 있어요. 몇 개 맞혔는지, 어디서 놓쳤는지 보여드려요.</p></div><button class="primary" id="startKeyed">역량 체크 하기 <b>→</b></button></section>`;
  }
  const scored = scoreKeyed(state.keyedAnswers, state.keyedSet);
  const dims = Object.entries(scored.byDimension)
    .map(([key, v]) => `<div class="keyed-dim${v.correct === v.total ? ' ok' : ''}"><b>${qualityDimensionNames[key]}</b><span>${v.correct} / ${v.total}</span></div>`).join('');
  const missed = scored.missed.length
    ? scored.missed.map(({ item, index }) => `<details class="keyed-miss"><summary><b>${qualityDimensionNames[item.dimension]}</b> ${item.question}</summary><p class="keyed-chose">내가 고른 답 · ${item.options[state.keyedAnswers[index]]}</p><p class="keyed-answer">더 맞는 답 · ${item.options[item.correct]}</p><p class="keyed-why">${item.principle}</p></details>`).join('')
    : `<p class="keyed-allok">${scored.total}문항 모두 맞게 골랐어요.</p>`;
  return `<section class="keyed-panel"><div class="keyed-head"><div><p class="eyebrow">역량 체크</p><h2>역량 체크 <em>${scored.correct} / ${scored.total}</em></h2><p>유형과 달리 여기엔 정답이 있어요. 다만 문항을 매번 다르게 뽑아 내니 사람마다 받는 문제가 달라요. 점수로 사람을 줄 세우지는 마세요.</p></div><button class="ghost" id="retryKeyed">다시 풀기</button></div><div class="keyed-dims">${dims}</div>${missed}</section>`;
}

function render() {
  clearInterval(quickTimerId);
  saveState();
  if (state.screen === 'intro') { renderIntro(); return; }
  // 진행·결과 화면도 같은 셸 안에서 그린다. 셸은 유지하고 내용만 바꾼다.
  mountShell(app, { mode: 'screen' });
  if (state.screen === 'test') renderQuestion();
  else if (state.screen === 'chat') renderChat();
  else if (state.screen === 'keyed') renderKeyed();
  else if (state.screen === 'keyedResult') renderKeyedOnly();
  else renderResult();
}

// 랜딩에서 마지막으로 보던 탭. 역량 체크만 하고 돌아오면 그 탭으로 되돌린다.
let introTab = 'home';

function renderIntro() {
  const archives = loadArchives();
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json';
  fileInput.onchange = async () => {
    try { await restoreResultFile(fileInput.files[0]); }
    catch { alert('FABL 테스트 결과 파일을 확인해주세요.'); }
  };
  // 랜딩만 @m1kapp/kit 앱셸(React)로 그린다. 나머지 화면은 기존 바닐라 렌더다.
  mountShell(app, {
    mode: 'landing',
    archiveCount: archives.length,
    initialTab: introTab,
    on: {
      start: course => { introTab = 'test'; beginTest(course); },
      startKeyed: () => { introTab = 'test'; beginKeyed(); },
      latest: () => { state = { ...createState(), ...archives[0], screen: 'result' }; render(); },
      importResult: () => fileInput.click()
    }
  });
}

// 문항이 바뀔 때 화면을 맨 위로 올린다. innerHTML 만 교체하면 스크롤 위치가
// 그대로 남아, 아래쪽 보기를 누른 사람은 다음 문항의 진행바와 상황 이미지를
// 지나친 자리에서 보게 된다.
function scrollToQuestionTop() {
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.scrollingElement && (document.scrollingElement.scrollTop = 0);
  // 실제로 스크롤되는 건 셸 콘텐츠다. 문항이 바뀌면 여기도 최상단으로.
  const scroller = shellScroller();
  if (scroller) scroller.scrollTop = 0;
}

// 문항을 보여줄 순서. 매번 같은 순서로 나오지 않게 코스 시작 때 섞는다(state.scenarioOrder).
// 답은 화면 순서가 아니라 원본 시나리오 위치에 저장한다 — 그래야 채점과 공유 링크가
// 순서에 영향받지 않는다.
function questionIndexAt(step) {
  const order = state.scenarioOrder || [];
  return order[step] ?? step;
}

// 한 문항에서 '제일 먼저'와 '제일 나중'을 둘 다 받는다. 하나만 받으면 12문항으로는
// 네 모드의 순서가 잘 안 갈린다. 채점 코드를 그대로 돌린 모의 실험에서 같은 성향을
// 가정했을 때 세 글자 코드가 재현되는 비율이 30.6% → 42.6% 로 올랐다.
function optionMark(optionIndex, best, worst) {
  if (best === optionIndex) return { className: ' selected', badge: '먼저' };
  if (worst === optionIndex) return { className: ' dropped', badge: '나중' };
  return { className: '', badge: '' };
}

function pickHint(best, worst) {
  if (best === undefined) return '정답은 없어요. 제일 <b>먼저</b> 할 것 같은 하나를 고르세요.';
  if (worst === undefined) return '이번엔 제일 <b>나중</b>에 할 것 같은 하나를 고르세요.';
  return '다시 누르면 바꿀 수 있어요.';
}

function renderQuestion() {
  const list = activeScenarios();
  const index = questionIndexAt(state.current);
  const q = list[index];
  const order = state.optionOrders[index] || q.options.map((_, optionIndex) => optionIndex);
  // 짧은 코스는 객관식만으로 끝나므로 총계에 대화 단계를 더하지 않는다.
  const total = state.course === 'short' ? list.length : list.length + deepScenarios.length;
  const progress = ((state.current + 1) / total) * 100;
  if (!state.lastAnswers) state.lastAnswers = [];
  const picked = state.answers[index];
  const dropped = state.lastAnswers[index];
  const last = state.current === list.length - 1;

  screenHost().innerHTML = `<main class="test-shell"><header class="test-head"><button class="home-button" id="home"><b>←</b><span>처음으로</span></button><strong>FABL 테스트</strong><span>${state.current + 1} / ${total}</span></header><div class="progress"><i style="width:${progress}%"></i></div><section class="question"><div class="scenario-visual">${renderMotionGraphic(q.imageIndex)}</div><p class="domain">상황 · ${q.domain}</p><h2>${q.title}</h2><p class="situation">${q.body}</p><div class="options">${order.map((optionIndex, displayIndex) => `<button class="option${optionMark(optionIndex, picked, dropped).className}" data-index="${optionIndex}" data-letter="${String.fromCharCode(65 + displayIndex)}" aria-pressed="${picked === optionIndex}"><span>${optionMark(optionIndex, picked, dropped).badge || String.fromCharCode(65 + displayIndex)}</span><p>${q.options[optionIndex].text}</p></button>`).join('')}</div><p class="hint" id="pickHint">${pickHint(picked, dropped)}</p><nav class="q-nav"><button class="ghost" id="prevQ"${state.current === 0 ? ' disabled' : ''}>← 이전</button><button class="primary" id="nextQ"${picked === undefined || dropped === undefined ? ' disabled' : ''}>${last ? '결과 보기' : '다음 →'}</button></nav></section></main>`;

  pick('#home').onclick = goHome;

  const nextButton = pick('#nextQ');
  // 누르는 즉시 넘어가지 않는다. 고른 뒤 확인하고 '다음'을 눌러야 진행된다.
  // 여기서 다시 그리지 않는 이유는 스크롤이 튀지 않게 하기 위해서다.
  const paint = () => {
    const best = state.answers[index];
    const worst = state.lastAnswers[index];
    pickAll('.option').forEach(other => {
      const optionIndex = Number(other.dataset.index);
      const mark = optionMark(optionIndex, best, worst);
      other.className = 'option' + mark.className;
      other.querySelector('span').textContent = mark.badge || other.dataset.letter;
      other.setAttribute('aria-pressed', String(best === optionIndex));
    });
    pick('#pickHint').innerHTML = pickHint(best, worst);
    nextButton.disabled = best === undefined || worst === undefined;
    saveState();
  };
  pickAll('.option').forEach(btn => btn.onclick = () => {
    const optionIndex = Number(btn.dataset.index);
    if (state.answers[index] === optionIndex) delete state.answers[index];
    else if (state.lastAnswers[index] === optionIndex) delete state.lastAnswers[index];
    else if (state.answers[index] === undefined) state.answers[index] = optionIndex;
    else state.lastAnswers[index] = optionIndex;
    paint();
  });

  pick('#prevQ').onclick = () => {
    if (state.current === 0) return;
    state.current -= 1;
    render();
  };
  nextButton.onclick = () => {
    if (state.answers[index] === undefined || state.lastAnswers[index] === undefined) return;
    advance();
  };
  scrollToQuestionTop();
}

// 마지막 문항에서는 결과로, 아니면 다음 문항으로.
function advance() {
  const list = activeScenarios();
  if (state.current < list.length - 1) state.current += 1;
  else if (state.course === 'short') { state.completedAt = new Date().toISOString(); state.screen = 'result'; }
  else state.screen = 'chat';
  render();
}


const signalRules = {
  sensemaking: [/집단|구간|조건|패턴|맥락|나눠|분리|상위|공통|왜/],
  validation: [/데이터|수치|재현|검증|확인|비교|대조|측정|로그|근거/],
  focus: [/현재|우선|먼저|범위|분리|핵심|지금/],
  priority: [/영향|비용|위험|우선|중요|고객군|빈도|순서/],
  impact: [/고객|이용자|불편|해결|안내|성과|사용|체감/],
  delivery: [/담당|기한|완료|수정|배포|실행|조치|재시험|닫/],
  pioneering: [/실험|시험|가설|작게|새로운|시도|대안|프로토타입/],
  alignment: [/질문|공유|합의|설명|기준|의도|의견|소통/],
  collaboration: [/함께|담당자|팀|협의|역할|요청|현장|책임자/],
  recalibration: [/결정|따르|갱신|재검토|바꾸|피드백|관찰|조건부/]
};

function analyzeText(text) {
  const found = {};
  Object.entries(signalRules).forEach(([key, rules]) => {
    const hits = rules.filter(rule => rule.test(text)).length;
    if (hits) found[key] = Math.min(3, hits);
  });
  return found;
}

function escapeHtml(text) {
  return text.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function adaptiveLead(answer) {
  const signals = analyzeText(answer);
  const strongest = Object.entries(signals).sort((a, b) => b[1] - a[1])[0]?.[0];
  const reactions = {
    sensemaking: '조건을 나누어 보려는 접근이군요.',
    validation: '근거를 먼저 확인하려는 접근이군요.',
    focus: '현재 문제의 범위를 좁히려는 접근이군요.',
    priority: '영향과 순서를 먼저 판단하려는 접근이군요.',
    impact: '이용자의 실제 불편을 먼저 보려는 접근이군요.',
    delivery: '구체적인 조치로 닫으려는 접근이군요.',
    pioneering: '작은 실험으로 길을 찾으려는 접근이군요.',
    alignment: '기준과 의도를 맞추려는 접근이군요.',
    collaboration: '관계자와 함께 움직이려는 접근이군요.',
    recalibration: '새 정보에 따라 판단을 갱신하려는 접근이군요.'
  };
  return reactions[strongest] || '말씀하신 접근을 전제로 조건을 하나 더 드리겠습니다.';
}

function compactScenario(text) {
  const parts = text.split(/(?<=\.)\s+/);
  if (parts.length < 2) return `<p>${text}</p>`;
  return `<p class="scenario-core">${parts[0]}</p><p class="scenario-context">${parts.slice(1).join(' ')}</p>`;
}

function renderMotionGraphic(index) {
  const number = String(index + 1).padStart(2, '0');
  return `<figure class="scenario-image"><img src="/scenarios/scenario-${number}.jpg" alt="${scenarioImageAlts[index]}"${index === 0 ? '' : ' loading="lazy"'}></figure>`;
}

/** 긴 코스에서 지금 낼 상황의 원본 인덱스와 총 상황 수. */
function chatTotal() {
  return (state.scenarioOrder || []).length || chatScenarios.length;
}

function renderChat() {
  const scenarioIndex = state.scenarioOrder[state.deepCurrent] ?? state.deepCurrent;
  const q = chatScenarios[scenarioIndex];
  const mode = state.deepCurrent < 8 ? 'quick' : state.deepCurrent < chatTotal() - deepScenarios.length ? 'hybrid' : 'deep';
  const totalIndex = state.deepCurrent + 1;
  const history = state.deepAnswers[scenarioIndex] || [];
  const messages = [`<div class="scenario-visual">${renderMotionGraphic(scenarioIndex, q.domain)}</div><article class="bubble interviewer scenario-bubble"><small>상황</small>${compactScenario(q.opening)}</article>`];
  history.forEach((answer, index) => {
    messages.push(`<article class="bubble interviewer"><small>진행</small><p>${q.turns[index]}</p></article>`);
    messages.push(`<article class="bubble user"><small>나</small><p>${escapeHtml(answer)}</p></article>`);
  });
  if (state.awaitingNext) {
    // 진행 중에는 해석을 붙이지 않는다. 어떤 역량으로 읽혔는지 알려주면 다음 답이 흔들린다.
    messages.push(`<article class="bubble interviewer active"><small>기록</small><p>답변을 기록했습니다. 결과는 마지막에 한 번에 보여드려요.</p></article>`);
  } else if (mode === 'deep' && state.deepTurn < q.turns.length) {
    messages.push(`<article class="bubble interviewer active"><small>진행</small><p>${q.turns[state.deepTurn]}</p></article>`);
  }
  let composer;
  if (state.awaitingNext) {
    composer = `<div class="continue-row"><button class="ghost" id="redo">다시 고르기</button><button id="continue">${state.deepCurrent < chatTotal() - 1 ? '다음 상황 →' : '역량 체크로 →'}</button></div>`;
  } else if (mode === 'quick' || mode === 'hybrid') {
    const scenario = scenarios[scenarioIndex];
    const order = state.optionOrders[scenarioIndex] || scenario.options.map((_, index) => index);
    const options = order.map((optionIndex, displayIndex) => {
      const mark = optionMark(optionIndex, state.pendingChoice, state.pendingWorst);
      return `<button class="chat-option${mark.className}" data-index="${optionIndex}"><span>${mark.badge || String.fromCharCode(65 + displayIndex)}</span><p>${scenario.options[optionIndex].text}</p></button>`;
    }).join('');
    const custom = `<button class="chat-option custom ${state.pendingChoice === -1 ? 'selected' : ''}" id="customChoice"><span>＋</span><p>내가 할 행동은 선택지에 없습니다. 직접 입력할게요.</p></button>`;
    let detail;
    if (state.pendingChoice === -1) {
      detail = `<form class="rationale custom-answer" id="customForm"><label for="customText">직접 할 행동을 적어주세요.</label><textarea id="customText" rows="3" maxlength="500" placeholder="가장 먼저 할 질문이나 행동을 구체적으로 적어주세요."></textarea><div><span>5자 이상 입력해주세요.</span><button type="submit">직접 답변 제출 →</button></div></form>`;
    } else if (mode === 'hybrid') {
      const ready = state.pendingChoice !== null && state.pendingWorst !== null;
      detail = `<form class="rationale" id="choiceForm"><label for="rationaleText">왜 골랐나요? 더 하고 싶은 행동이 있나요? <small>선택사항</small></label><textarea id="rationaleText" rows="2" maxlength="300" placeholder="예: 먼저 고객군을 나눠 보고, 영향이 크면 담당자와 수정 범위를 정하겠습니다."></textarea><div><span>${ready ? '한 줄은 결과 화면에 그대로 남습니다. 점수에는 반영하지 않아요.' : '제일 나중에 할 것도 하나 골라주세요.'}</span><button type="submit" ${ready ? '' : 'disabled'}>이 선택으로 제출 →</button></div></form>`;
    } else {
      detail = `<p class="quick-hint">${pickHint(state.pendingChoice === null ? undefined : state.pendingChoice, state.pendingWorst === null ? undefined : state.pendingWorst)}</p>`;
    }
    composer = `<div class="choice-composer"><div class="chat-options">${options}${custom}</div>${detail}</div>`;
  } else {
    composer = `<form class="reply" id="reply"><textarea id="replyText" rows="3" maxlength="500" placeholder="이 상황에서 실제로 할 말이나 행동을 입력하세요"></textarea><div><span id="count">0 / 500</span><button type="submit">답변 보내기 →</button></div></form>`;
  }
  const modeLabel = mode === 'quick' ? '빠른 선택' : mode === 'hybrid' ? '선택 + 이유' : '자세히 말하기';
  const guide = mode === 'quick' ? '제일 먼저 할 것과 제일 나중에 할 것을 하나씩 고르세요.' : mode === 'hybrid' ? '먼저·나중을 고르고, 필요할 때만 이유를 덧붙이세요.' : '좋은 문장보다 실제 질문과 다음 행동을 적어주세요.';
  const timer = mode === 'quick' && !state.awaitingNext ? '<b class="quick-timer" id="quickTimer">권장 25초</b>' : '';
  screenHost().innerHTML = `<main class="chat-shell"><header class="test-head"><button class="home-button" id="home"><b>←</b><span>처음으로</span></button><strong>FABL 테스트</strong><span>${totalIndex} / ${chatTotal()}</span></header><div class="progress"><i style="width:${totalIndex / chatTotal() * 100}%"></i></div><section class="chat-stage"><div class="chat-intro"><p class="domain">${modeLabel} · ${q.domain}</p><h2>${q.title}</h2><span>${guide}${timer}</span></div><div class="conversation">${messages.join('')}</div>${composer}</section></main>`;
  if (mode === 'quick' && !state.awaitingNext) startQuickTimer(scenarioIndex);
  pick('#home').onclick = goHome;
  if (state.awaitingNext) {
    pick('#continue').onclick = continueChat;
    pick('#redo').onclick = () => redoScenario(scenarioIndex);
    return;
  }
  if (mode === 'quick' || mode === 'hybrid') {
    pickAll('.chat-option').forEach(button => {
      button.onclick = () => {
        if (button.id === 'customChoice') { state.pendingChoice = -1; state.pendingWorst = null; render(); return; }
        const optionIndex = Number(button.dataset.index);
        if (state.pendingChoice === optionIndex) state.pendingChoice = null;
        else if (state.pendingWorst === optionIndex) state.pendingWorst = null;
        else if (state.pendingChoice === null || state.pendingChoice === -1) state.pendingChoice = optionIndex;
        else state.pendingWorst = optionIndex;
        // 빠른 선택은 둘 다 고른 순간 바로 기록한다. 확인 버튼을 따로 두지 않는다.
        if (mode === 'quick' && state.pendingChoice !== null && state.pendingWorst !== null) {
          submitChoice(state.pendingChoice, '', state.pendingWorst);
          return;
        }
        render();
      };
    });
    if (state.pendingChoice === -1) {
      pick('#customForm').onsubmit = event => {
        event.preventDefault();
        const answer = pick('#customText').value.trim();
        if (answer.length < 5) { pick('#customText').classList.add('invalid'); return; }
        const button = event.currentTarget.querySelector('button');
        button.disabled = true;
        button.textContent = '답변 분석 중…';
        submitCustomChoice(answer);
      };
      pick('#customText').focus();
      return;
    }
    if (mode === 'hybrid') {
      pick('#choiceForm').onsubmit = event => {
        event.preventDefault();
        if (state.pendingChoice === null || state.pendingWorst === null) return;
        const button = event.currentTarget.querySelector('button');
        button.disabled = true;
        button.textContent = '답변 분석 중…';
        submitChoice(state.pendingChoice, pick('#rationaleText').value.trim(), state.pendingWorst);
      };
    }
    return;
  }
  const textarea = pick('#replyText');
  textarea.oninput = () => { pick('#count').textContent = `${textarea.value.length} / 500`; };
  pick('#reply').onsubmit = event => {
    event.preventDefault();
    const answer = textarea.value.trim();
    if (answer.length < 5) { textarea.focus(); textarea.classList.add('invalid'); return; }
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    button.textContent = '답변 분석 중…';
    submitChat(answer);
  };
  textarea.focus();
}

function startQuickTimer(scenarioIndex) {
  if (!state.scenarioStartedAt[scenarioIndex]) {
    state.scenarioStartedAt[scenarioIndex] = Date.now();
    saveState();
  }
  const timer = pick('#quickTimer');
  const update = () => {
    const elapsed = Math.floor((Date.now() - state.scenarioStartedAt[scenarioIndex]) / 1000);
    const remaining = Math.max(0, 25 - elapsed);
    timer.textContent = remaining ? `권장 ${remaining}초` : '권장 시간 경과';
    timer.classList.toggle('elapsed', remaining === 0);
  };
  update();
  quickTimerId = setInterval(update, 1000);
}

async function submitCustomChoice(answer) {
  const scenarioIndex = state.scenarioOrder[state.deepCurrent] ?? state.deepCurrent;
  const scenario = chatScenarios[scenarioIndex];
  const evaluation = await evaluateAnswer(scenario, scenario.turns[0], answer, []);
  state.deepAnswers[scenarioIndex] = [`직접 입력: ${answer}`];
  state.chatSignals.push({ scenario: scenario.title, scenarioIndex, turn: 0, scores: evaluation.scores, quality: evaluation.quality || {}, reaction: evaluation.reaction, text: answer, fallback: evaluation.fallback, responseMs: state.scenarioStartedAt[scenarioIndex] ? Date.now() - state.scenarioStartedAt[scenarioIndex] : null });
  state.pendingChoice = null;
  state.pendingWorst = null;
  state.awaitingNext = true;
  render();
}

async function submitChoice(optionIndex, rationale, worstIndex) {
  const scenarioIndex = state.scenarioOrder[state.deepCurrent] ?? state.deepCurrent;
  const scenario = scenarios[scenarioIndex];
  const option = scenario.options[optionIndex];
  const answer = rationale ? `선택: ${option.text}\n이유: ${rationale}` : `선택: ${option.text}`;
  state.answers[scenarioIndex] = optionIndex;
  if (!state.lastAnswers) state.lastAnswers = [];
  if (worstIndex !== undefined && worstIndex !== null) state.lastAnswers[scenarioIndex] = worstIndex;
  state.deepAnswers[scenarioIndex] = [answer];
  const strongestKey = Object.entries(option.scores).sort((a, b) => b[1] - a[1])[0]?.[0];
  const capability = capabilities.find(item => item.key === strongestKey);
  state.chatSignals.push({
    scenario: scenario.title,
    scenarioIndex,
    turn: 0,
    scores: {},
    reaction: `${withObjectParticle(capability?.ko || '행동 선호')} 먼저 사용하는 선택으로 보입니다.`,
    text: option.text,
    responseMs: state.scenarioStartedAt[scenarioIndex] ? Date.now() - state.scenarioStartedAt[scenarioIndex] : null
  });
  if (rationale) {
    const evaluation = await evaluateAnswer(chatScenarios[scenarioIndex], chatScenarios[scenarioIndex].turns[0], rationale, [option.text]);
    state.chatSignals.push({ scenario: scenario.title, scenarioIndex, turn: 0, scores: evaluation.scores, quality: evaluation.quality || {}, reaction: evaluation.reaction, text: rationale, fallback: evaluation.fallback });
  }
  state.pendingChoice = null;
  state.pendingWorst = null;
  state.awaitingNext = true;
  render();
}

// 공개판은 서버를 두지 않는다. 원본의 /api/evaluate(OpenAI) 호출을 걷어내고
// 원래 폴백이던 브라우저 로컬 규칙 평가를 유일한 경로로 승격했다.
// 익명 사용자가 몰려도 요금이 발생하지 않고, 답변이 밖으로 나가지 않는다.
async function evaluateAnswer(scenario, question, answer) {
  return { reaction: adaptiveLead(answer), scores: analyzeText(answer), quality: {}, fallback: true };
}

async function submitChat(answer) {
  const scenarioIndex = state.scenarioOrder[state.deepCurrent] ?? state.deepCurrent;
  const turn = state.deepTurn;
  const scenario = chatScenarios[scenarioIndex];
  const evaluation = await evaluateAnswer(scenario, scenario.turns[turn], answer, state.deepAnswers[scenarioIndex] || []);
  if (!state.deepAnswers[scenarioIndex]) state.deepAnswers[scenarioIndex] = [];
  state.deepAnswers[scenarioIndex].push(answer);
  state.chatSignals.push({ scenario: scenario.title, scenarioIndex, turn, scores: evaluation.scores, quality: evaluation.quality || {}, reaction: evaluation.reaction, text: answer, fallback: evaluation.fallback });
  if (state.deepTurn < chatScenarios[scenarioIndex].turns.length - 1) state.deepTurn += 1;
  else state.awaitingNext = true;
  render();
}

/** 이번 상황의 답을 지우고 다시 고르게 한다. 긴 코스는 앞 문항으로 못 돌아가서
    한 번 잘못 누르면 그대로 기록됐다. */
function redoScenario(scenarioIndex) {
  state.chatSignals = state.chatSignals.filter(signal => signal.scenarioIndex !== scenarioIndex);
  delete state.deepAnswers[scenarioIndex];
  delete state.answers[scenarioIndex];
  delete (state.lastAnswers || [])[scenarioIndex];
  state.pendingChoice = null;
  state.pendingWorst = null;
  state.awaitingNext = false;
  state.deepTurn = 0;
  state.scenarioStartedAt[scenarioIndex] = Date.now();
  render();
}

function continueChat() {
  state.awaitingNext = false;
  state.pendingChoice = null;
  state.pendingWorst = null;
  if (state.deepCurrent < chatTotal() - 1) {
    state.deepCurrent += 1;
    state.deepTurn = 0;
  } else if (!state.keyedSet || keyedAnsweredCount() < state.keyedSet.length) {
    // 긴 코스는 유형(20상황)에 이어 역량 체크(20문항)까지 한 번에 간다.
    beginKeyed();
    return;
  } else {
    state.screen = 'result';
  }
  render();
}

function calculate() {
  const totals = Object.fromEntries(capabilities.map(c => [c.key, { sum: 0, count: 0, evidence: [] }]));
  // 문항 풀이 역량마다 주는 기회가 다르다. 답한 문항의 선택지 평균을 '기대 신호'로 두고
  // 그 대비 비율로 환산한다. 이걸 안 하면 아무 답이나 찍어도 A 가 1순위로 42% 나온다
  // (무작위 2만 회 시뮬레이션 실측). 보정 뒤에는 F 23 · A 26 · B 26 · L 25 로 고르다.
  const expected = Object.fromEntries(capabilities.map(c => [c.key, 0]));
  const list = activeScenarios();
  state.answers.forEach((answer, qIndex) => {
    const scenario = list[qIndex];
    if (!scenario) return;
    const option = scenario.options[answer];
    if (!option) return;
    // '제일 나중' 은 음의 신호다. 무작위로 고를 때의 기댓값도 그만큼 줄어들므로
    // 기대 신호에 같은 비율(1 - WORST_WEIGHT)을 곱한다. 옛 공유 링크처럼 '나중' 이
    // 없는 응답은 예전 그대로 '먼저' 만으로 채점된다.
    const worstIndex = (state.lastAnswers || [])[qIndex];
    const worstOption = worstIndex === undefined ? null : scenario.options[worstIndex];
    const chanceScale = worstOption ? 1 - WORST_WEIGHT : 1;
    scenario.options.forEach(candidate => {
      Object.entries(candidate.scores).forEach(([key, value]) => {
        expected[key] += (value / scenario.options.length) * chanceScale;
      });
    });
    Object.entries(option.scores).forEach(([key, value]) => {
      totals[key].sum += value; totals[key].count += 1;
      totals[key].evidence.push({ scenario: scenario.title, value });
    });
    if (worstOption) {
      Object.entries(worstOption.scores).forEach(([key, value]) => {
        totals[key].sum -= value * WORST_WEIGHT;
      });
    }
  });
  // 서술형은 정규식 키워드 매칭이라 '확인·먼저·담당자' 처럼 업무 문장에 거의 항상 있는 단어에
  // 걸린다. 길게 쓸수록 F·L 이 올라가고, 서술형 12턴이 객관식 20문항과 맞먹는 무게가 됐다.
  // 그래서 점수에서는 뺀다. 무엇을 적었는지는 근거 목록에만 남긴다.
  state.chatSignals.forEach(signal => {
    Object.entries(signal.scores).forEach(([key, value]) => {
      totals[key].evidence.push({ scenario: signal.scenario, value, text: signal.text });
    });
  });

  // 역량마다 문항이 주는 기회가 다르다. 기회가 거의 없던 역량(예: 판단갱신력)은 한 번만 골라도
  // 비율이 4~6 까지 튀어 모드 순위를 뒤집었다. 기대 신호에 상수를 더해 관찰이 적을수록
  // 전체 평균 쪽으로 당긴다(수축 추정). 기회가 충분한 역량은 사실상 그대로 남는다.
  const obtainedAll = capabilities.reduce((sum, c) => sum + totals[c.key].sum, 0);
  const expectedAll = capabilities.reduce((sum, c) => sum + expected[c.key], 0);
  const globalRate = expectedAll ? obtainedAll / expectedAll : 0;
  return capabilities.map(c => {
    const rate = shrunkRate(totals[c.key].sum, expected[c.key], globalRate);
    const relativePreference = globalRate ? rate / globalRate : 0;
    const score = totals[c.key].count || expected[c.key] ? 2 + Math.max(0, Math.min(3, relativePreference * 1.5)) : 2;
    // obtained·chance 를 같이 넘긴다. 모드 점수는 이걸 모드 단위로 합쳐서 다시 계산한다.
    return { ...c, score, observed: totals[c.key].count, obtained: totals[c.key].sum, chance: expected[c.key], globalRate, evidence: totals[c.key].evidence };
  });
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return '기록 없음';
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}분 ${seconds}초` : `${seconds}초`;
}

function calculateJudgmentQuality() {
  const evidence = Object.fromEntries(qualityDimensions.map(item => [item.key, []]));
  state.chatSignals.forEach(signal => {
    Object.entries(signal.quality || {}).forEach(([key, strength]) => {
      if (evidence[key] && Number.isFinite(strength)) evidence[key].push(strength);
    });
  });
  return qualityDimensions.map(item => {
    const values = evidence[item.key];
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    return { ...item, score: average === null ? null : 1 + average * 4 / 3, observed: values.length };
  });
}

function renderResult() {
  archiveCurrentResult();
  const result = calculate();
  const ranked = [...result].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 3), growth = ranked.slice(-2).reverse();
  const workType = calculateWorkType(result);
  const typeCode = workType.code;
  const rankedTypeCode = [...typeCode].map((letter, index) => `<strong class="rank-${index + 1}">${letter}</strong>`).join('');
  const selectedModes = workType.modes.slice(0, 3);
  const judgmentQuality = calculateJudgmentQuality();
  const qualityEvidenceCount = judgmentQuality.reduce((sum, item) => sum + item.observed, 0);
  // 판단 품질 패널은 LLM 이 채워주던 quality 신호에만 의존한다. 공개판에서 그 호출을
  // 걷어냈으므로 qualityEvidenceCount 는 항상 0 이고 이 패널은 렌더되지 않는다.
  // 같은 역할은 정답 키가 있는 역량 체크(renderKeyedPanel)가 대신한다.
  const qualityPanel = qualityEvidenceCount ? `<section class="quality-panel"><div><p class="eyebrow">JUDGMENT QUALITY · ${qualityEvidenceCount} SIGNALS</p><h3>한 줄 답변에서 확인된 판단 품질</h3></div><div>${judgmentQuality.map(item => `<article class="${item.score === null ? 'unobserved' : ''}"><span><b>${item.ko}</b><small>${item.desc}</small></span><strong>${item.score === null ? '관찰 전' : item.score.toFixed(1)}</strong></article>`).join('')}</div></section>` : '';
  const responseTimes = state.chatSignals.map(signal => signal.responseMs).filter(Number.isFinite).sort((a, b) => a - b);
  const middle = Math.floor(responseTimes.length / 2);
  const medianSeconds = responseTimes.length ? Math.round((responseTimes.length % 2 ? responseTimes[middle] : (responseTimes[middle - 1] + responseTimes[middle]) / 2) / 1000) : null;
  const activeResponseMs = responseTimes.reduce((sum, milliseconds) => sum + milliseconds, 0);
  const averageResponseSeconds = responseTimes.length ? Math.round(activeResponseMs / responseTimes.length / 1000) : null;
  const withinGuide = responseTimes.filter(ms => ms <= 25000).length;
  const archivedDurations = loadArchives().map(item => item.assessmentDurationMs).filter(Number.isFinite);
  const browserAverageMs = archivedDurations.length ? archivedDurations.reduce((sum, milliseconds) => sum + milliseconds, 0) / archivedDurations.length : null;
  const paceCard = responseTimes.length ? `<section class="pace-card"><div><p class="eyebrow">ASSESSMENT TIME</p><h2>검사 시간</h2><p>중간에 화면을 닫아둔 시간은 총 소요시간에 포함될 수 있습니다.</p></div><div class="time-metrics"><span><small>이번 검사</small><b>${formatDuration(state.assessmentDurationMs)}</b></span><span><small>문항당 평균</small><b>${averageResponseSeconds}초</b></span><span><small>중앙 응답</small><b>${medianSeconds}초</b></span><span><small>내 평균 · ${archivedDurations.length}회</small><b>${formatDuration(browserAverageMs)}</b></span></div><span class="guide-count">25초 안에 선택<br><b>${withinGuide} / ${responseTimes.length}</b></span></section>` : '';
  screenHost().innerHTML = `<main class="result-shell"><header class="result-head"><div><p class="eyebrow">YOUR WORKING PATTERN</p><h1>먼저 <em>${selectedModes[0].plain}</em>,<br>그다음 ${selectedModes[1].plain},<br>마지막에 ${selectedModes[2].plain}.</h1></div><button class="ghost" id="restart">다시 하기</button></header><section class="type-result"><div class="type-identity"><img src="/people/${typeCode}.jpg" alt="${workTypePeople[typeCode]} 초상"><div><b class="result-type-code" aria-label="${typeCode}">${rankedTypeCode}</b><span>${workTypeNames[typeCode]}형</span><small>${workTypePeople[typeCode]} 아키타입</small></div><p>${workTypeReasons[typeCode]}</p></div></section><section class="result-grid"><div class="radar-card"><canvas id="radar" width="680" height="620"></canvas><div class="scale-note">색상은 FABL 그룹 · 2 관찰 없음 · 3.5 평균 · 5 강한 선호</div></div><div class="summary behavior-summary"><h2>당신은 이렇게 행동할 가능성이 큽니다</h2>${renderBehaviorInsights(selectedModes)}<p class="behavior-note">상황에 따라 다른 접근도 사용하지만, 답변에서 반복된 우선순서를 풀어낸 예시입니다.</p></div></section>${qualityPanel}${renderKeyedPanel()}<details class="all-scores"><summary><div class="section-title"><p class="eyebrow">${state.answers.length} SCENARIOS · 10 CAPABILITIES</p><h2>10개 역량 상세 점수 보기</h2></div><b>펼치기 ＋</b></summary><div class="score-list">${result.map(c => `<div class="score-row"><div><b>${c.ko}</b><small>${c.en} · 신호 ${c.observed}</small></div><i><span style="width:${c.score / 5 * 100}%"></span></i><strong>${c.score.toFixed(1)}</strong></div>`).join('')}</div></details><footer>이 결과는 ${state.answers.length}개 상황에서 먼저 사용한 접근을 분석한 상대적 선호도입니다. 낮은 점수는 능력 부족을 뜻하지 않으며, 채용·인사평가의 단독 근거로 사용하지 마세요. 함께 나오는 인물은 공개된 업적에서 연상한 예시이고, 그 사람을 진단한 결과가 아닙니다.</footer></main>`;
  if (paceCard) pick('.all-scores').insertAdjacentHTML('beforebegin', paceCard);
  drawRadar(pick('#radar'), result);
  const resultHead = pick('.result-head');
  const restartButton = resultHead.querySelector('#restart');
  restartButton.insertAdjacentHTML('beforebegin', '<button class="ghost" id="downloadResult">결과 다운로드</button>');
  const downloadButton = pick('#downloadResult');
  const actions = document.createElement('div');
  actions.className = 'result-actions';
  restartButton.before(actions);
  actions.append(downloadButton, restartButton);
  restartButton.onclick = reset;
  downloadButton.onclick = downloadCurrentResult;
  const startKeyed = pick('#startKeyed');
  if (startKeyed) startKeyed.onclick = beginKeyed;
  const retryKeyed = pick('#retryKeyed');
  if (retryKeyed) retryKeyed.onclick = beginKeyed;

  // 결과가 나오면 주소창을 공유 가능한 유형 경로로 바꾼다. 이 링크를 붙여 넣으면
  // 빌드 때 찍어둔 유형별 미리보기 카드가 뜬다(해시로는 크롤러가 못 읽는다).
  if (!state.isExample) history.replaceState(null, '', typeUrl(typeCode, state.answers, state.scenarioSet, state.lastAnswers));

  restartButton.insertAdjacentHTML('beforebegin', '<button class="primary" id="shareResult">결과 공유하기</button>');
  const shareButton = pick('#shareResult');
  actions.prepend(shareButton);
  shareButton.onclick = async () => {
    const copied = await share(typeCode, state.answers, state.scenarioSet, state.lastAnswers);
    if (!copied) return;
    shareButton.textContent = '링크를 복사했어요';
    setTimeout(() => { shareButton.textContent = '결과 공유하기'; }, 2000);
  };
}

function drawRadar(canvas, result) {
  const ctx = canvas.getContext('2d'), cx = 340, cy = 305, radius = 215, n = result.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pt = (i, value, extra = 0) => { const a = -Math.PI / 2 + i * Math.PI * 2 / n; const r = radius * value / 5 + extra; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const step = Math.PI * 2 / n;
  result.forEach((capability, i) => {
    const angle = -Math.PI / 2 + i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle - step / 2, angle + step / 2);
    ctx.closePath();
    ctx.globalAlpha = .055;
    ctx.fillStyle = workModeColors[capabilityWorkMode[capability.key]];
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#dfe5ed'; ctx.lineWidth = 1;
  for (let level = 1; level <= 5; level++) { ctx.beginPath(); result.forEach((_, i) => { const [x, y] = pt(i, level); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke(); }
  result.forEach((_, i) => { const [x, y] = pt(i, 5); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); });
  ctx.beginPath(); result.forEach((c, i) => { const [x, y] = pt(i, c.score); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fillStyle = 'rgba(78, 63, 207, .15)'; ctx.strokeStyle = '#563fd0'; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
  result.forEach((c, i) => {
    const [x, y] = pt(i, c.score);
    const modeColor = workModeColors[capabilityWorkMode[c.key]];
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = modeColor; ctx.fill();
    const [lx, ly] = pt(i, 5, 38);
    ctx.textAlign = lx < cx - 20 ? 'right' : lx > cx + 20 ? 'left' : 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 15px -apple-system, sans-serif'; ctx.fillStyle = modeColor; ctx.fillText(c.ko, lx, ly - 7);
    ctx.font = '700 8px -apple-system, sans-serif'; ctx.fillStyle = modeColor; ctx.fillText(`${capabilityWorkMode[c.key]} · ${c.en.toUpperCase()}`, lx, ly + 9);
  });
}

function reset() {
  pick('#homeConfirm')?.remove();
  sessionStorage.removeItem(STORAGE_KEY);
  state = createState();
  render();
}

function goHome() {
  if (pick('#homeConfirm')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="confirm-backdrop" id="homeConfirm" role="dialog" aria-modal="true" aria-labelledby="homeConfirmTitle"><section><b id="homeConfirmTitle">처음 화면으로 갈까요?</b><p>지금까지 입력한 이번 테스트 답변은 지워집니다.</p><div><button class="ghost" id="cancelHome">계속 풀기</button><button class="danger" id="confirmHome">답변 지우고 처음으로</button></div></section></div>`);
  pick('#cancelHome').onclick = () => pick('#homeConfirm').remove();
  pick('#confirmHome').onclick = reset;
}
// 부팅 경로 분기. /t/CODE/ 로 들어오면 저장된 세션보다 링크가 우선이다.
const sharedCode = codeFromPath();
if (sharedCode) {
  const sharedAnswers = answersFromQuery();
  if (sharedAnswers && sharedAnswers.length) {
    // 답변까지 실려 왔으면 레이더까지 그대로 복원한다.
    state = { ...createState(), course: 'short', scenarioSet: scenarioSetFromQuery(), answers: sharedAnswers, lastAnswers: worstAnswersFromQuery() || [], screen: 'result' };
    render();
  } else {
    mountShell(app, { mode: 'screen' });
    renderSharedType(sharedCode);
  }
} else {
  render();
}
