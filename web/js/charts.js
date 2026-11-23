/**
 * charts.js
 * 브레이튼 사이클 P-v 선도, T-s 선도 (Canvas) 및 압력비 트레이드오프 차트 (Chart.js / Canvas fallback)
 */

(function (window) {
  'use strict';

  // 색상 테마 정의 (항공우주 하이테크 다크 테마)
  const THEME = {
    bg: '#0f172a', // Slate 900
    cardBg: '#1e293b', // Slate 800
    grid: 'rgba(255, 255, 255, 0.08)',
    text: '#94a3b8', // Slate 400
    textHighlight: '#f8fafc', // Slate 50
    cyan: '#06b6d4', // Cyan 500
    cyanFill: 'rgba(6, 182, 212, 0.15)',
    blue: '#3b82f6', // Blue 500
    amber: '#f59e0b', // Amber 500
    amberFill: 'rgba(245, 158, 11, 0.18)',
    red: '#ef4444', // Red 500
    green: '#10b981', // Green 500
    purple: '#a855f7', // Purple 500
  };

  /**
   * 고해상도 Canvas 초기화 헬퍼 (Retina 디스플레이 대응)
   */
  function setupHiDPI(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width;
    const height = rect.height || canvas.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);
    return { ctx, width, height };
  }

  /**
   * P-v 선도 렌더링
   * @param {HTMLCanvasElement} canvas
   * @param {Object} cycleData
   */
  function drawPvDiagram(canvas, cycleData) {
    if (!canvas || !cycleData) return;
    const { ctx, width, height } = setupHiDPI(canvas);
    const { states } = cycleData;

    // 패딩
    const pad = { top: 35, right: 35, bottom: 45, left: 65 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    ctx.clearRect(0, 0, width, height);

    // 좌표축 스케일 산출
    const vVals = [states[1].v, states[2].v, states[3].v, states[4].v];
    const pVals = [states[1].P, states[2].P, states[3].P, states[4].P];

    const minV = Math.min(...vVals) * 0.7;
    const maxV = Math.max(...vVals) * 1.15;
    const minP = 0;
    const maxP = Math.max(...pVals) * 1.2;

    const scaleX = (v) => pad.left + ((v - minV) / (maxV - minV)) * plotW;
    const scaleY = (p) => pad.top + plotH - ((p - minP) / (maxP - minP)) * plotH;

    // 1. 그리드 및 축 그리기
    drawGridAndAxes(ctx, {
      pad,
      plotW,
      plotH,
      minX: minV,
      maxX: maxV,
      minY: minP,
      maxY: maxP,
      xLabel: '비체적 v [m³/kg]',
      yLabel: '압력 P [kPa]',
      scaleX,
      scaleY,
      xDecimals: 2,
      yDecimals: 0,
    });

    // 2. 사이클 곡선 포인트 생성
    const points = window.BraytonThermodynamics.generatePvCurvePoints(cycleData, 40);

    // 3. 순 일(Net Work) 폐곡선 영역 채우기
    ctx.beginPath();
    points.forEach((pt, idx) => {
      const cx = scaleX(pt.v);
      const cy = scaleY(pt.P);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
    ctx.fillStyle = grad;
    ctx.fill();

    // 4. 사이클 외곽선 그리기
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = THEME.cyan;
    ctx.stroke();

    // 5. 방향 화살표 그리기
    drawArrowOnPath(ctx, points, 0.12, scaleX, scaleY, 'v', 'P', THEME.cyan);
    drawArrowOnPath(ctx, points, 0.38, scaleX, scaleY, 'v', 'P', THEME.amber);
    drawArrowOnPath(ctx, points, 0.62, scaleX, scaleY, 'v', 'P', THEME.cyan);
    drawArrowOnPath(ctx, points, 0.88, scaleX, scaleY, 'v', 'P', THEME.blue);

    // 6. 각 상태점 마커 및 라벨 (1, 2, 3, 4)
    const stateColors = { 1: THEME.blue, 2: THEME.cyan, 3: THEME.red, 4: THEME.amber };
    const stateLabels = {
      1: '1 (대기 유입)',
      2: '2 (압축 후)',
      3: '3 (연소실 출구)',
      4: '4 (터빈 팽창 후)',
    };

    [1, 2, 3, 4].forEach((s) => {
      const st = states[s];
      const cx = scaleX(st.v);
      const cy = scaleY(st.P);

      // 글로우 효과
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = stateColors[s];
      ctx.shadowColor = stateColors[s];
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 흰색 링
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // 상태 번호 텍스트
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = THEME.textHighlight;
      const offsetX = s === 1 || s === 4 ? 12 : -18;
      const offsetY = s === 2 || s === 3 ? -10 : 18;
      ctx.fillText(stateLabels[s], cx + offsetX, cy + offsetY);
    });

    // 중앙 타이틀 배지
    drawBadge(ctx, pad.left + 15, pad.top + 20, 'P-v 선도 (면적 = 단위 질량당 순 일 w_net)');
  }

  /**
   * T-s 선도 렌더링
   * @param {HTMLCanvasElement} canvas
   * @param {Object} cycleData
   */
  function drawTsDiagram(canvas, cycleData) {
    if (!canvas || !cycleData) return;
    const { ctx, width, height } = setupHiDPI(canvas);
    const { states } = cycleData;

    const pad = { top: 35, right: 35, bottom: 45, left: 65 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    ctx.clearRect(0, 0, width, height);

    const sVals = [states[1].s, states[2].s, states[3].s, states[4].s];
    const tVals = [states[1].T, states[2].T, states[3].T, states[4].T];

    const minS = Math.min(...sVals) - 0.2;
    const maxS = Math.max(...sVals) + 0.35;
    const minT = 0;
    const maxT = Math.max(...tVals) * 1.18;

    const scaleX = (s) => pad.left + ((s - minS) / (maxS - minS)) * plotW;
    const scaleY = (t) => pad.top + plotH - ((t - minT) / (maxT - minT)) * plotH;

    // 그리드 및 축
    drawGridAndAxes(ctx, {
      pad,
      plotW,
      plotH,
      minX: minS,
      maxX: maxS,
      minY: minT,
      maxY: maxT,
      xLabel: '엔트로피 증가량 Δs [kJ/kg·K]',
      yLabel: '절대온도 T [K]',
      scaleX,
      scaleY,
      xDecimals: 2,
      yDecimals: 0,
    });

    // 사이클 곡선 포인트 생성
    const points = window.BraytonThermodynamics.generateTsCurvePoints(cycleData, 40);

    // 폐곡선 영역 채우기
    ctx.beginPath();
    points.forEach((pt, idx) => {
      const cx = scaleX(pt.s);
      const cy = scaleY(pt.T);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
    ctx.fillStyle = grad;
    ctx.fill();

    // 외곽선
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = THEME.amber;
    ctx.stroke();

    // 화살표
    drawArrowOnPath(ctx, points, 0.12, scaleX, scaleY, 's', 'T', THEME.cyan);
    drawArrowOnPath(ctx, points, 0.38, scaleX, scaleY, 's', 'T', THEME.red);
    drawArrowOnPath(ctx, points, 0.62, scaleX, scaleY, 's', 'T', THEME.green);
    drawArrowOnPath(ctx, points, 0.88, scaleX, scaleY, 's', 'T', THEME.blue);

    // 각 상태점 마커 및 라벨
    const stateColors = { 1: THEME.blue, 2: THEME.cyan, 3: THEME.red, 4: THEME.green };
    const stateLabels = {
      1: '1 (s1)',
      2: '2 (s2 = s1)',
      3: '3 (s3)',
      4: '4 (s4 = s3)',
    };

    [1, 2, 3, 4].forEach((s) => {
      const st = states[s];
      const cx = scaleX(st.s);
      const cy = scaleY(st.T);

      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = stateColors[s];
      ctx.shadowColor = stateColors[s];
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = THEME.textHighlight;
      const offsetX = s === 1 || s === 2 ? -75 : 12;
      const offsetY = s === 2 || s === 3 ? -10 : 15;
      ctx.fillText(`${stateLabels[s]} [${Math.round(st.T)}K]`, cx + offsetX, cy + offsetY);
    });

    drawBadge(ctx, pad.left + 15, pad.top + 20, 'T-s 선도 (면적 = 순 열량 q_in - q_out = w_net)');
  }

  /**
   * 그리드 및 축 그리기 공통 함수
   */
  function drawGridAndAxes(ctx, cfg) {
    const { pad, plotW, plotH, minX, maxX, minY, maxY, xLabel, yLabel, scaleX, scaleY, xDecimals, yDecimals } = cfg;

    ctx.strokeStyle = THEME.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = THEME.text;
    ctx.font = '11px Inter, sans-serif';

    // 수평 그리드 (Y축)
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const val = minY + ((maxY - minY) * i) / ySteps;
      const y = scaleY(val);

      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(yDecimals), pad.left - 8, y);
    }

    // 수직 그리드 (X축)
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
      const val = minX + ((maxX - minX) * i) / xSteps;
      const x = scaleX(val);

      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(val.toFixed(xDecimals), x, pad.top + plotH + 8);
    }

    // 메인 축
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // 축 타이틀
    ctx.fillStyle = THEME.textHighlight;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, pad.left + plotW / 2, pad.top + plotH + 28);

    ctx.save();
    ctx.translate(pad.left - 45, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }

  /**
   * 경로 위에 방향 화살표 그리기
   */
  function drawArrowOnPath(ctx, points, ratio, scaleX, scaleY, xKey, yKey, color) {
    const idx = Math.floor(points.length * ratio);
    if (idx <= 0 || idx >= points.length - 1) return;

    const p0 = points[idx - 1];
    const p1 = points[idx + 1];

    const x0 = scaleX(p0[xKey]);
    const y0 = scaleY(p0[yKey]);
    const x1 = scaleX(p1[xKey]);
    const y1 = scaleY(p1[yKey]);

    const angle = Math.atan2(y1 - y0, x1 - x0);
    const arrowLen = 9;

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;

    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowLen, -arrowLen / 2);
    ctx.lineTo(-arrowLen, arrowLen / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * 배지 그리기
   */
  function drawBadge(ctx, x, y, text) {
    ctx.save();
    ctx.font = '11px Inter, sans-serif';
    const textW = ctx.measureText(text).width;
    const padX = 8;
    const padY = 4;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect?.(x, y - 12, textW + padX * 2, 22, 4) || ctx.rect(x, y - 12, textW + padX * 2, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + padX, y);
    ctx.restore();
  }

  /**
   * Chart.js 기반 압력비 트레이드오프 차트 생성 및 갱신
   */
  let tradeoffChartInstance = null;

  function renderTradeoffChart(canvas, cycleData) {
    if (!canvas) return;

    const params = cycleData.inputs;
    const tradeoff = window.BraytonThermodynamics.generateTradeoffSeries(params, 35);
    const currentRp = params.rp;
    const currentWnet = cycleData.metrics.w_net;
    const currentEff = cycleData.metrics.efficiency;
    const rpOpt = cycleData.metrics.rp_opt;

    // Chart.js 라이브러리가 있는지 확인
    if (window.Chart) {
      if (tradeoffChartInstance) {
        tradeoffChartInstance.destroy();
      }

      const ctx = canvas.getContext('2d');
      tradeoffChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: tradeoff.rps,
          datasets: [
            {
              label: '열효율 η_th (%)',
              data: tradeoff.efficiencies,
              borderColor: THEME.cyan,
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              yAxisID: 'yEfficiency',
              tension: 0.2,
              borderWidth: 2.5,
              pointRadius: 0,
            },
            {
              label: '순 생산 일 w_net (kJ/kg)',
              data: tradeoff.w_nets,
              borderColor: THEME.amber,
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              yAxisID: 'yWork',
              tension: 0.2,
              borderWidth: 2.5,
              pointRadius: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              labels: {
                color: THEME.textHighlight,
                font: { family: 'Inter', size: 12 },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: THEME.textHighlight,
              bodyColor: '#cbd5e1',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: '압력비 (Pressure Ratio, r_p)',
                color: THEME.text,
              },
              grid: { color: THEME.grid },
              ticks: { color: THEME.text },
            },
            yEfficiency: {
              type: 'linear',
              position: 'left',
              title: {
                display: true,
                text: '열효율 (%)',
                color: THEME.cyan,
              },
              grid: { color: THEME.grid },
              ticks: { color: THEME.cyan },
              min: 0,
              max: 80,
            },
            yWork: {
              type: 'linear',
              position: 'right',
              title: {
                display: true,
                text: '순 일 w_net [kJ/kg]',
                color: THEME.amber,
              },
              grid: { drawOnChartArea: false },
              ticks: { color: THEME.amber },
              min: 0,
            },
          },
        },
      });
    } else {
      // Fallback: 자체 Canvas로 트레이드오프 곡선 렌더링
      drawTradeoffCanvasFallback(canvas, tradeoff, currentRp, rpOpt);
    }
  }

  /**
   * Chart.js 미탑재/오프라인 대비 자체 캔버스 트레이드오프 렌더러
   */
  function drawTradeoffCanvasFallback(canvas, tradeoff, currentRp, rpOpt) {
    const { ctx, width, height } = setupHiDPI(canvas);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 35, right: 65, bottom: 45, left: 65 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const minX = 2;
    const maxX = Math.max(...tradeoff.rps);
    const maxEff = 80;
    const maxWnet = Math.max(...tradeoff.w_nets) * 1.25 || 600;

    const scaleX = (x) => pad.left + ((x - minX) / (maxX - minX)) * plotW;
    const scaleY1 = (eff) => pad.top + plotH - (eff / maxEff) * plotH;
    const scaleY2 = (w) => pad.top + plotH - (w / maxWnet) * plotH;

    // 축 및 그리드
    drawGridAndAxes(ctx, {
      pad,
      plotW,
      plotH,
      minX,
      maxX,
      minY: 0,
      maxY: maxEff,
      xLabel: '압력비 (r_p)',
      yLabel: '열효율 η [%]',
      scaleX,
      scaleY: scaleY1,
      xDecimals: 0,
      yDecimals: 0,
    });

    // 곡선 1: 열효율 (Cyan)
    ctx.beginPath();
    tradeoff.rps.forEach((rp, i) => {
      const x = scaleX(rp);
      const y = scaleY1(tradeoff.efficiencies[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = THEME.cyan;
    ctx.stroke();

    // 곡선 2: 순 생산 일 (Amber)
    ctx.beginPath();
    tradeoff.rps.forEach((rp, i) => {
      const x = scaleX(rp);
      const y = scaleY2(tradeoff.w_nets[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = THEME.amber;
    ctx.stroke();

    // 최적 압력비 표시선 (Green 점선)
    if (rpOpt >= minX && rpOpt <= maxX) {
      const optX = scaleX(rpOpt);
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(optX, pad.top);
      ctx.lineTo(optX, pad.top + plotH);
      ctx.strokeStyle = THEME.green;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = THEME.green;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`최적 r_p (${rpOpt.toFixed(1)})`, optX, pad.top - 8);
    }

    // 현재 압력비 표시선 (Red)
    if (currentRp >= minX && currentRp <= maxX) {
      const curX = scaleX(currentRp);
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(curX, pad.top);
      ctx.lineTo(curX, pad.top + plotH);
      ctx.strokeStyle = THEME.red;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = THEME.red;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(`현재 (${currentRp.toFixed(1)})`, curX, pad.top + plotH - 10);
    }

    // 범례 표시
    drawBadge(ctx, pad.left + 10, pad.top + 15, '● 열효율 η (청색, 좌축)   ● 순 일 w_net (주황색, 우축)');
  }

  window.BraytonCharts = {
    drawPvDiagram,
    drawTsDiagram,
    renderTradeoffChart,
  };
})(window);
