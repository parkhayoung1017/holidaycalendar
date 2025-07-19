# World Holiday Calendar

전세계 주요 국가의 연도별 공휴일 정보를 제공하는 웹 서비스입니다.

## 기능

- 국가별/연도별 공휴일 검색
- 지역별 공휴일 비교
- 오늘의 공휴일 정보
- AI 기반 공휴일 설명 생성
- SEO 최적화된 정적 페이지

## 기술 스택

- **프론트엔드**: Next.js 14, TypeScript, Tailwind CSS
- **데이터**: Holiday API, OpenAI GPT API
- **배포**: Vercel
- **자동화**: GitHub Actions

## 시작하기

### 환경 설정

1. 환경변수 파일 설정:
```bash
cp .env.example .env.local
```

2. 필요한 API 키를 `.env.local`에 설정:
   - Holiday API 키 (Calendarific)
   - OpenAI API 키

### 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 결과를 확인할 수 있습니다.

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router 페이지
├── components/          # React 컴포넌트
│   ├── ui/             # 재사용 가능한 UI 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   └── search/         # 검색 관련 컴포넌트
├── lib/                # 유틸리티 함수
├── types/              # TypeScript 타입 정의
data/
├── holidays/           # 공휴일 데이터 (JSON)
└── countries/          # 국가 정보 데이터
```

## 배포

이 프로젝트는 Vercel에서 쉽게 배포할 수 있습니다.

자세한 배포 방법은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 참조하세요.
