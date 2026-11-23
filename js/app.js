/**
 * app.js
 * 브레이튼 사이클 인터랙티브 웹 애플리케이션 메인 컨트롤러 (Vanilla JS)
 */

(function (window) {
  'use strict';

  // 프리셋 설정 정의
  const PRESETS = {
    jet: {
      rp: 16.0,
      t3: 1450, // °C
      t1: -15, // °C (순항 고도 대기 온도)
      name: '항공 터보제트 / 터보팬',
    },
    ccgt: {
      rp: 23.0,
      t3: 1550, // °C (최신 H/J 클래스 대형 가스터빈)
      t1: 15, // °C
      name: '대형 복합화력 가스터빈 (CCGT)',
    },
    micro: {
      rp: 4.5,
      t3: 950, // °C (분산형 마이크로 가스터빈)
      t1: 20, // °C
      name: '마이크로 가스터빈',
    },
  };

  // DOM 요소 캐시
  let dom = {};

  function initDOM() {
    dom = {
      inputRp: document.getElementById('input-rp'),
      labelRp: document.getElementById('label-rp'),
      inputT3: document.getElementById('input-t3'),
      labelT3: document.getElementById('label-t3'),
      inputT1: document.getElementById('input-t1'),
      labelT1: document.getElementById('label-t1'),

      metricEfficiency: document.getElementById('metric-efficiency'),
      metricCarnotRatio: document.getElementById('metric-carnot-ratio'),
      metricWnet: document.getElementById('metric-wnet'),
      metricWnetRatio: document.getElementById('metric-wnet-ratio'),
      metricBwr: document.getElementById('metric-bwr'),
      metricRpOpt: document.getElementById('metric-rp-opt'),

      pvCanvas: document.getElementById('pv-canvas'),
      tsCanvas: document.getElementById('ts-canvas'),
      tradeoffCanvas: document.getElementById('tradeoff-canvas'),

      stateTableBody: document.getElementById('state-table-body'),
    };
  }

  /**
   * 시뮬레이션 파라미터 읽기
   */
  function getParamsFromUI() {
    const rp = parseFloat(dom.inputRp?.value) || 12.0;
    const t3C = parseFloat(dom.inputT3?.value) || 1400.0;
    const t1C = parseFloat(dom.inputT1?.value) || 15.0;

    const T1 = t1C + 273.15; // 켈빈 변환
    const T3 = t3C + 273.15;
    const P1 = 101.325; // 1 atm [kPa]

    return { rp, t3C, t1C, T1, T3, P1 };
  }

  /**
   * 시뮬레이션 전체 계산 및 화면 갱신
   */
  function updateSimulation() {
    const { rp, t3C, t1C, T1, T3, P1 } = getParamsFromUI();

    // UI 라벨 업데이트
    if (dom.labelRp) dom.labelRp.textContent = rp.toFixed(1);
    if (dom.labelT3) dom.labelT3.textContent = `${t3C.toLocaleString()} °C (${Math.round(T3)} K)`;
    if (dom.labelT1) dom.labelT1.textContent = `${t1C} °C (${T1.toFixed(1)} K)`;

    // 열역학 계산 수행
    const cycle = window.BraytonThermodynamics.calculateCycle({
      T1,
      P1,
      rp,
      T3,
    });

    const { metrics, states } = cycle;

    // 메트릭 카드 갱신
    if (dom.metricEfficiency) {
      dom.metricEfficiency.textContent = `${metrics.efficiency.toFixed(1)} %`;
    }
    if (dom.metricCarnotRatio) {
      const carnotRatio = metrics.carnot_efficiency > 0 ? (metrics.efficiency / metrics.carnot_efficiency) * 100 : 0;
      dom.metricCarnotRatio.textContent = `${carnotRatio.toFixed(1)}%`;
    }
    if (dom.metricWnet) {
      dom.metricWnet.textContent = `${metrics.w_net.toFixed(1)} kJ/kg`;
    }
    if (dom.metricWnetRatio) {
      const wnetRatio = metrics.max_wnet > 0 ? (metrics.w_net / metrics.max_wnet) * 100 : 0;
      dom.metricWnetRatio.textContent = `${Math.min(100, Math.max(0, wnetRatio)).toFixed(1)}%`;
    }
    if (dom.metricBwr) {
      dom.metricBwr.textContent = `${metrics.bwr.toFixed(1)} %`;
    }
    if (dom.metricRpOpt) {
      dom.metricRpOpt.textContent = metrics.rp_opt.toFixed(1);
    }

    // 상태점 테이블 갱신
    updateStateTable(states);

    // 차트 및 다이어그램 다시 그리기
    window.BraytonCharts.drawPvDiagram(dom.pvCanvas, cycle);
    window.BraytonCharts.drawTsDiagram(dom.tsCanvas, cycle);
    window.BraytonCharts.renderTradeoffChart(dom.tradeoffCanvas, cycle);
  }

  /**
   * 상태점 테이블 렌더링
   */
  function updateStateTable(states) {
    if (!dom.stateTableBody) return;

    const descriptions = {
      1: { name: '1 (대기 흡입)', loc: '압축기 입구' },
      2: { name: '2 (고압 공기)', loc: '압축기 출구 / 연소실 입구' },
      3: { name: '3 (초고온 가스)', loc: '연소실 출구 / 터빈 입구' },
      4: { name: '4 (배기 가스)', loc: '터빈 출구 / 대기 배출' },
    };

    let html = '';
    [1, 2, 3, 4].forEach((s) => {
      const st = states[s];
      const tempC = st.T - 273.15;
      html += `
        <tr class="hover:bg-slate-800/50 transition-colors">
          <td class="p-2 font-bold text-cyan-400">${descriptions[s].name}</td>
          <td class="p-2 text-slate-400">${descriptions[s].loc}</td>
          <td class="p-2 text-white">${st.T.toFixed(1)} K <span class="text-slate-500">(${tempC.toFixed(1)}°C)</span></td>
          <td class="p-2 text-cyan-300">${st.P.toFixed(1)}</td>
          <td class="p-2 text-slate-300">${st.v.toFixed(3)}</td>
          <td class="p-2 text-amber-300">${st.s.toFixed(3)}</td>
        </tr>
      `;
    });

    dom.stateTableBody.innerHTML = html;
  }

  /**
   * 프리셋 적용 함수
   */
  function loadPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;

    if (dom.inputRp) dom.inputRp.value = preset.rp;
    if (dom.inputT3) dom.inputT3.value = preset.t3;
    if (dom.inputT1) dom.inputT1.value = preset.t1;

    updateSimulation();
  }

  /**
   * 이벤트 리스너 등록
   */
  function setupEventListeners() {
    [dom.inputRp, dom.inputT3, dom.inputT1].forEach((input) => {
      if (input) {
        input.addEventListener('input', updateSimulation);
      }
    });

    // 윈도우 리사이즈 시 차트 재조정 (Debounce)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateSimulation();
      }, 150);
    });

    // ESC 키로 모달 닫기
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.BraytonSchematic.closeImageModal();
      }
    });
  }

  /**
   * KaTeX 수식 자동 렌더링 시도
   */
  function tryRenderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    } else {
      setTimeout(tryRenderMath, 300);
    }
  }

  /**
   * 초기화 실행
   */
  function init() {
    initDOM();
    setupEventListeners();

    // 3단계 기본 활성화 (Step 1)
    if (window.BraytonSchematic) {
      window.BraytonSchematic.activateStep(1);
    }

    // 초기 시뮬레이션 계산
    updateSimulation();

    // 수식 렌더링
    tryRenderMath();
  }

  // DOM 로드 완료 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 전역 노출
  window.BraytonApp = {
    loadPreset,
    updateSimulation,
  };
})(window);
