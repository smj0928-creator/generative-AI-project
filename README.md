# AI트레이너 모바일 프로토타입

운동 조건을 입력해 주간 계획을 만들고, 운동 상세·안전 안내·완료 기록·9종 배지 도감·TOP 10 리그·인기 트레이너 공개 루틴을 체험하는 **모바일 전용 웹 프로토타입**입니다.

> 이 프로젝트는 수업/기획 검증용 로컬 데모입니다. 실제 생성형 AI API, 로그인, 서버, 실시간 멀티플레이는 연결되어 있지 않습니다. 계획은 브라우저에서 규칙 기반으로 생성되며 데이터는 `localStorage`에만 저장됩니다.

## 파일

- `index.html` — 루트 실행 파일
- `css/style.css` — 화면 디자인과 모바일 레이아웃
- `js/app.js` — 인터랙션, JSON 운동 템플릿 로드, localStorage 기능
- `data/workout-templates.json` — 운동 목표별 주간 운동 템플릿 데이터
- `wireframe.html` — 별도로 보존한 회색 와이어프레임
- `.nojekyll` — GitHub Pages 정적 배포용

## 프로젝트 구조

```text
AItrainer-mobile-prototype/
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  └─ app.js
├─ data/
│  └─ workout-templates.json
├─ wireframe.html
├─ README.md
└─ .nojekyll
```

## 실행

설치 없이 `index.html`을 브라우저에서 열면 됩니다. 스마트폰 목업 프레임 없이 서비스 화면만 표시되며, 모바일 기준 최대 430px 콘텐츠 폭으로 안정적으로 유지됩니다.

## 확인할 시연 흐름

1. 로그인 화면에서 번호 입력 없이 **다음** 또는 **둘러보기로 바로 시작**
2. 홈에서 목표·수준·횟수·시간·주의사항 입력
3. **이번 주 계획 생성**
4. 운동 카드에서 **보기** → 운동 상세와 안전 안내 확인
5. **운동 완료하기** → 성장 탭의 진행률과 전체 배지 목록 확인
6. 함께 탭에서 32명 전체 순위, 10위 승급선과 `10위 이내 + 700점` 조건 확인
7. **상위 리그 보기**로 TOP 10과 인기 트레이너 루틴 열기
8. 유사 사용자 매칭과 설정의 닉네임 저장 확인
9. 페이지를 새로 열어도 기록이 유지되는지 확인

## GitHub Pages 배포

1. GitHub에서 새 저장소를 만듭니다. 예: `ai-trainer-prototype`
2. 이 폴더의 `index.html`, `wireframe.html`, `README.md`, `.nojekyll`을 저장소 최상단에 업로드합니다.
3. 저장소 **Settings → Pages**로 이동합니다.
4. **Build and deployment**에서 **Deploy from a branch**를 선택합니다.
5. Branch를 `main`, 폴더를 `/ (root)`로 선택하고 **Save**합니다.
6. 배포 완료 후 표시되는 `https://사용자명.github.io/ai-trainer-prototype/` 주소를 엽니다.

와이어프레임은 같은 주소 뒤에 `wireframe.html`을 붙여 확인할 수 있습니다.

## 초기화

앱의 **설정 → 데모 데이터 초기화**를 누르면 현재 브라우저에 저장된 프로토타입 기록이 삭제됩니다.
