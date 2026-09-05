// 판단 체크 — 정답 키가 있는 문항.
//
// 유형 문항(12개)은 ipsative 다. 본인 평균으로 나눠 점수를 내기 때문에 합이 구조적으로
// 고정되고, 선택지도 전부 타당해서 "남보다 낫다"를 원리적으로 말할 수 없다.
// 여기 문항들은 반대다. 각 문항에 방어 가능한 정답이 하나 있고, 오답은 그럴듯하지만
// 원칙을 어긴 선택이다. 그래서 사람 간 비교가 가능한 normative 점수가 나온다.
//
// 정답의 근거는 지어내지 않았다. capability-cards 의 역량 카드에 적힌 잘함/부족/혼동 주의
// 문장을 기준으로 삼았고, 문항마다 그 원칙을 principle 에 적어 해설로 보여준다.
// LLM 을 쓰지 않으므로 서버 비용이 들지 않고 답변이 밖으로 나가지 않는다.

export const qualityDimensionNames = {
  problem_definition: '문제 정의',
  prioritization: '우선순위',
  customer_impact: '고객 영향',
  actionability: '실행 가능성',
  verification: '검증'
};

export const keyedItems = [
  {
    dimension: 'problem_definition',
    situation: '이용자가 "검색이 안 된다"고 문의했다. 확인해 보니 대부분의 검색은 정상이고 특정 조건에서만 결과가 빠진다.',
    question: '지금 단계에서 가장 먼저 확정해야 할 것은?',
    options: [
      '결과가 빠지는 조건과 빠지지 않는 조건을 갈라 재현 범위를 좁힌다.',
      '검색 방식 전체를 교체하는 개편안을 먼저 검토한다.',
      '같은 문의가 몇 건이나 들어왔는지 집계부터 한다.',
      '이용자에게 잠시 뒤 다시 시도해 달라고 안내한다.'
    ],
    correct: 0,
    principle: '현상·가설·확정 사실을 분리하고 판별 테스트를 설계한다. 맞을 수도 있는 상위 문제를 말하며 현재 문제를 건너뛰는 것이 대표적인 실패다.'
  },
  {
    dimension: 'prioritization',
    situation: '장애 대응 중이다. 5분이면 끝나는 확실한 조치 하나와, 며칠 걸리는 근본 개선 하나가 동시에 놓여 있다. 고객은 지금도 막혀 있다.',
    question: '어떻게 하겠는가?',
    options: [
      '5분짜리를 먼저 처리해 막힘을 풀고, 근본 개선은 별도 과제로 이어간다.',
      '근본 원인을 다 해결한 뒤에 한 번에 안내한다.',
      '두 가지를 같은 우선순위로 두고 동시에 착수한다.',
      '근본 개선 일정이 나올 때까지 고객 안내를 미룬다.'
    ],
    correct: 0,
    principle: '큰 문제와 금방 끝낼 일을 구분해 전체 흐름을 최적화한다. 원론적 완성에 매달려 긴급한 고객 피드백을 미루는 것이 부족의 신호다.'
  },
  {
    dimension: 'customer_impact',
    situation: '개편 후 전체 성공률이 98%로 올랐다. 그런데 특정 국가 이용자들은 매번 실패한다고 말한다. 그 비중은 0.5%다.',
    question: '이 숫자를 어떻게 읽어야 하는가?',
    options: [
      '평균이 가린 실패 구간이 있으므로, 그 구간에서 실제로 무엇이 막히는지 확인한다.',
      '0.5%는 통계적으로 무시할 수 있으므로 다음 과제로 넘어간다.',
      '전체 성공률이 올랐으니 개편은 성공으로 보고한다.',
      '표본이 적어 신뢰할 수 없다고 판단하고 데이터를 더 모을 때까지 기다린다.'
    ],
    correct: 0,
    principle: '전체 평균 너머의 실제 불편과 결과를 본다. 소수라도 매번 실패하는 구간은 평균으로 지워지지 않는다.'
  },
  {
    dimension: 'verification',
    situation: '보고 자료에 "하루 주문 750건, 자동화율 60%, 자동 처리 270건"이 적혀 있다.',
    question: '가장 먼저 할 일은?',
    options: [
      '750의 60%는 450인데 270이 적혀 있으므로, 숫자의 정의와 집계 조건부터 대조한다.',
      '자동화율이 올랐으니 다음 안건으로 넘어간다.',
      '270건이 맞다고 보고 자동화율 목표를 다시 잡는다.',
      '담당자가 계산했을 테니 그대로 인용한다.'
    ],
    correct: 0,
    principle: '전제와 실제 결과를 대조해 이상을 발견한다. AI 답변이든 동료의 자료든 그대로 믿지 않고 구조·제약·부작용을 검증한다.'
  },
  {
    dimension: 'actionability',
    situation: '회의가 끝났다. "고객 경험을 개선하자"는 방향에 모두가 동의했다.',
    question: '회의를 닫기 전에 반드시 남겨야 하는 것은?',
    options: [
      '누가 무엇을 언제까지 하고, 무엇을 보면 됐다고 할지를 적는다.',
      '합의된 방향을 정리한 회의록을 공유한다.',
      '다음 회의 일정을 잡는다.',
      '관련 자료를 모두가 볼 수 있는 곳에 올린다.'
    ],
    correct: 0,
    principle: '누가 무엇을 할지 다음 행동으로 구체화하고, 완료와 성공 여부를 확인할 기준을 둔다. 동의만 남은 회의는 실행으로 이어지지 않는다.'
  },
  {
    dimension: 'problem_definition',
    situation: '동료가 "이건 결국 플랫폼 구조 문제"라고 말한다. 지금 고객은 특정 화면에서 저장이 안 된다고 하고 있다.',
    question: '어떻게 응답하는 것이 맞는가?',
    options: [
      '지금 저장이 안 되는 문제를 먼저 닫고, 구조 문제는 근거를 모아 별도로 제기한다.',
      '구조 문제가 맞으므로 그쪽부터 논의를 옮긴다.',
      '두 문제를 하나로 묶어 큰 과제로 만든다.',
      '동료의 판단을 존중해 현재 문제는 보류한다.'
    ],
    correct: 0,
    principle: '좋은 흐름은 현재 문제 → 근거 확보 → 상위 구조 개선이다. 맞을 수도 있는 상위 문제로 건너뛰면 지금 막힌 고객이 남는다.'
  },
  {
    dimension: 'verification',
    situation: '버그를 고쳤다. 로컬에서 다시 해보니 잘 된다.',
    question: '완료라고 말하기 전에 필요한 것은?',
    options: [
      '고치기 전에는 실패하고 고친 뒤에는 통과하는 재현 조건을 남긴다.',
      '코드 리뷰를 받는다.',
      '수정 내용을 문서에 기록한다.',
      '동료에게 한 번 더 확인해 달라고 부탁한다.'
    ],
    correct: 0,
    principle: '재현이 수정 전 실패하고 수정 후 같은 조건에서 통과해야 근본 해결이다. 증상만 사라진 것과 원인을 고친 것은 다르다.'
  },
  {
    dimension: 'prioritization',
    situation: '내가 반대했던 방향으로 결정이 났다. 근거는 이미 회의에서 다 말했고, 새로 나온 사실은 없다.',
    question: '결정 이후 무엇을 하는 것이 맞는가?',
    options: [
      '결정된 방향으로 실행하고, 새 근거가 생기면 그때 다시 제기한다.',
      '이해했다고 말한 뒤 내 판단대로 진행한다.',
      '실행하되 진행 속도를 늦춰 재검토를 유도한다.',
      '결정이 번복될 때까지 착수를 미룬다.'
    ],
    correct: 0,
    principle: '결정 전에는 도전하고 결정 후에는 새 근거가 생기기 전까지 커밋한다. 복종이 아니라, 이견을 말할 용기와 결정 후 함께 갈 힘을 같이 본다.'
  }
];

/** 정답 수와 차원별 정오를 낸다. 유형 점수와 달리 사람 간 비교가 가능한 값이다. */
export function scoreKeyed(answers) {
  const byDimension = {};
  let correct = 0;
  keyedItems.forEach((item, index) => {
    const ok = answers[index] === item.correct;
    if (ok) correct += 1;
    const bucket = byDimension[item.dimension] || (byDimension[item.dimension] = { correct: 0, total: 0 });
    bucket.total += 1;
    if (ok) bucket.correct += 1;
  });
  return {
    correct,
    total: keyedItems.length,
    byDimension,
    missed: keyedItems.map((item, index) => ({ item, index })).filter(({ item, index }) => answers[index] !== item.correct)
  };
}
