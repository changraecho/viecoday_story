# Viecoday Story - AI 기반 커뮤니티 플랫폼

한국어 커뮤니티를 위한 AI 기반 컨텐츠 생성 플랫폼입니다.

## 🌟 주요 기능

### 📝 커뮤니티 기능
- 실시간 글 작성 및 공유
- 댓글 및 좋아요 시스템
- 반응형 모바일 UI
- Firebase 실시간 데이터베이스

### 🤖 AI 컨텐츠 봇
- **DeepSeek API 연동**으로 고품질 한국어 컨텐츠 생성
- 관리자 커스텀 프롬프트 지원
- 하루 1000회 API 호출 제한
- 자동/수동 컨텐츠 생성
- 백업 템플릿 시스템

### 👨‍💼 관리자 패널
- 글 관리 (조회, 삭제, 검색)
- 봇 설정 및 제어
- API 사용량 모니터링
- 실시간 로그 확인
- 세션 기반 로그인 (24시간 유지)

## 📁 파일 구조

```
viecoday_story/
├── index.html              # 메인 페이지
├── admin.html              # 관리자 패널
├── style.css               # 메인 스타일
├── admin.css               # 관리자 스타일
├── firebase-config.js      # Firebase 설정
├── firebase-script.js      # Firebase 연동
├── content-bot.js          # AI 컨텐츠 봇
├── deepseek-api.js         # DeepSeek API 연동
├── admin.js                # 관리자 패널 로직
└── README.md               # 프로젝트 문서
```

## 🚀 설치 및 실행

### 1. Firebase 설정
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화
3. Google Analytics 연동
4. `firebase-config.js`에 설정 정보 입력

### 2. DeepSeek API 설정
1. [DeepSeek](https://api.deepseek.com/)에서 API 키 발급
2. 관리자 패널 → API 설정 → API 키 입력

### 3. 로컬 서버 실행
```bash
# 간단한 HTTP 서버 실행
python -m http.server 8000
# 또는
npx serve .
```

## 🔧 설정

### 관리자 계정
- **비밀번호**: `viecoday12#$`
- **세션 유지**: 24시간

### API 제한
- **일일 호출 제한**: 1000회
- **모델**: deepseek-v3
- **응답 형식**: JSON (`{"title": "제목", "content": "내용"}`)

## 🎯 AI 컨텐츠 생성

### 프롬프트 예시
```
한글로 아르바이트를 하면서 겪는 에피소드에 대한 커뮤니티 글을 써줘. 
주제는 아르바이트에서의 비밀연애, 짝사랑, 진상손님, 악덕사장님 등의 내용을 자유롭게 작성해줘. 
제목과 내용을 포함해서 작성해줘. 일상 커뮤니티처럼 반말로 써줘.
```

### 키워드 시스템
- **주제**: 일상, 음식, 여행, 취미, 운동, 독서 등
- **톤**: 재미있는, 따뜻한, 진지한, 가벼운
- **스타일**: 정보성, 상호작용, 경험공유

## 📊 데이터 구조

### Firestore 컬렉션
- `posts` - 게시글 데이터
- `bot_config` - 봇 설정
- `bot_logs` - 봇 활동 로그
- `deepseek_config` - API 설정
- `deepseek_usage` - API 사용량
- `deepseek_logs` - API 호출 로그

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Firestore
- **AI**: DeepSeek API
- **Analytics**: Google Analytics

## 🔄 백업 시스템

DeepSeek API 실패 시 자동으로 기본 템플릿 시스템으로 전환:
- 프롬프트 키워드 분석
- 주제별 템플릿 매칭
- 랜덤 컨텐츠 생성

## 🎨 디자인 특징

- **포인트 컬러**: `#FFAB02` (주황색)
- **프로필 아바타**: 짙은 회색 배경 (`#4a4a4a`)
- **반응형 디자인**: 모바일/데스크톱 모두 지원
- **모바일 앱 스타일**: 네이티브 앱과 유사한 UX

## 🔒 보안

- 관리자 페이지는 비밀번호로 보호
- 세션 기반 로그인 유지 (24시간)
- API 키는 Firebase에 암호화 저장
- XSS 방지를 위한 기본적인 입력 검증

## 🚀 배포 방법

### 1. Vercel로 배포 (추천)
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 배포
vercel

# 커스텀 도메인 설정 (선택사항)
vercel --prod
```

### 2. GitHub Pages로 배포
1. GitHub 리포지토리 생성
2. 모든 파일을 리포지토리에 푸시
3. Settings > Pages에서 소스를 main branch로 설정
4. 배포된 URL 확인

### 3. Netlify로 배포
1. [Netlify](https://netlify.com)에 로그인
2. "New site from Git" 선택
3. 리포지토리 연결
4. 자동 배포 완료

## 📝 개발 로그

### v2.0 (현재)
- ✅ DeepSeek API 연동 완료
- ✅ 관리자 패널 API 설정 탭 추가
- ✅ 사용량 모니터링 시스템 구현
- ✅ 에러 핸들링 및 백업 시스템 강화
- ✅ Firebase 실시간 데이터베이스 연동
- ✅ 세션 기반 로그인 시스템

### v1.0
- ✅ 기본 커뮤니티 기능 구현
- ✅ 관리자 패널 기본 기능
- ✅ 하드코딩된 컨텐츠 템플릿 시스템
- ✅ 로컬 스토리지 기반 데이터 저장

## 🐛 알려진 이슈

1. **브라우저 캐시 문제**: 파일 업데이트 시 강제 새로고침 필요
2. **Firebase 권한**: 일부 기능에서 Firestore 권한 오류 발생 가능
3. **DeepSeek API 연동**: 브라우저 캐시로 인한 스크립트 로딩 이슈

## 🔮 향후 개발 계획

- [ ] DeepSeek API 연동 최적화
- [ ] 다중 AI 모델 지원 (OpenAI, Claude 등)
- [ ] 사용자 인증 시스템
- [ ] 댓글 알림 기능
- [ ] 컨텐츠 카테고리 시스템
- [ ] 모바일 앱 버전

## 📱 브라우저 지원

- Chrome (권장)
- Safari
- Firefox
- Edge

## 🚀 빠른 시작

1. 모든 파일을 웹 서버에 업로드
2. Firebase 프로젝트 설정 완료
3. DeepSeek API 키 발급 및 설정
4. `index.html`을 메인 페이지로 설정
5. `admin.html`로 관리자 페이지 접근
6. 비밀번호 `viecoday12#$`로 로그인

---

💡 **팁**: 로컬에서 테스트할 때는 Live Server 확장 프로그램을 사용하세요!

## 👥 기여

이 프로젝트는 개인 프로젝트입니다. 문제 발견 시 이슈를 제기해 주세요.

## 📄 라이센스

MIT License