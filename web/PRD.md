# [PRD] 브레이튼 사이클(Brayton Cycle) 인터랙티브 엔지니어링 웹 대시보드

---

## 1. 프로젝트 개요 (Overview)

### 1.1 프로젝트 명
**가스터빈 & 터보제트 핵심 원리: 브레이튼 사이클 인터랙티브 시뮬레이터 및 기술 해설 웹 (Brayton Cycle Interactive Dashboard)**

### 1.2 배경 및 목적
* **배경:** `Brayton_Cycle_Technical_Manual.pdf` 기술 해설서에 수록된 항공 제트 엔진 및 복합화력 발전용 가스터빈의 핵심 원리인 **브레이튼 사이클(Brayton Cycle)**을 누구나 쉽게 이해할 수 있는 웹 플랫폼이 필요합니다.
* **목적:** 정적인 PDF 문서를 탈피하여, 열역학적 3단계 프로세스(**Compress ➔ Heat ➔ Expand**)와 수식, 상태 변화, 실제 엔진 내부 구조 및 $P$-$v$ / $T$-$s$ 선도를 사용자가 직접 조작하고 체감할 수 있는 인터랙티브 웹 애플리케이션을 구축합니다.

### 1.3 타깃 사용자
* 항공우주공학, 기계공학, 에너지공학 전공 학부생 및 연구원
* 가스터빈 및 발전소, 제트엔진 분야 종사 엔지니어
* 열역학 이론을 시각적으로 학습하고자 하는 일반 기술 애호가

### 1.4 핵심 가치 제안 (Value Proposition)
1. **이론과 시각화의 일체화:** 텍스트 설명, 실제 엔진/CAD 이미지, 실시간 계산 그래프를 한 화면에서 유기적으로 연결
2. **실시간 파라미터 시뮬레이션:** 압력비($r_p$), 최고 연소 온도($T_3$), 흡입 외기 온도($T_1$) 등을 조작하여 $P$-$v$/$T$-$s$ 선도 및 효율·출력 변화를 즉각 확인
3. **공학적 딜레마 직관화:** "압력비가 무조건 높다고 출력이 최대가 되는가?"에 대한 트레이드오프 곡선을 직관적으로 검증

---

## 2. 핵심 공학 이론 및 반영 요구사항 (Engineering Foundation)

본 웹페이지는 제공된 기술 해설서의 열역학적 수식 및 메커니즘을 정확히 반영해야 합니다.

### 2.1 3-Step Dance (3단계 핵심 프로세스)
* **Step 1: Compress The Air (공기 압축 과정, $1 \to 2$)**
  * 외기 저압 공기를 다단 축류 압축기를 통해 고압 단열 압축
  * 수식: $s_1 = s_2$, $T_2 = T_1 \cdot (r_p)^{\frac{\gamma - 1}{\gamma}}$
* **Step 2: Heat The Air (공기 가열 과정, $2 \to 3$)**
  * 연소실(Combustor)에서 정압(Isobaric, $\Delta P = 0$) 하에 대량 열량 투입
  * 수식: $P_2 = P_3$, $q_{in} = c_p (T_3 - T_2)$
* **Step 3: Expand The Air (공기 팽창 과정, $3 \to 4$)**
  * 고온·고압 연소 가스가 터빈을 통과하며 단열 팽창, 회전 일($\dot{W}_{output}$) 생성
  * 수식: $s_3 = s_4$, $T_4 = T_3 / (r_p)^{\frac{\gamma - 1}{\gamma}}$
  * 터빈 출력의 40~60%는 압축기 구동에 자가 소비(Back-Work Ratio)

### 2.2 핵심 지표 및 수식 모델
* **압력비 (Pressure Ratio):** $r_p = \frac{P_2}{P_1} = \frac{P_3}{P_4}$
* **이상기체 열효율 (Thermal Efficiency):**
  $$\eta_{th, Brayton} = 1 - \frac{1}{r_p^{\frac{\gamma - 1}{\gamma}}}$$
* **단위 질량당 순 출력 일 (Net Specific Work):**
  $$w_{net} = w_{turbine} - w_{compressor} = c_p (T_3 - T_4) - c_p (T_2 - T_1)$$
* **역일비율 (Back-Work Ratio, BWR):**
  $$BWR = \frac{w_{compressor}}{w_{turbine}} = \frac{T_2 - T_1}{T_3 - T_4}$$
