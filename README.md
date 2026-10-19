# AI Reality Quest — MVP v0.5.1

현실 관측 → On-device AI → Evidence → 확정 객체 → Quest → 교체 가능한 게임 모듈 → Monster Collection → Personal Context/P3 학습 기록으로 이어지는 최소 vertical slice를 검증합니다.

## 현재 구현

- 스마트폰 카메라 입력 및 브라우저 내 TensorFlow.js + COCO-SSD 추론
- 발견 객체, confidence, 시간, source, processing, zone을 Evidence로 기록
- 누적 관측을 바탕으로 객체 확정 및 서로 다른 객체 3개 수집 Quest
- GPS 원본 좌표와 Zone을 Evidence에 기록합니다. 원본 좌표는 `localStorage`에 저장되므로 이 버전에서는 개인 기기 MVP 범위로 취급하며, 다중 사용자/서버 동기화 전 개인정보 검토가 필요합니다.
- 게임 모듈을 교체해 가위바위보 / 홀짝 / 주사위 / 윷놀이 / 스도쿠 4×4 Battle 실행
- WIN 시 상대 Quest 몬스터를 Monster Collection에 수집
- 우리팀 Monster LOSE 시 Collection에서 제거하고 놓친 기록을 남김
- 사용자가 확인한 Personal Context와 Battle History를 이용해 P3 Rule Engine이 상대팀 후보 선택에만 개입하고 근거를 표시
- Evidence / Monster / Battle / Quest / Personal Context는 localStorage에 저장

## 실행 및 자동 검증

v0.5.0은 윷놀이·스도쿠 4×4 게임 모듈을 추가했으며 `main`에 병합·배포되었습니다. v0.5.1은 기존 localStorage 데이터를 보존하면서 저장 스키마 버전을 기록하고, 구버전 Quest 객체 문자열을 객체 형식으로 정규화합니다. JSON이 손상된 저장 항목은 마이그레이션 단계에서 덮어쓰지 않고 경고를 표시합니다.

```bash
python -m http.server 8000 --bind 0.0.0.0
node --test tests/*.test.cjs
```

브라우저에서 `http://localhost:8000`을 열고 `index.html`을 실행합니다. 스마트폰에서는 Codespaces 포트 전달 HTTPS URL 또는 다른 HTTPS 환경을 권장합니다. GitHub Actions에서도 자동 테스트를 실행합니다.

## 알려진 MVP 제한

- XR/AR, 멀티플레이, 사용자 custom model 학습, Mission Builder, Python 실행기, 서버 DB는 아직 구현 범위 밖입니다.
- 물리 객체 재관측은 같은 AI 라벨, 시각 유사도, 20분 이내, 15m 이내 조건에 의존합니다. 다양한 현실 환경에서의 식별 정확도는 별도 검증 대상입니다.
- GPS 원본 좌표는 `arq_gps` 및 `evidence.location.gps`에 저장될 수 있습니다.
- 학생 제작 JavaScript는 현재 신뢰된 페이지 스크립트로 실행됩니다. 샌드박싱이 없으므로 공개 배포 전에 실행 격리와 권한 제한을 구현해야 합니다.
- TensorFlow.js와 COCO-SSD 등 외부 CDN 의존성은 상업/교육 배포 전 버전, 라이선스, 공급망 보안을 재검토해야 합니다.
- 카메라/위치 권한, HTTPS, 개인정보 보호, 미성년자 보호 절차는 실제 배포 전 별도로 검토해야 합니다.

## 다음 개발

다음 단계는 v0.5.1 localStorage 마이그레이션의 실제 브라우저 검증입니다. 기존 저장 데이터가 유지되는지, 구버전 Quest 객체가 정상적으로 로드되는지, 새 스키마 버전이 기록되는지 확인한 후에만 병합·배포를 승인합니다.
