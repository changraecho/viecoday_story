# Viecoday Story - 베트남 커뮤니티 플랫폼

베트남 사용자를 위한 AI 기반 커뮤니티 플랫폼입니다.

## 🌟 주요 기능

### 📝 커뮤니티 기능
- 실시간 글 작성 및 공유
- 댓글 및 좋아요 시스템 (개별 댓글 좋아요 포함)
- 개별 글 URL 공유 기능 (/post/[id] 라우팅)
- 반응형 모바일 UI
- Firebase 실시간 데이터베이스
- 베트남 현지화 (시간대, 언어)

### 🎨 UI/UX 기능
- **50px 통일 헤더** (홈, 글상세, 글작성 페이지)
- **하단 탭바** (60px 높이, 5개 아이콘)
  - 홈, 브랜드관, 좋아요목록, 커뮤니티, 마이메뉴
- **공유 기능**: Facebook 공유, 링크 복사
- **베트남어 인터페이스**: 완전 현지화
- **베트남 시간대**: Asia/Ho_Chi_Minh

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
├── firebase-script.js      # Firebase 연동 & 라우팅
├── content-bot.js          # AI 컨텐츠 봇
├── deepseek-api.js         # DeepSeek API 연동
├── admin.js                # 관리자 패널 로직
├── vercel.json             # Vercel SPA 설정
├── icons/                  # 네비게이션 아이콘
│   ├── home_icon.png
│   ├── brand_icon.png
│   ├── like_icon.png
│   ├── community_icon.png
│   └── mymenu_icon.png
└── README.md               # 프로젝트 문서
```

## 🚀 배포 정보

### 라이브 URL
- **커뮤니티**: https://viecoday-story.vercel.app/
- **관리자**: https://viecoday-story.vercel.app/admin.html

### 네비게이션 연결
- **홈**: https://www.viecoday.com/
- **브랜드관**: https://www.viecoday.com/brand
- **좋아요목록**: https://www.viecoday.com/favorite
- **커뮤니티**: https://viecoday-story.vercel.app/
- **마이메뉴**: https://www.viecoday.com/mypage

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Firestore
- **AI**: DeepSeek API
- **Analytics**: Google Analytics
- **Deployment**: Vercel
- **Routing**: SPA 라우팅 (History API)

## 🎯 핵심 기능 설명

### 라우팅 시스템
```javascript
// URL 구조
/ → 홈페이지 (글 목록)
/write → 글 작성 페이지
/post/[id] → 개별 글 상세 페이지
```

### 베트남 현지화
- **시간대**: Asia/Ho_Chi_Minh
- **언어**: 베트남어 UI
- **날짜 형식**: vi-VN 로케일

### 하단 탭바 네비게이션
```css
/* 60px 고정 높이, 5개 아이콘 */
.bottom-tab-bar {
    height: 60px;
    position: fixed;
    bottom: 0;
}

.tab-icon {
    width: 30px;
    height: 30px;
}
```

## 🔧 설정

### 관리자 계정
- **비밀번호**: `viecoday12#$`
- **세션 유지**: 24시간

### API 제한
- **일일 호출 제한**: 1000회
- **모델**: deepseek-v3
- **응답 형식**: JSON (`{"title": "제목", "content": "내용"}`)

## 📊 데이터 구조

### Firestore 컬렉션
```javascript
// posts 컬렉션
{
  id: "document_id",
  title: "글 제목",
  content: "글 내용",
  author: "Ẩn danh",
  date: "2024-08-02T...",
  likes: 0,
  liked: false,
  comments: [
    {
      id: "comment_id",
      content: "댓글 내용",
      date: "2024-08-02T...",
      likes: 0,
      liked: false
    }
  ]
}
```

## 🎨 디자인 시스템

### 컬러 팔레트
- **브랜드 컬러**: `#FFAB02` (주황색)
- **배경색**: `#ffffff` (흰색)
- **텍스트**: `#333` (진한 회색)
- **테두리**: `#eee` (연한 회색)