* **최대 순 출력 발생 최적 압력비 (Optimal Pressure Ratio):**
  $$r_{p, opt} = \left(\frac{T_{max}}{T_{min}}\right)^{\frac{\gamma}{2(\gamma - 1)}}$$

---

## 3. 기능 요구사항 (Functional Requirements)

### FR-1: 인터랙티브 엔진 계통도 & 3-Step 내비게이션
* **상태 흐름도 (Schematic View):** 외기 흡입 $\to$ 압축기 $\to$ 연소실 $\to$ 터빈 $\to$ 배기 및 축(Shaft) 동력 환원 구조를 도식화
* **인터랙티브 스텝 컨트롤:** [전체 개요] [1. Compress] [2. Heat] [3. Expand] 탭을 클릭하거나 엔진 부품을 클릭하면 해당 부품에 포커스 이동
* **동적 상태 프로파일 연동:** 압축/가열/팽창에 따른 압력(P), 속도(V), 온도(T)의 실시간 프로파일 하이라이트
* **고화질 에셋 팝업/모달:** `doc_images/`에 수록된 실제 실험실 가스터빈, 단면 CAD 투시도, 연소 화염, 터빈 로터 사진을 클릭하여 고화질 확대 지원

### FR-2: 실시간 열역학 시뮬레이터 (Thermodynamic Simulator)
* **입력 제어 컨트롤러 (슬라이더 및 입력 필드):**
  * 대기 흡입 온도 $T_1$ (기본값: $288.15\text{ K} / 15^\circ\text{C}$, 범위: $-20^\circ\text{C} \sim 40^\circ\text{C}$)
  * 대기 압력 $P_1$ (기본값: $101.3\text{ kPa}$)
  * 압력비 $r_p$ (기본값: $12$, 범위: $2 \sim 35$)
  * 터빈 입구 최고 온도 $T_3$ (기본값: $1400^\circ\text{C} / 1673\text{ K}$, 범위: $900^\circ\text{C} \sim 1600^\circ\text{C}$)
  * 공기 비열비 $\gamma$ (기본값: $1.4$) 및 정압비열 $c_p$ ($1.005\text{ kJ/kg}\cdot\text{K}$)
* **실시간 계산 결과 출력 패널 (Key Metrics):**
  * 각 상태점 데이터 카드: 상태 1, 2, 3, 4의 온도($T$), 압력($P$), 엔탈피($h$)
  * 이론 열효율 $\eta_{th}$ (%)
  * 단위 질량당 순 출력 $w_{net}$ (kJ/kg)
  * 압축기 일 $w_c$ 및 터빈 일 $w_t$
  * 역일비율 (BWR) (%)
  * 최적 순출력 압력비 $r_{p, opt}$
* **인터랙티브 선도 (Interactive Diagrams):**
  * **$P$-$v$ 다이어그램:** 등온/단열 곡선과 정압 가열/방열 구간을 Canvas/SVG 기반으로 실시간 렌더링. 파라미터 변경 시 사이클 면적(순 일)이 동적으로 신축.
  * **$T$-$s$ 다이어그램:** 등엔트로피 수직선과 등압 가열 곡선 실시간 렌더링.
  * 현재 작동점 마우스 호버 시 $(P, v)$ 또는 $(T, s)$ 좌표 툴팁 표시.

### FR-3: 압력비 트레이드오프 분석기 (Trade-off Analyzer)
* **효율 vs 순출력 비교 차트 (Chart.js):**
  * X축: 압력비 $r_p$ ($2 \sim 40$)
  * Y1축: 열효율 $\eta$ (단조 증가 곡선)
  * Y2축: 순 생산 일 $w_{net}$ (포물선 형태, $r_{p, opt}$에서 극댓값 형성 후 감소)
  * 현재 사용자가 선택한 $r_p$ 지점을 차트 위에 실시간 수직 마커 및 포인트로 동기화.

### FR-4: 산업 응용 및 성능 향상 기법 탭 (Engineering Insights)
* **비교 모드:**
  * **항공 추진(터보제트/터보팬):** 높은 추중비(Power-to-Weight), 노즐을 통한 추력 생성 시뮬레이션
  * **복합화력발전(CCGT):** 가스터빈 배기가스($550^\circ\text{C}$)를 랭킨 사이클 배열회수보일러(HRSG)와 결합하여 60%+ 복합 효율 달성 메커니즘
