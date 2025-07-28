# 기술 스택

## 프레임워크 및 라이브러리
- **Next.js 15.4.2**: App Router 사용, React 19 기반
- **TypeScript 5**: 타입 안전성을 위한 정적 타입 검사
- **Tailwind CSS 4**: 유틸리티 기반 CSS 프레임워크
- **React 19**: 최신 React 기능 활용

## 주요 의존성
- **axios**: HTTP 클라이언트 (API 요청)
- **date-fns**: 날짜 처리 유틸리티
- **vitest**: 테스트 프레임워크
- **tsx**: TypeScript 실행 도구

## 개발 도구
- **ESLint**: 코드 품질 검사 (Next.js 설정 사용)
- **PostCSS**: CSS 후처리
- **ts-node**: TypeScript 스크립트 실행

## 빌드 시스템
- **Next.js 빌드 시스템**: 정적 사이트 생성 및 ISR 지원
- **Turbopack**: 개발 서버 가속화 (--turbopack 플래그)

## 주요 명령어

### 개발
```bash
npm run dev          # 개발 서버 실행 (Turbopack 사용)
npm run lint         # ESLint 검사
```

### 테스트
```bash
npm test             # Vitest 실행 (watch 모드)
npm run test:run     # Vitest 실행 (단일 실행)
npm run test:ui      # Vitest UI 실행
```

### 빌드 및 배포
```bash
npm run build        # 프로덕션 빌드 (데이터 검증 포함)
npm run build:static # 정적 사이트 생성
npm run build:isr    # ISR 빌드
npm start            # 프로덕션 서버 실행
```

### 데이터 관리
```bash
npm run validate-data        # 빌드 데이터 검증
npm run collect-data         # 공휴일 데이터 수집
npm run collect-all          # 모든 국가 데이터 수집
npm run collect-current-year # 현재 연도 데이터 수집
npm run test-collector       # 데이터 수집기 테스트
```

### SEO 및 사이트맵
```bash
npm run generate-sitemap # 사이트맵 생성
npm run seo-setup       # SEO 설정 (사이트맵 생성)
```

## API 통합
- **Calendarific API**: 공휴일 데이터 수집
- **OpenAI API**: AI 기반 공휴일 설명 생성
- **Nager.Date API**: 보조 공휴일 데이터 소스

## 배포 환경
- **Vercel**: 주요 배포 플랫폼
- **정적 사이트 생성**: SEO 최적화를 위한 정적 페이지 생성
- **ISR (Incremental Static Regeneration)**: 동적 콘텐츠 업데이트