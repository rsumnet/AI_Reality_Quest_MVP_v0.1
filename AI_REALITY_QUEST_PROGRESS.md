# AI Reality Quest — 진행 상황 및 다음 세션 인수 문서

작성: 2026-10-19
목적: 저장소의 실제 상태, 확인된 결과, 미검증 영역과 다음 개발 순서를 유지합니다. 이 문서는 라이브 저장소와 CI를 다시 확인한 뒤 사용해야 합니다.

## 1. 현재 저장소 상태

- 저장소: https://github.com/rsumnet/AI_Reality_Quest_MVP_v0.1
- main: PR #8 병합 커밋 2f0f8ba5c1fa384c7ac2327c61cf23e1fa3422cc
- v0.5.1 PR: https://github.com/rsumnet/AI_Reality_Quest_MVP_v0.1/pull/8 — 병합 완료
- PR #8 head 3d0dd3303e23f383a739c5d69353121bcaeef93f의 Verify MVP run #94 성공; main merge SHA의 Verify MVP run #95 성공
- GitHub Pages deployment run #17 성공. 사용자는 병합 전 운영 사이트 v0.5.0과 v0.5.1 Codespaces 미리보기를 확인했습니다. 병합 이후 운영 Pages에 v0.5.1이 표시되는지는 사용자 직접 새로고침 확인이 아직 필요합니다.
- 현재 작업 브랜치: v0.5.2-core-expansion (v0.5.1 병합 이후 main에서 분기)
- v0.5.2 Draft PR: https://github.com/rsumnet/AI_Reality_Quest_MVP_v0.1/pull/9
- PR #9 코드 검증: Verify MVP run #101 성공, 59 tests / 59 pass / 0 fail on code/test head 3c490963278545aafab863851da36ab1d04426f1. 이 인수 문서의 추가 수정으로 PR head가 다시 바뀌므로, 병합 전에는 최신 Actions run이 성공인지 다시 확인합니다.

## 2. v0.5.1에서 완료한 것

- 구버전 문자열 Quest 기록을 객체 형태로 변환.
- Evidence 레코드의 ID와 schemaVersion 보장, Personal Context schemaVersion 정규화.
- 잘못된 JSON 및 비정상 GPS/Battle pending 값을 안전한 기본값으로 복구하고, 유효한 legacy collected_monster pending 상태는 보존.
- 이미 정상인 데이터에 대해 멱등성 테스트.
- 사용자 보고: 운영 페이지 v0.5.0 표시, Codespaces preview v0.5.1 표시, 대부분의 제안 테스트가 정상. 항목별 테스트 결과와 기기/OS/브라우저 버전은 모두 기록되지 않았으므로 이를 추측해서 PASS로 바꾸지 않습니다.
- 카메라, 모델 추론, GPS, 물리 객체 재관측 정확도는 별도 실기기 검증 대상입니다.

## 3. v0.5.2 작업 중 범위

- 게임 모듈 레지스트리에 정규화된 metadata 계약 추가: API 버전, 모듈 버전, 난이도, 태그.
- games/game-runtime.js 추가: UI 렌더 예외, 잘못된 WIN/LOSE/DRAW 결과, resolve 예외/Promise 결과를 공통 Battle 상태를 변경하기 전에 차단.
- 게임 실행/결과 처리 중 예외가 발생하면 Battle/Monster/Quest 상태를 복구.
- core/my-ai-runtime.js 추가: 명시적으로 로컬인 provider adapter 계약, 사용자가 확인한 Personal Context만 포함하는 context package, Evidence 필드 최소화. 실제 LLM 모델이나 설치기는 아직 연결하지 않음. local 표시는 provider가 네트워크를 사용하지 않는다는 기술적 보장이 아니므로, 구현 검토 전에는 민감한 Context를 연결하지 않음.
- core/xr-bridge.js 추가: 버전이 있는 in-memory 이벤트 구독/발행 계약. 네트워크 전송이나 XR 렌더링은 아직 없음.
- 테스트로 위 계약과 실패 경계를 검증하고, README를 업데이트.
- PR #9는 Draft 상태이며 병합하지 않았습니다. 최신 head CI가 통과한 뒤 Codespaces 미리보기에서 v0.5.2 버전, 게임 메타데이터 표시, 게임 한 라운드를 최소 확인하고 사용자 승인 후에만 병합합니다.

## 4. 다음 개발 순서

1. v0.5.2 런타임 안정화: 게임 메타데이터, 오류 격리, My AI local-provider 계약, XR 이벤트 계약을 자동 테스트로 고정합니다.
2. Mission Builder: 먼저 선언형 미션 스키마(목표, 조건, 증거 기준, 완료 규칙)를 만들고, 미션 검증/실행 엔진과 UI를 분리합니다. 임의 학생 코드 실행은 샌드박싱이 생기기 전까지 허용하지 않습니다.
3. 실제 로컬 My AI: PC 설치형 로컬 LLM runtime adapter를 선정하고, SQ 검사 결과 + 사용자가 확인한 Personal Context를 로컬에서만 공급합니다. 네트워크로 전송하지 않는 기본값과 명시적 사용자 선택을 유지합니다.
4. XR 연결 채널: XR은 이벤트 계약을 소비하는 별도 View/adapter로 연결하고, 공통 Evidence/My AI/Quest 상태를 중복 구현하지 않습니다.
5. 게임 확장: 스도쿠 6×6/9×9 또는 윷놀이 보드 이동을 한 번에 하나씩, 수용 기준과 회귀 테스트를 포함해 확장합니다.
6. 실기기/데이터 검증: 실제 legacy localStorage 데이터가 있는 환경이 준비되면 마이그레이션을 확인합니다. 브라우저 데이터를 지우지 말고, 데이터 이상이 보이면 추가 조작을 중지합니다.
7. 장기 로드맵: My Character → Reality Map → AR/XR → 멀티플레이 → 물리 에이전트. 각 단계는 이전 핵심 루프를 깨뜨리지 않는다는 테스트 기준을 갖춰야 합니다.

## 5. 비협상 원칙

- Human decides; AI executes while remaining controllable.
- 증거와 테스트로 확인한 것만 완료라고 보고합니다.
- Evidence, Personal Context, My AI, P3, Monster Collection, Battle History와 사용자 데이터 연속성은 게임보다 우선하는 공통 핵심입니다.
- 게임 모듈은 교체 가능해야 하며, 코어 상태를 직접 소유하거나 별도로 저장하지 않습니다.
- 자동 테스트 성공만으로 카메라/GPS/모델/실제 브라우저 동작을 검증했다고 주장하지 않습니다.
- main 병합 전 사용자 승인과 필요한 최소 실기기 검증을 유지합니다.
