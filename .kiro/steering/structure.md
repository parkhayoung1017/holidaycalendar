# 프로젝트 구조

## 디렉토리 구조

### 루트 레벨
- **`.kiro/`**: Kiro AI 설정 및 스펙 파일
- **`data/`**: 공휴일 데이터 저장소
- **`src/`**: 소스 코드 메인 디렉토리
- **`scripts/`**: 빌드 및 데이터 처리 스크립트
- **`public/`**: 정적 자산 (이미지, 아이콘, SEO 파일)
- **`logs/`**: 애플리케이션 로그 파일

### 소스 코드 구조 (`src/`)

#### `src/app/` - Next.js App Router
- **App Router 구조**: Next.js 13+ 라우팅 시스템
- **`layout.tsx`**: 전역 레이아웃 및 메타데이터
- **`page.tsx`**: 홈페이지
- **`globals.css`**: 전역 스타일
- **`[locale]/`**: 다국어 지원 라우팅 (계획 중)
- **`today/`**: 오늘의 공휴일 페이지

#### `src/components/` - React 컴포넌트
- **`ui/`**: 재사용 가능한 기본 UI 컴포넌트
- **`layout/`**: 레이아웃 관련 컴포넌트 (Header, Footer)
- **`search/`**: 검색 기능 컴포넌트
- **`calendar/`**: 달력 관련 컴포넌트
- **`country/`**: 국가별 공휴일 표시 컴포넌트
- **`holiday/`**: 개별 공휴일 정보 컴포넌트
- **`navigation/`**: 내비게이션 컴포넌트
- **`regional/`**: 지역별 공휴일 컴포넌트
- **`today/`**: 오늘의 공휴일 컴포넌트
- **`ads/`**: 광고 관련 컴포넌트
- **`seo/`**: SEO 최적화 컴포넌트
- **`error/`**: 에러 처리 컴포넌트

#### `src/lib/` - 유틸리티 및 라이브러리
- **`constants.ts`**: 전역 상수 정의 (국가 목록, API 설정 등)
- **`data-loader.ts`**: 데이터 로딩 유틸리티
- **`holiday-api.ts`**: 공휴일 API 클라이언트
- **`holiday-data-collector.ts`**: 공휴일 데이터 수집기
- **`ai-content-generator.ts`**: AI 콘텐츠 생성기
- **`search-utils.ts`**: 검색 관련 유틸리티
- **`seo-utils.ts`**: SEO 최적화 유틸리티
- **`error-logger.ts`**: 에러 로깅 시스템
- **`build-validator.ts`**: 빌드 데이터 검증
- **`today-holidays-updater.ts`**: 실시간 공휴일 업데이터
- **`__tests__/`**: 라이브러리 단위 테스트

#### `src/types/` - TypeScript 타입 정의
- 공휴일, 국가, API 응답 등의 타입 정의

#### `src/test/` - 테스트 설정
- 테스트 환경 설정 및 공통 테스트 유틸리티

### 데이터 구조 (`data/`)
- **`holidays/`**: 국가별/연도별 공휴일 JSON 데이터
- **`cache/`**: API 응답 캐시 데이터
- 파일명 패턴: `{country-code}-{year}.json`

### 스크립트 (`scripts/`)
- **`collect-holiday-data.ts`**: 공휴일 데이터 수집 스크립트
- **`build-static-pages.ts`**: 정적 페이지 생성 스크립트
- **`generate-sitemap.ts`**: 사이트맵 생성 스크립트
- **`validate-build-data.ts`**: 빌드 데이터 검증 스크립트
- **`update-today-holidays.ts`**: 오늘의 공휴일 업데이트 스크립트
- **`test-*.ts`**: 각종 테스트 스크립트

## 아키텍처 패턴

### 컴포넌트 구조
- **Atomic Design 원칙**: UI 컴포넌트를 재사용 가능한 단위로 구성
- **Container/Presentational 패턴**: 로직과 UI 분리
- **Custom Hooks**: 상태 관리 및 비즈니스 로직 추상화

### 데이터 플로우
- **Static Generation**: 빌드 타임에 정적 페이지 생성
- **ISR (Incremental Static Regeneration)**: 필요시 페이지 재생성
- **Client-side Caching**: 브라우저 레벨 데이터 캐싱

### 파일 명명 규칙
- **컴포넌트**: PascalCase (예: `HolidayCard.tsx`)
- **유틸리티**: camelCase (예: `searchUtils.ts`)
- **상수**: UPPER_SNAKE_CASE (예: `API_ENDPOINTS`)
- **타입**: PascalCase with Type suffix (예: `HolidayType`)

### 폴더 구조 원칙
- **기능별 그룹화**: 관련 기능을 같은 폴더에 배치
- **계층적 구조**: 상위 개념에서 하위 개념으로 구성
- **명확한 책임 분리**: 각 폴더는 명확한 역할을 가짐