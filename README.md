# Viecoday Story

작은 커뮤니티 서비스 - 사람들이 글을 올리고, 좋아요를 누르고, 공유하고, 댓글을 달 수 있는 웹페이지

## 📝 기능

### 메인 서비스 (index.html)
- 글 작성 및 읽기
- 좋아요 기능 (글/댓글)
- 댓글 작성 및 좋아요
- 공유 기능 (Facebook, Twitter, 링크 복사)
- 모바일 친화적 반응형 디자인
- 로컬 스토리지를 통한 데이터 저장

### 관리자 페이지 (admin.html)
- 비밀번호: `viecoday12#$`
- 글 목록 관리 (50개씩 페이지네이션)
- 검색 기능 (제목/내용)
- 단건/복수 글 삭제
- 글 상세 보기 (댓글 포함)
- PC 최적화된 테이블 레이아웃

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

## 📁 파일 구조

```
viecoday/
├── index.html          # 메인 페이지
├── style.css           # 메인 스타일
├── script.js           # 메인 기능
├── admin.html          # 관리자 페이지
├── admin.css           # 관리자 스타일
├── admin.js            # 관리자 기능
├── package.json        # 배포 설정
├── vercel.json         # Vercel 설정
└── README.md           # 이 파일
```

## 🎨 디자인 특징

- **포인트 컬러**: `#FFAB02` (주황색)
- **프로필 아바타**: 짙은 회색 배경 (`#4a4a4a`)
- **반응형 디자인**: 모바일/데스크톱 모두 지원
- **모바일 앱 스타일**: 네이티브 앱과 유사한 UX

## 🔒 보안

- 관리자 페이지는 비밀번호로 보호
- 세션 기반 로그인 유지
- XSS 방지를 위한 기본적인 입력 검증

## 📱 브라우저 지원

- Chrome (권장)
- Safari
- Firefox
- Edge

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🚀 빠른 시작

1. 모든 파일을 웹 서버에 업로드
2. `index.html`을 메인 페이지로 설정
3. `admin.html`로 관리자 페이지 접근
4. 비밀번호 `viecoday12#$`로 로그인

---

💡 **팁**: 로컬에서 테스트할 때는 Live Server 확장 프로그램을 사용하세요!