# 설계 문서

## 개요

이 설계는 기존 Next.js 기반 휴일 웹사이트에 한국어/영어 다국어 지원을 추가하는 방법을 정의합니다. Next.js의 국제화(i18n) 기능을 활용하여 URL 기반 언어 라우팅, 서버 사이드 번역, SEO 최적화를 구현합니다.

## 아키텍처

### 언어 라우팅 구조
```
현재: /country-year, /today, /regions
새로운: /ko/country-year, /en/country-year, /ko/today, /en/today
```

### 핵심 아키텍처 결정사항

1. **Next.js i18n 라우팅**: URL 경로에 언어 코드 포함 (`/ko/`, `/en/`)
2. **서버 사이드 번역**: 빌드 타임에 정적 번역 파일 로드
3. **언어 감지**: Accept-Language 헤더 + 사용자 선택 우선
4. **SEO 최적화**: hreflang 태그와 언어별 sitemap 생성

## 컴포넌트 및 인터페이스

### 1. 국제화 설정

#### Next.js 설정 (next.config.ts)
```typescript
const nextConfig: NextConfig = {
  i18n: {
    locales: ['ko', 'en'],
    defaultLocale: 'ko',
    localeDetection: true,
  },
  // 기존 설정 유지...
}
```

#### 번역 파일 구조
```
src/
├── locales/
│   ├── ko/
│   │   ├── common.json
│   │   ├── navigation.json
│   │   ├── holidays.json
│   │   └── countries.json
│   └── en/
│       ├── common.json
│       ├── navigation.json
│       ├── holidays.json
│       └── countries.json
```

### 2. 번역 시스템

#### 번역 훅 (useTranslation)
```typescript
interface TranslationHook {
  t: (key: string, params?: Record<string, string>) => string;
  locale: string;
  locales: string[];
}

export function useTranslation(namespace?: string): TranslationHook;
```

#### 번역 컨텍스트
```typescript
interface I18nContext {
  locale: string;
  setLocale: (locale: string) => void;
  translations: Record<string, any>;
}
```

### 3. 언어 전환 컴포넌트

#### LanguageSelector 컴포넌트
```typescript
interface LanguageSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'toggle';
}

export function LanguageSelector(props: LanguageSelectorProps): JSX.Element;
```

### 4. 업데이트된 레이아웃 컴포넌트

#### Header 컴포넌트 수정
- 언어 선택기 추가
- 내비게이션 메뉴 번역
- 로고/제목 번역

#### Footer 컴포넌트 수정
- 저작권 정보 번역
- 설명 텍스트 번역

## 데이터 모델

### 번역 데이터 구조

#### 공통 번역 (common.json)
```json
{
  "site": {
    "title": "World Holiday Calendar",
    "description": "전세계 공휴일 정보를 한눈에 확인하세요",
    "keywords": "공휴일, 휴일, 국가별 공휴일"
  },
  "actions": {
    "search": "검색",
    "viewMore": "더 보기",
    "backToHome": "홈으로"
  },
  "time": {
    "today": "오늘",
    "thisMonth": "이번 달",
    "year": "년"
  }
}
```

#### 내비게이션 번역 (navigation.json)
```json
{
  "menu": {
    "home": "홈",
    "todayHolidays": "오늘의 공휴일",
    "regionHolidays": "대륙별 공휴일"
  },
  "regions": {
    "asia": "아시아",
    "europe": "유럽",
    "americas": "아메리카",
    "africa": "아프리카",
    "oceania": "오세아니아"
  }
}
```

#### 휴일 번역 (holidays.json)
```json
{
  "common": {
    "newYear": "신정",
    "christmas": "크리스마스",
    "easter": "부활절"
  },
  "types": {
    "public": "공휴일",
    "religious": "종교 휴일",
    "observance": "기념일"
  }
}
```

#### 국가 번역 (countries.json)
```json
{
  "US": "미국",
  "KR": "한국",
  "JP": "일본",
  "CN": "중국",
  "GB": "영국"
}
```

### 휴일 데이터 확장

#### 기존 휴일 데이터에 번역 필드 추가
```typescript
interface Holiday {
  date: string;
  name: string;
  localName?: string; // 현지 언어 이름
  type: string;
  translations?: {
    ko?: string;
    en?: string;
  };
}
```

## 오류 처리

### 번역 누락 처리
1. **Fallback 전략**: 번역이 없으면 기본 언어(한국어) 사용
2. **개발 모드 경고**: 누락된 번역 키에 대한 콘솔 경고
3. **빌드 검증**: 필수 번역 키 존재 여부 검증

### 언어 감지 실패 처리
1. **기본 언어**: 감지 실패 시 한국어로 설정
2. **쿠키 저장**: 사용자 선택 언어 영구 저장
3. **URL 리다이렉트**: 잘못된 언어 코드 시 기본 언어로 리다이렉트

## 테스트 전략

### 단위 테스트
- 번역 훅 테스트
- 언어 전환 컴포넌트 테스트
- 번역 유틸리티 함수 테스트

### 통합 테스트
- 언어별 페이지 렌더링 테스트
- 언어 전환 플로우 테스트
- SEO 메타데이터 생성 테스트

### E2E 테스트
- 브라우저 언어 감지 테스트
- 언어 전환 사용자 경험 테스트
- 다국어 검색 기능 테스트

## SEO 최적화

### URL 구조
```
한국어: /ko/south-korea-2025
영어: /en/south-korea-2025
기본: /south-korea-2025 (한국어로 리다이렉트)
```

### 메타데이터 생성
```typescript
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations(params.locale);
  
  return {
    title: t('site.title'),
    description: t('site.description'),
    alternates: {
      languages: {
        'ko': '/ko/path',
        'en': '/en/path',
      }
    }
  };
}
```

### Sitemap 생성
- 언어별 URL 포함
- hreflang 어노테이션
- 언어별 lastmod 날짜

## 성능 최적화

### 번역 파일 로딩
1. **코드 분할**: 언어별 번역 파일 동적 로딩
2. **캐싱**: 번역 데이터 메모리 캐싱
3. **압축**: 번역 파일 gzip 압축

### 렌더링 최적화
1. **SSG**: 정적 페이지 사전 생성
2. **ISR**: 번역 업데이트 시 점진적 재생성
3. **클라이언트 캐싱**: 번역 데이터 로컬 스토리지 캐싱

## 구현 단계

### Phase 1: 기본 인프라
- Next.js i18n 설정
- 번역 파일 구조 생성
- 기본 번역 훅 구현

### Phase 2: UI 컴포넌트
- 언어 선택기 구현
- Header/Footer 번역
- 기본 페이지 번역

### Phase 3: 콘텐츠 번역
- 휴일 데이터 번역
- 국가명 번역
- 검색 기능 다국어 지원

### Phase 4: SEO 최적화
- 메타데이터 번역
- Sitemap 생성
- hreflang 태그 추가

### Phase 5: 테스트 및 최적화
- 테스트 코드 작성
- 성능 최적화
- 사용자 경험 개선