/**
 * schematic.js
 * 3-Step 인터랙티브 엔진 계통도 및 상세 분석, 이미지 모달 뷰어
 */

(function (window) {
  'use strict';

  // 3단계 프로세스 상세 정보 데이터 정의
  const STEPS_DATA = {
    1: {
      id: 1,
      title: 'Step 1: Compress The Air (공기 압축 과정)',
      stateRange: '상태 1 ➔ 상태 2',
      thermoProcess: '등엔트로피 단열 압축 (Isentropic Compression, s₁ = s₂)',
      summary: '외기에서 흡입된 저압 대기를 축류 압축기(Axial Compressor)의 회전 날개(Rotor)와 고정 날개(Stator)를 다단으로 통과시키며 초고압으로 압축합니다.',
      details: [
        '초록색 선(Pressure): 압축 영역을 거치며 압력이 급상승합니다.',
        '빨간색 선(Velocity): 압축기를 거치며 속도가 제어되고, 연소실 진입 전 디퓨저를 통해 감속(화염 안정화)됩니다.',
        '파란색 선(Temp): 압축 일(Ẇin)이 기체 내부 에너지로 변환되어 온도가 단열 상승합니다.',
      ],
      backWorkRatioNote: '압축기를 구동하기 위해 터빈에서 생산한 기계적 일의 40~60%가 축(Shaft)을 통해 소모됩니다.',
      image: 'images/step1_compress.png',
      imageCaption: '[화면 캡처 4] 다단 축류식 압축기 단면 및 압력·속도 프로파일',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    2: {
      id: 2,
      title: 'Step 2: Heat The Air (공기 가열 과정)',
      stateRange: '상태 2 ➔ 상태 3',
      thermoProcess: '정압 가열 (Isobaric Heat Addition, ΔP = 0, P₂ = P₃)',
      summary: '압축된 고압 공기에 케로신(항공유) 또는 천연가스를 고압 분사하여 연속 연소시킴으로써 대량의 열량(Q̇in)을 투입합니다.',
      details: [
        '이상 브레이튼 사이클에서는 압력 손실(Pressure Drop)이 없는 이상 정압 가열로 간주합니다.',
        '연소 화염(Flame)을 통해 기체 온도가 1,400°C~1,600°C 수준으로 급상승합니다.',
        '온도 상승과 함께 기체의 비체적(v)과 엔탈피(h)가 폭발적으로 팽창합니다.',
      ],
      backWorkRatioNote: '연소실은 추가적인 기계적 일(Work)을 하거나 소비하지 않고, 순수 열에너지(Heat)를 화학적으로 공급합니다.',
      image: 'images/step2_flame.png',
      imageCaption: '[화면 캡처 5] 연소실 내부 고온 등압 연소 화염',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
    3: {
      id: 3,
      title: 'Step 3: Expand The Air (공기 팽창 과정)',
      stateRange: '상태 3 ➔ 상태 4',
      thermoProcess: '등엔트로피 단열 팽창 (Isentropic Expansion, s₃ = s₄)',
      summary: '고온·고압의 연소 가스가 터빈(Turbine) 블레이드를 밀어내며 단열 팽창하여 강력한 기계적 회전 일(Ẇoutput)과 제트 추력을 생성합니다.',
      details: [
        '초고온 가스가 터빈 회전 날개를 회전시키며 회전 샤프트 동력을 발생시킵니다.',
        '터빈 출력의 일부는 전방의 압축기를 구동하고, 잉여 동력은 발전기 구동 또는 고속 배기 추력(Thrust)으로 변환됩니다.',
        '가스가 팽창함에 따라 압력과 온도는 급격히 하강합니다.',
      ],
      backWorkRatioNote: '터빈 출력이 압축기 소모 일보다 커야만 순 생산 일(wnet > 0) 및 가속 추력이 발생합니다.',
      image: 'images/step3_turbine_rotor.png',
      imageCaption: '[화면 캡처 6] 고온 가스를 받아 회전하는 정밀 터빈 로터 블레이드',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  };

  /**
   * 스텝 상세 뷰 활성화
   * @param {number} stepNumber (1, 2, 3)
   */
  function activateStep(stepNumber) {
    const data = STEPS_DATA[stepNumber] || STEPS_DATA[1];

    // 스텝 탭 버튼 스타일 갱신
    document.querySelectorAll('.step-tab-btn').forEach((btn) => {
      const s = parseInt(btn.dataset.step, 10);
      if (s === stepNumber) {
        btn.classList.add('active-step-tab');
        btn.classList.remove('inactive-step-tab');
      } else {
        btn.classList.remove('active-step-tab');
        btn.classList.add('inactive-step-tab');
      }
    });

    // 스텝 콘텐츠 영역 갱신
    const container = document.getElementById('step-detail-container');
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <!-- 텍스트 영역 -->
        <div class="lg:col-span-7 space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${data.badgeColor}">
              ${data.stateRange}
            </span>
            <span class="text-xs text-slate-400 font-mono">
              ${data.thermoProcess}
            </span>
          </div>

          <h3 class="text-xl md:text-2xl font-bold text-white">${data.title}</h3>
          <p class="text-slate-300 text-sm leading-relaxed">${data.summary}</p>

          <div class="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">핵심 상태 변화 & 관측 포인트</h4>
            <ul class="space-y-1.5 text-xs text-slate-300">
              ${data.details.map((d) => `<li class="flex items-start gap-2"><span class="text-cyan-400 mt-0.5">•</span><span>${d}</span></li>`).join('')}
            </ul>
          </div>

          <div class="bg-blue-950/40 rounded-xl p-3 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
            <span class="text-base">💡</span>
            <div>
              <strong class="text-blue-100">동력 전달 메커니즘:</strong> ${data.backWorkRatioNote}
            </div>
          </div>
        </div>

        <!-- 이미지 영역 -->
        <div class="lg:col-span-5 flex flex-col items-center">
          <div class="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl"
               onclick="window.BraytonSchematic.openImageModal('${data.image}', '${data.title}')">
            <img src="${data.image}" alt="${data.title}" class="w-full h-48 md:h-56 object-cover transition-transform duration-300 group-hover:scale-105" />
            <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span class="bg-cyan-500 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                🔍 크게 보기
              </span>
            </div>
          </div>
          <p class="text-center text-xs text-slate-400 mt-2 font-mono">${data.imageCaption}</p>
        </div>
      </div>
    `;
  }

  /**
   * 이미지 라이트박스 모달 열기
   */
  function openImageModal(imgSrc, title) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');

    if (modal && modalImg) {
      modalImg.src = imgSrc;
      if (modalTitle) modalTitle.textContent = title || '엔지니어링 세부 이미지';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * 이미지 라이트박스 모달 닫기
   */
  function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = 'auto';
    }
  }

  window.BraytonSchematic = {
    STEPS_DATA,
    activateStep,
    openImageModal,
    closeImageModal,
  };
})(window);
