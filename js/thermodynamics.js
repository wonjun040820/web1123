/**
 * thermodynamics.js
 * 브레이튼 사이클 (Brayton Cycle) 열역학 해석 엔진 (Vanilla JS)
 */

(function (window) {
  'use strict';

  // 열역학 상수 정의
  const CONSTANTS = {
    CP: 1.005, // 공기 정압비열 [kJ/kg·K]
    CV: 0.718, // 공기 정적비열 [kJ/kg·K]
    GAMMA: 1.4, // 비열비 (Cp / Cv)
    R: 0.287, // 기체상수 [kJ/kg·K]
  };

  /**
   * 브레이튼 사이클 계산 함수
   * @param {Object} params
   * @param {number} params.T1 - 압축기 입구 온도 [K]
   * @param {number} params.P1 - 압축기 입구 압력 [kPa]
   * @param {number} params.rp - 압력비 (P2 / P1)
   * @param {number} params.T3 - 터빈 입구 최고 온도 [K]
   * @param {number} [params.gamma=1.4] - 비열비
   * @param {number} [params.cp=1.005] - 정압비열
   * @returns {Object} 계산된 상태점 및 성능 지표 객체
   */
  function calculateCycle(params) {
    const T1 = parseFloat(params.T1) || 288.15; // 15°C
    const P1 = parseFloat(params.P1) || 101.325; // 1 atm
    const rp = Math.max(1.1, parseFloat(params.rp) || 12.0);
    const T3 = Math.max(T1 + 100, parseFloat(params.T3) || 1673.15); // 1400°C
    const gamma = parseFloat(params.gamma) || CONSTANTS.GAMMA;
    const cp = parseFloat(params.cp) || CONSTANTS.CP;
    const R = cp * (1 - 1 / gamma); // R = Cp - Cv = Cp*(1 - 1/γ)

    const exp = (gamma - 1) / gamma;

    // 상태 1: 압축기 입구 (대기)
    const v1 = (R * T1) / P1; // [m^3/kg]
    const s1 = 0; // 기준점 s1 = 0

    // 상태 2: 압축기 출구 / 연소실 입구 (등엔트로피 압축 1->2)
    const P2 = P1 * rp;
    const T2 = T1 * Math.pow(rp, exp);
    const v2 = (R * T2) / P2;
    const s2 = s1;

    // 상태 3: 연소실 출구 / 터빈 입구 (정압 가열 2->3)
    const P3 = P2;
    // T3는 입력값
    const v3 = (R * T3) / P3;
    const s3 = s2 + cp * Math.log(T3 / T2);

    // 상태 4: 터빈 출구 / 배기 (등엔트로피 팽창 3->4)
    const P4 = P1;
    const T4 = T3 / Math.pow(rp, exp);
    const v4 = (R * T4) / P4;
    const s4 = s3;

    // 일 및 열량 계산 [kJ/kg]
    const w_comp = cp * (T2 - T1); // 압축기 소비 일
    const q_in = cp * (T3 - T2); // 연소실 투입 열량
    const w_turb = cp * (T3 - T4); // 터빈 생산 일
    const q_out = cp * (T4 - T1); // 대기 방출 열량
    const w_net = w_turb - w_comp; // 순 생산 일

    // 열효율 및 성능 지표
    const efficiency = 1 - 1 / Math.pow(rp, exp); // 이론 열효율 (0~1)
    const bwr = w_turb > 0 ? (w_comp / w_turb) * 100 : 0; // 역일비율 (%)

    // 최적 압력비 (최대 순 출력 조건)
    const rp_opt = Math.pow(T3 / T1, gamma / (2 * (gamma - 1)));
    const max_wnet = cp * T1 * Math.pow(Math.sqrt(T3 / T1) - 1, 2);

    // 카르노 사이클 극한 효율 (비교용)
    const carnot_eff = 1 - T1 / T3;

    return {
      inputs: { T1, P1, rp, T3, gamma, cp, R },
      states: {
        1: { T: T1, P: P1, v: v1, s: s1 },
        2: { T: T2, P: P2, v: v2, s: s2 },
        3: { T: T3, P: P3, v: v3, s: s3 },
        4: { T: T4, P: P4, v: v4, s: s4 },
      },
      metrics: {
        w_comp,
        q_in,
        w_turb,
        q_out,
        w_net,
        efficiency: efficiency * 100, // 백분율
        carnot_efficiency: carnot_eff * 100,
        bwr, // 백분율
        rp_opt,
        max_wnet,
        isFeasible: T3 > T2, // T3가 T2보다 높아야 연소 가열 가능
      },
    };
  }

  /**
   * 압력비 변화에 따른 트레이드오프 데이터 시리즈 생성 (rp: 2 ~ 35)
   * @param {Object} params - 기본 파라미터 (T1, T3, gamma, cp)
   * @param {number} maxRp - 최대 압력비 (기본 35)
   * @returns {Object} { rps, efficiencies, w_nets, bws }
   */
  function generateTradeoffSeries(params, maxRp = 35) {
    const T1 = parseFloat(params.T1) || 288.15;
    const T3 = parseFloat(params.T3) || 1673.15;
    const gamma = parseFloat(params.gamma) || CONSTANTS.GAMMA;
    const cp = parseFloat(params.cp) || CONSTANTS.CP;
    const exp = (gamma - 1) / gamma;

    const rps = [];
    const efficiencies = [];
    const w_nets = [];
    const bwrs = [];

    // 압력비 한계 (T2 = T3 가 되는 압력비에서는 연소실 가열 불가)
    const rp_limit = Math.pow(T3 / T1, gamma / (gamma - 1));
    const effectiveMaxRp = Math.min(maxRp, Math.floor(rp_limit) - 1);

    for (let r = 2; r <= effectiveMaxRp; r += 0.5) {
      const T2 = T1 * Math.pow(r, exp);
      const T4 = T3 / Math.pow(r, exp);
      const wc = cp * (T2 - T1);
      const wt = cp * (T3 - T4);
      const wn = wt - wc;
      const eff = (1 - 1 / Math.pow(r, exp)) * 100;
      const bwr = wt > 0 ? (wc / wt) * 100 : 100;

      rps.push(r);
      efficiencies.push(Math.max(0, eff));
      w_nets.push(Math.max(0, wn));
      bwrs.push(Math.min(100, Math.max(0, bwr)));
    }

    return {
      rps,
      efficiencies,
      w_nets,
      bwrs,
      rp_limit,
    };
  }

  /**
   * P-v 선도 렌더링을 위한 정밀 좌표 곡선 생성 (상태 1->2->3->4->1)
   * @param {Object} cycleData - calculateCycle 결과
   * @param {number} samplesPerCurve - 곡선당 샘플 수
   */
  function generatePvCurvePoints(cycleData, samplesPerCurve = 30) {
    const { states, inputs } = cycleData;
    const gamma = inputs.gamma;
    const points = [];

    // 1 -> 2: 단열 압축 (P * v^gamma = const1)
    const C1 = states[1].P * Math.pow(states[1].v, gamma);
    for (let i = 0; i <= samplesPerCurve; i++) {
      const t = i / samplesPerCurve;
      // v1 -> v2
      const v = states[1].v + (states[2].v - states[1].v) * t;
      const P = C1 / Math.pow(v, gamma);
      points.push({ v, P, stage: '1-2' });
    }

    // 2 -> 3: 정압 가열 (P = const = P2)
    for (let i = 1; i <= samplesPerCurve; i++) {
      const t = i / samplesPerCurve;
      const v = states[2].v + (states[3].v - states[2].v) * t;
      points.push({ v, P: states[2].P, stage: '2-3' });
    }

    // 3 -> 4: 단열 팽창 (P * v^gamma = const3)
    const C3 = states[3].P * Math.pow(states[3].v, gamma);
    for (let i = 1; i <= samplesPerCurve; i++) {
      const t = i / samplesPerCurve;
      const v = states[3].v + (states[4].v - states[3].v) * t;
      const P = C3 / Math.pow(v, gamma);
      points.push({ v, P, stage: '3-4' });
    }

    // 4 -> 1: 정압 방열 (P = const = P1)
    for (let i = 1; i <= samplesPerCurve; i++) {
      const t = i / samplesPerCurve;
      const v = states[4].v + (states[1].v - states[4].v) * t;
      points.push({ v, P: states[1].P, stage: '4-1' });
    }

    return points;
  }

  /**
   * T-s 선도 렌더링을 위한 좌표 곡선 생성 (상태 1->2->3->4->1)
   */
  function generateTsCurvePoints(cycleData, samplesPerCurve = 30) {
    const { states, inputs } = cycleData;
    const cp = inputs.cp;
    const points = [];

    // 1 -> 2: 등엔트로피 압축 (s1 = s2, 수직 상승)
    for (let i = 0; i <= samplesPerCurve; i++) {
      const t = i / samplesPerCurve;
      const T = states[1].T + (states[2].T - states[1].T) * t;
      points.push({ s: states[1].s, T, stage: '1-2' });
    }

    // 2 -> 3: 정압 가열 (s = s2 + cp * ln(T / T2))
    for (let i = 1; i <= samplesPerCurve; i++) {
      const t = i / samplesPerCurve;
      const T = states[2].T + (states[3].T - states[2].T) * t;
      const s = states[2].s + cp * Math.log(T / states[2].T);
      points.push({ s, T, stage: '2-3' });
    }

    // 3 -> 4: 등엔트로피 팽창 (s3 = s4, 수직 하강)
    for (let i = 1; i <= samplesPerCurve; i++) {
      const t = i / samplesPerCurve;
      const T = states[3].T + (states[4].T - states[3].T) * t;
      points.push({ s: states[3].s, T, stage: '3-4' });
    }

    // 4 -> 1: 정압 방열 (s = s1 + cp * ln(T / T1))
    for (let i = 1; i <= samplesPerCurve; i++) {
      const t = i / samplesPerCurve;
      const T = states[4].T + (states[1].T - states[4].T) * t;
      const s = states[1].s + cp * Math.log(T / states[1].T);
      points.push({ s, T, stage: '4-1' });
    }

    return points;
  }

  // 전역 노출
  window.BraytonThermodynamics = {
    CONSTANTS,
    calculateCycle,
    generateTradeoffSeries,
    generatePvCurvePoints,
    generateTsCurvePoints,
  };
})(window);