* **3대 사이클 성능 개량 기술 인터랙티브 토글:**
  * **재생 (Regeneration):** 배기열로 압축 공기 예열 시 효율 향상 원리
  * **중간냉각 (Intercooling):** 다단 압축으로 압축기 소모 일 절감
  * **재열 (Reheat):** 다단 팽창으로 터빈 총 출력 증대

### FR-5: 반응형 & 현대적 디자인 시스템
* **다크 테마 엔지니어링 대시보드:** 항공우주 제어 센터 느낌의 세련된 다크/블루 톤 UI (Slate 900 바탕, Cyan/Blue 포인트)
* **KaTeX 수식 렌더링:** 주요 열역학 공식이 선명하고 아름답게 렌더링
* **완전 반응형 지원:** 모바일, 태블릿, 데스크톱 전 해상도 대응

---

## 4. 기술 스택 및 아키텍처 (Tech Stack & Architecture)

| 구분 | 선정 기술 | 선정 이유 |
| :--- | :--- | :--- |
| **Frontend Core** | HTML5, Modern JavaScript (ES6+ Modules) | 외부 빌드 도구 없이 브라우저에서 즉시 실행 가능한 높은 이식성 |
| **Styling** | Tailwind CSS (CDN) + Custom CSS | 유연한 레이아웃, 모던 하이테크 디자인, 빠른 UI 개발 |
| **수식 엔진** | KaTeX (CDN) | LaTeX 수식을 클라이언트에서 빠르고 미려하게 렌더링 |
| **차트/시각화** | Chart.js & HTML5 Canvas | $P$-$v$, $T$-$s$ 사이클 및 압력비 트레이드오프 곡선의 고성능 실시간 렌더링 |
| **에셋** | `../doc_images/` 경로 에셋 활용 | PDF 추출 원본 이미지(고해상도 다이어그램, CAD, 실험실 캡처) 재사용 |

---

## 5. 웹 프로젝트 디렉토리 구조 (Directory Structure)

```text
work1123/
├── Brayton_Cycle_Technical_Manual.pdf   # 원본 PDF 기술 해설서
├── doc_images/                          # 추출된 고해상도 이미지 리소스
│   ├── brayton_diagram.png
│   ├── brayton_schematic.png
│   ├── cad_internal.png
│   ├── cad_turbine.png
│   ├── engine_profile_graph.png
│   ├── lab_gasturbine.png
│   └── ...
└── web/                                 # [신규 생성] 웹 애플리케이션 루트
    ├── PRD.md                           # 본 제품 요구사항 명세서
    ├── index.html                       # 메인 인터랙티브 대시보드 페이지
    ├── css/
    │   └── styles.css                   # 커스텀 스타일, 테마 및 애니메이션
    └── js/
        ├── app.js                       # 메인 애플리케이션 초기화 및 이벤트 바인딩
        ├── thermodynamics.js            # 열역학 수식 및 상태점 계산 코어 엔진
        ├── charts.js                    # P-v, T-s 선도 및 트레이드오프 차트 렌더러
        └── schematic.js                 # 3-Step 인터랙티브 엔진 계통도 렌더러
```

---

## 6. 개발 단계별 구현 일정 (Milestones)

* **Phase 1: 기획 및 요구사항 정의 (완료)**
  * PDF 내용 완벽 분석 및 `web/PRD.md` 작성
* **Phase 2: 프로젝트 기본 구조 및 디자인 시스템 셋업**
  * `web/index.html`, `web/css/styles.css` 골격 구축 및 레이아웃 구성
* **Phase 3: 열역학 계산 모듈 (`thermodynamics.js`) 구현**
  * 압력비, 상태점($1 \sim 4$), 열효율, 순출력, 역일비율, 최적 압력비 계산 함수 작성 및 단위 테스트
* **Phase 4: 인터랙티브 차트 및 다이어그램 연동 (`charts.js`)**
  * P-v 선도, T-s 선도 Canvas 렌더링
  * 압력비에 따른 효율 vs 순출력 트레이드오프 Chart.js 연동
* **Phase 5: 3-Step 프로세스 및 엔진 계통도 인터랙션 (`schematic.js`)**
  * 압축기, 연소실, 터빈 단계별 시각적 설명 및 프로파일 이미지 팝업 모달 연동
* **Phase 6: 산업 응용 및 최종 검증**
  * CCGT, 항공 추진, 성능 개선 기법(재생/중냉/재열) 콘텐츠 완성
  * 전체 브라우저 렌더링 확인 및 QA
