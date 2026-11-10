# AI트레이너 · 생성형 AI 기반 맞춤 운동 트레이너

운동 목표와 수준에 맞는 주간 계획을 만들고, 운동 상세와 안전 안내를 확인하는 모바일 웹 프로젝트입니다. 이 저장소는 실행 가능한 v0.1 프로토타입과 버전별 와이어프레임, 제품 요구사항 문서(PRD)를 함께 관리합니다.

## 바로 보기

| 자료 | 링크 | 현재 상태 |
| --- | --- | --- |
| v0.1 프로토타입 | [실행하기](https://smj0928-creator.github.io/generative-AI-project/) | 규칙 기반 계획 생성과 브라우저 저장 기능 |
| v0.1 와이어프레임 | [시연하기](https://smj0928-creator.github.io/generative-AI-project/wireframes/wireframe-v0.1.html) | 기존 흐름의 기준본 |
| v0.2 와이어프레임 | [시연하기](https://smj0928-creator.github.io/generative-AI-project/wireframes/wireframe-v0.2.html) | 피드백을 반영한 설계 시연 |
| PRD | [버전별 요구사항](markdown/prd.md) | v0.1과 v0.2를 한 파일에서 구분 |

> **구현 상태:** 현재 실행되는 `index.html`은 v0.1 프로토타입입니다. 실제 생성형 AI 호출, 계정, 서버와 실시간 사용자 데이터는 연결되어 있지 않습니다. v0.2 와이어프레임은 AI가 연결될 화면과 안전 절차를 보여 주는 설계안입니다. 데모 기록은 현재 브라우저에만 저장됩니다.

## 버전별 초점

### v0.1 · 기준본

- 운동 목표·수준·횟수·시간을 선택해 주간 계획을 체험합니다.
- 운동 상세, 준비 확인, 완료 기록, XP와 성장 화면을 살펴봅니다.
- 리그, 배지, 공개 루틴과 비슷한 운동 친구 화면을 시연합니다.
- [v0.1 와이어프레임](wireframes/wireframe-v0.1.html)은 이후 버전과 비교할 수 있도록 보존합니다.

### v0.2 · 피드백 반영 와이어프레임

- 첫 사용자는 계획 만들기 안내부터 시작합니다. 리그와 순위는 이번 와이어프레임에서 제외했습니다.
- 피하고 싶은 부위는 선택형으로 받아 계획과 안전 안내에 반영합니다.
- 계획 생성 과정에 AI 입력값·결과 형식·안전 검토 지점을 드러냅니다. 실제 서비스 구현 시 서버를 통해 LLM을 호출하고, 실패하면 규칙 기반 계획으로 이어지는 구성을 목표로 합니다.
- 통증·질환 상담 안내와 입문자 강도 상한을 항상 확인할 수 있게 합니다.
- 핵심 흐름인 계획 생성·운동 상세·안전을 우선하고 부가 기능의 비중을 줄입니다.
- 전화번호 입력, 끌 수 있는 안전 안내, 동작하지 않는 알림 설정을 화면에서 제거합니다.

상세한 결정과 향후 범위는 [PRD](markdown/prd.md)에 기록합니다.

## 저장소 구조

```text
generative-AI-project/
├─ index.html                 # 실행 가능한 v0.1 프로토타입
├─ css/                       # 프로토타입 스타일
├─ js/                        # 프로토타입 동작
├─ data/                      # 프로토타입 데이터
├─ assets/images/             # 프로토타입 이미지 자산
├─ wireframe.html             # 초기 와이어프레임 보존본
├─ wireframes/
│  ├─ wireframe-v0.1.html     # 시연 가능한 v0.1 기준본
│  └─ wireframe-v0.2.html     # 피드백 반영 설계 시연
├─ markdown/
│  └─ prd.md                  # 버전별 제품 요구사항
├─ README.md
├─ PRD.md                     # 팀의 기존 요구사항 문서
└─ .nojekyll                  # GitHub Pages 설정
```

## 확인할 흐름

1. [v0.1 프로토타입](https://smj0928-creator.github.io/generative-AI-project/)에서 기존 기능을 살펴봅니다.
2. [v0.1 와이어프레임](wireframes/wireframe-v0.1.html)과 [v0.2 와이어프레임](wireframes/wireframe-v0.2.html)을 각각 열어 첫 사용, 계획 생성, 안전 안내의 변화를 비교합니다.
3. v0.2에서는 피하고 싶은 부위 선택, 계획 결과의 안전 확인, 운동 완료 후 기록과 진행률 변화를 시연합니다.

## GitHub Pages 배포

이 프로젝트의 저장소는 [`smj0928-creator/generative-AI-project`](https://github.com/smj0928-creator/generative-AI-project)이며, Pages 주소는 [`https://smj0928-creator.github.io/generative-AI-project/`](https://smj0928-creator.github.io/generative-AI-project/)입니다.

변경 파일을 올릴 때는 저장소의 폴더 구조를 유지합니다. 새로 저장소를 구성할 경우 `index.html`과 `README.md`뿐 아니라 `css/`, `js/`, `data/`, `assets/`, `wireframes/`, `markdown/`, `PRD.md`, `.nojekyll` 등 프로젝트의 **모든 파일과 폴더**를 저장소 루트에 올립니다. Pages는 `main` 브랜치의 `/ (root)`에서 배포합니다. 배포 후 위의 각 링크가 열리는지 확인합니다.

## 문서·이미지 보완 예정

- v0.1과 v0.2의 모바일 화면 스크린샷을 준비해 README에 추가합니다.
- 실제 AI 연결을 구현할 때 입력 형식, 서버 호출, 출력 검증, 오류 시 대체 계획과 안전 필터의 동작을 문서와 화면에 반영합니다.
