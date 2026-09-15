# AI Reality Quest — MVP v0.1

## 목적
Reality → Camera → On-device AI → Evidence → Collection → Mission → Game → Monster의 최소 vertical slice를 검증한다.

## 현재 구현
- 스마트폰 카메라 입력
- 브라우저 로컬 추론: TensorFlow.js + COCO-SSD
- 발견 객체 / confidence / time / source / processing / zone을 Evidence로 기록
- 서로 다른 객체 3개 수집 미션
- GPS를 Zone으로 변환해 기록(원본 좌표는 localStorage에 저장하지 않음)
- 3개 수집 후 가위바위보 Battle
- WIN 시 마지막 수집 객체를 Monster로 승격
- LOSS 시 Monster는 생성하지 않지만 Evidence는 유지
- Evidence와 Monster는 localStorage에 저장

## 실행
카메라와 위치 권한 때문에 `file://` 직접 실행보다 localhost/HTTPS를 권장합니다.

예:
```bash
python -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속 후 `index.html`을 엽니다.

스마트폰에서 테스트하려면 같은 Wi-Fi의 PC IP를 통한 HTTP는 브라우저 보안 정책에 걸릴 수 있으므로 HTTPS 배포/터널을 권장합니다.

## MVP의 의도적 제한
- XR/AR 없음
- 멀티플레이 없음
- 사용자 custom model 학습 없음
- Mission Builder 없음
- Python 실행기 없음
- 서버 DB 없음
- 얼굴/감정 인식 없음

## 다음 개발 후보
P1: Mission Builder → Python Mission → My Character → Reality Map
P2: AR → XR → Multiplayer → physical agent

## 주의
이 MVP의 외부 CDN 의존성은 프로토타입 편의를 위한 것입니다. 상업 배포 전에는 모델/라이브러리 버전, 라이선스, 보안, 개인정보, 미성년자 보호를 다시 검토해야 합니다.
