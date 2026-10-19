# AI Reality Quest — MVP v0.5.2

현실 관측 → On-device AI → Evidence → 확정 객체 → Quest → 교체 가능한 게임 모듈 → Monster Collection → Personal Context/P3 학습 기록으로 이어지는 최소 vertical slice를 검증합니다.

## 현재 구현

- 스마트폰 카메라 입력 및 브라우저 내 TensorFlow.js + COCO-SSD 추론
- 발견 객체, confidence, 시간, source, processing, zone을 Evidence로 기록
- 누적 관측을 바탕으로 객체 확정 및 서로 다른 객체 3개 수집 Quest
- GPS 원본 좌표와 Zone을 Evidence에 기록합니다. 원본 좌표는 localStorage에 저장되므로 이 버전에서는 개인 기기 MVP 범위로 취급하며, 다중 사용자/서버 동기화 전 개인정보 검토가 필요합니다.
- 가위바위보 / 홀짝 / 주사위 / 윷놀이 / 스도쿠 4×4 게임 모듈과 정규화된 WIN/LOSE/DRAW 결과 계약
- 게임 모듈 메타데이터(버전, API 버전, 난이도, 태그) 및 게임 UI/결과 처리 오류 경계
- 잘못된 게임 결과는 공통 Battle 기록과 Monster Collection을 변경하지 않으며, 결과 처리 중 예외가 발생하면 공통 상태를 복구
- Evidence / Monster / Battle / Quest / Personal Context는 localStorage에 저장
- v0.5.1에서 구버전 localStorage 마이그레이션 추가: Quest 문자열 변환, Evidence ID/schemaVersion 보장, Personal Context schemaVersion 정규화, 잘못된 JSON/GPS/Battle pending 안전 복구
- My AI provider scaffold: 명시적으로 로컬이라고 등록한 provider만 개인 Context를 받을 수 있는 adapter 계약과 데이터 최소화 context package 제공. 실제 LLM 모델/설치 프로그램은 아직 연결되지 않았으며, local 표시는 네트워크 차단이나 샌드박스를 보장하지 않으므로 provider 구현을 검토하기 전에는 민감한 Context를 연결하면 안 됩니다.
- XR event bridge scaffold: 버전이 있는 in-memory 이벤트 계약 제공. 아직 실제 XR 렌더링, 기기 연결, 네트워크 전송은 구현하지 않았습니다.

## 실행 및 자동 검증

로컬 서버는 python -m http.server 8000 --bind 0.0.0.0 으로 실행하고, 자동 테스트는 node --test tests/*.test.cjs 로 실행합니다.

브라우저에서 http://localhost:8000을 열고 index.html을 실행합니다. 스마트폰에서는 Codespaces 포트 전달 HTTPS URL 또는 다른 HTTPS 환경을 권장합니다. GitHub Actions에서도 자동 테스트를 실행합니다.

## 알려진 MVP 제한

- Mission Builder, Python Mission 실행기, My Character, Reality Map, 실제 로컬 LLM 연결, XR 렌더링/기기 연결, 멀티플레이는 아직 구현 범위 밖입니다.
- 물리 객체 재관측은 같은 AI 라벨, 시각 유사도, 20분 이내, 15m 이내 조건에 의존합니다. 다양한 현실 환경에서의 식별 정확도는 별도 검증 대상입니다.
- GPS 원본 좌표는 arq_gps 및 evidence.location.gps에 저장될 수 있습니다.
- 학생 제작 JavaScript는 현재 신뢰된 페이지 스크립트로 실행됩니다. 샌드박싱이 없으므로 공개 배포 전에 실행 격리와 권한 제한을 구현해야 합니다.
- TensorFlow.js와 COCO-SSD 등 외부 CDN 의존성은 상업/교육 배포 전 버전, 라이선스, 공급망 보안을 재검토해야 합니다.
- 카메라/위치 권한, HTTPS, 개인정보 보호, 미성년자 보호 절차는 실제 배포 전 별도로 검토해야 합니다.

## 다음 개발 우선순위

1. Mission Builder의 선언형 미션 정의와 검증(임의 JavaScript/Python 실행 없이 시작).
2. 로컬 My AI adapter를 실제 PC 로컬 모델 런타임에 연결하고, XR bridge를 별도 소비자가 사용할 수 있게 확장.
3. 게임 모듈 메타데이터/오류 계약을 더 강화하고, 스도쿠 6×6/9×9 또는 윷놀이 보드 이동 중 하나를 별도 범위로 검증.
4. 실제 기기 카메라/GPS/재관측 및 구버전 localStorage 마이그레이션을 가능한 환경에서 검증.
5. Mission Builder/Python Mission → My Character → Reality Map → AR/XR → 멀티플레이/물리 에이전트 로드맵을 각 단계의 검증 기준과 함께 구체화.
