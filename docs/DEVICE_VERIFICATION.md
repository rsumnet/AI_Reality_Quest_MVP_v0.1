# 기기 검증 기록 (Device Verification)

이 문서는 자동화 테스트와 실제 브라우저/기기 테스트를 구분합니다. 자동화 통과만으로 카메라, GPS, 실제 브라우저 저장 지속성을 검증했다고 주장하지 않습니다.

## 1. 자동화 검증 — v0.5.1 후보

- **브랜치/PR:** \`v0.5.1-storage-migration\` / PR #8
- **마이그레이션 범위:** 구버전 Quest 문자열을 객체로 변환, Evidence의 ID와 \`schemaVersion\` 보장, Personal Context의 \`schemaVersion\` 통일, 잘못된 JSON 및 비정상 GPS/Battle pending 값을 안전한 기본값으로 복구, 정상적인 \`collected_monster\` pending 상태 보존, 이미 정상인 데이터에 대한 멱등성.
- **자동화 범위:** RPS / 홀짝 / 주사위 / 윷놀이 / 4×4 스도쿠의 공통 게임 계약, Battle 출전자/결과/기록, P3 조건, Evidence/Personal Context 마이그레이션.
- **정확한 최신 PR head에 대한 GitHub Actions 결과는 아래 기록란에 확인 후 적습니다.** 이전 커밋의 CI 성공을 최신 커밋의 성공으로 간주하지 않습니다.

| 항목 | 결과 |
|---|---|
| 최신 PR head SHA | 확인 후 기록 |
| GitHub Actions URL / run | 확인 후 기록 |
| 테스트 수 / 통과 / 실패 | 확인 후 기록 |

## 2. 최소 수동 스모크 테스트 — 대기

날짜 / 기기(OS 포함) / 브라우저 버전 / 결과를 기록합니다.

| # | 확인 항목 | 기대 결과 | 상태 |
|---|---|---|---|
| 1 | 운영 GitHub Pages | 새로고침 후 MVP v0.5.0 표시 | 대기 |
| 2 | Codespaces v0.5.1 미리보기 | MVP v0.5.1 표시 | 대기 |
| 3 | 기존 localStorage 데이터 | Evidence, Monster Collection, Quest 진행, Personal Context, Battle History가 유지됨 | 대기 |
| 4 | 마이그레이션 후 새로고침 | 유효한 데이터가 유지되고 Quest 객체 이름이 정상 표시됨 | 대기 |
| 5 | 게임 모듈 | 게임 선택 및 한 라운드 정상 작동 | 대기 |
| 6 | 카메라/객체 관측 | 대상 브라우저에서 권한, 모델 로딩, 관측 정상 작동 | 대기 |
| 7 | GPS/Zone | 테스트하는 경우 권한과 Zone/Evidence 기록 확인 | 대기 |

**주의:** v0.5.0 미리보기를 열었던 것과 동일한 Codespaces HTTPS 주소와 브라우저 프로필을 사용해야 해당 origin의 기존 localStorage를 확인할 수 있습니다. 브라우저 데이터나 localStorage를 지우지 마세요. 마이그레이션 경고가 나타나면 추가 조작을 멈추고 그 문구를 알려주세요.

## 3. 자동화만으로 확인되지 않는 사항

- 카메라 권한 및 라이브 영상.
- TensorFlow.js / COCO-SSD 실제 기기 추론 품질과 속도.
- GPS 권한, 위치 정확도, Zone 동작.
- 모바일 터치/반응형 레이아웃과 성능.
- 실제 브라우저 origin에서 새로고침/재접속 후 저장 지속성.
- 20분/15m 조건에서 물리 객체 재관측이 실제 환경에서 성립하는지.
- 개인정보 보호, 미성년자 보호, 보안, 외부 라이브러리 라이선스.

## 4. 기록 형식

\`날짜 / 기기 모델·OS / 브라우저 버전 / 항목 번호 / 통과·실패 / 메모\`