### 반응형 레이아웃
- **모바일 퍼스트** 디자인
- **50px 헤더** (모든 페이지 통일)
- **60px 하단 탭바** (홈에서만 표시)
- **적응형 여백** (탭바/헤더 고려)

## 🔄 SPA 라우팅

### Vercel 설정
```json
{
  "rewrites": [
    {
      "source": "/((?!.*\\.(png|jpg|jpeg|gif|svg|ico|css|js|json|txt|xml|woff|woff2|ttf|eot)).*)",
      "destination": "/index.html"
    }
  ]
}
```

### JavaScript 라우터
```javascript
class Router {
  routes = {
    '/': () => this.showHomePage(),
    '/write': () => this.showWritePage(),
    '/post/:id': (id) => this.showPostPage(id)
  }
}
```

## 📱 모바일 최적화

### 터치 인터페이스
- **36px 최소 터치 영역** (헤더 버튼)
- **플로팅 액션 버튼** (글 작성)
- **고정 댓글 입력창** (글 상세)
- **스와이프 친화적** 네비게이션

### 성능 최적화
- **이미지 최적화** (30x30px 아이콘)
- **CSS 애니메이션** (부드러운 전환)
- **지연 로딩** (Firebase 대기)

## 🚀 배포 방법

### 1. Vercel로 배포 (현재 방식)
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 2. 환경 설정
1. Firebase 프로젝트 설정
2. `firebase-config.js` 설정 정보 입력
3. DeepSeek API 키 설정
4. `vercel.json` SPA 설정 확인

## 📝 개발 로그

### v3.0 (2024-08-02) - 베트남 현지화 & UI 개선
- ✅ 베트남 시간대 및 언어 현지화
- ✅ 개별 글 URL 라우팅 시스템 구현
- ✅ 하단 탭바 네비게이션 (5개 아이콘)
- ✅ 50px 통일 헤더 디자인
- ✅ 댓글 좋아요 기능 구현
- ✅ 공유 기능 개선 (Facebook, 링크복사)
- ✅ Vercel SPA 라우팅 최적화
- ✅ UI/UX 대폭 개선

### v2.0 (이전)
- ✅ DeepSeek API 연동 완료
- ✅ 관리자 패널 API 설정 탭 추가
- ✅ 사용량 모니터링 시스템 구현
- ✅ Firebase 실시간 데이터베이스 연동

### v1.0 (초기)
- ✅ 기본 커뮤니티 기능 구현
- ✅ 관리자 패널 기본 기능
- ✅ 하드코딩된 컨텐츠 템플릿 시스템

## 🐛 해결된 이슈

1. ✅ **관리자 패널 삭제 버그**: 로컬 상태 즉시 업데이트
2. ✅ **Vercel MIME 타입 오류**: 정규식 패턴 수정
3. ✅ **글 상세 페이지 로딩**: Firebase 타이밍 최적화
4. ✅ **댓글 좋아요 누락**: `toggleCommentLike` 함수 구현
5. ✅ **아이콘 이미지 깨짐**: `vercel.json` 정적 자원 제외

## 🔮 향후 개발 계획

- [ ] 사용자 인증 시스템
- [ ] 댓글 알림 기능
- [ ] 컨텐츠 카테고리 시스템
- [ ] 다크 모드 지원
- [ ] PWA (Progressive Web App) 변환
- [ ] 오프라인 지원

## 🚀 빠른 시작

1. **리포지토리 클론**
```bash
git clone [repository-url]
cd viecoday_story
```

2. **Firebase 설정**
   - Firebase Console에서 프로젝트 생성
   - Firestore Database 활성화
   - `firebase-config.js` 설정

3. **로컬 실행**
```bash
npx serve .
# 또는
python -m http.server 8000
```

4. **배포**
```bash
vercel
```

---

💡 **베트남 사용자를 위한 완전 현지화된 커뮤니티 플랫폼**

🌏 **다국어 지원**: 베트남어 UI, 베트남 시간대, 현지 문화 고려

📱 **모바일 최적화**: 네이티브 앱과 같은 사용 경험

---

## 📄 라이센스

MIT License