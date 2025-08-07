# 로케일별 설명 작성 기능

## 개요
어드민 대시보드에서 공휴일 설명을 한국어와 영어로 구분하여 작성할 수 있는 기능을 구현했습니다.

## 주요 기능

### 1. 로케일 선택 UI
- 🇰🇷 한국어, 🇺🇸 English 선택 가능
- 각 로케일별 작성 상태 표시 (✅ 작성됨 / 📝 미작성)
- 로케일 변경 시 해당 언어의 기존 설명 자동 로드

### 2. 다국어 UI 지원
- 선택한 로케일에 따라 UI 텍스트 자동 변경
- 플레이스홀더 텍스트, 도움말, 버튼 텍스트 등 모두 다국어 지원
- 에러 메시지도 로케일별로 표시

### 3. 데이터베이스 저장
- Supabase에 로케일별로 구분하여 저장
- `locale` 필드로 언어 구분 ('ko', 'en')
- 기존 설명이 있는 경우 수정 가능

### 4. 웹사이트 반영
- 하이브리드 캐시 시스템을 통해 웹사이트에 즉시 반영
- 사용자가 한국어/영어 페이지 방문 시 해당 로케일의 설명 표시
- 로케일별 설명이 없는 경우 AI 생성 또는 기본 설명 사용

## 기술적 구현

### 1. 컴포넌트 구조
```typescript
// 지원 로케일 정의
const SUPPORTED_LOCALES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

// 로케일별 UI 텍스트 함수
const getUIText = (locale: 'ko' | 'en') => { ... }
const getPlaceholderText = (locale: 'ko' | 'en') => { ... }
const getHelpText = (locale: 'ko' | 'en') => { ... }
```

### 2. API 엔드포인트
- `GET /api/admin/descriptions?holiday_name=...&country_name=...&locale=ko`
- `POST /api/admin/descriptions` (로케일 포함)

### 3. 데이터베이스 스키마
```sql
CREATE TABLE holiday_descriptions (
  id UUID PRIMARY KEY,
  holiday_name VARCHAR(255) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  locale VARCHAR(10) NOT NULL DEFAULT 'ko',
  description TEXT NOT NULL,
  is_manual BOOLEAN DEFAULT FALSE,
  modified_by VARCHAR(100),
  -- 중복 방지 제약조건
  UNIQUE(holiday_name, country_name, locale)
);
```

### 4. 하이브리드 캐시 통합
- 로케일별 캐시 키: `"Holiday Name-Country Name-locale"`
- Supabase 우선, 로컬 캐시 폴백
- 웹사이트에서 로케일별 설명 자동 조회

## 사용 방법

### 1. 어드민 대시보드에서 설명 작성
1. 설명이 없는 공휴일 목록에서 "설명 작성" 버튼 클릭
2. 언어 선택 (한국어/영어)
3. 해당 언어로 설명 작성
4. 저장 후 다른 언어로 전환하여 추가 작성 가능

### 2. 웹사이트에서 확인
- 한국어 페이지: `/ko/holiday/[country]/[slug]`
- 영어 페이지: `/en/holiday/[country]/[slug]`
- 각 페이지에서 해당 로케일의 설명 자동 표시

### 3. 테스트 스크립트 실행
```bash
# 테스트 데이터로 기능 테스트
npx tsx scripts/test-locale-descriptions.ts

# 테스트 데이터 정리
npx tsx scripts/test-locale-descriptions.ts --cleanup
```

## 향후 개선 계획

### 1. 추가 언어 지원
- 일본어 (ja), 중국어 (zh), 스페인어 (es) 등
- 로케일 설정만 추가하면 쉽게 확장 가능

### 2. 번역 도구 통합
- Google Translate API 연동
- 한국어 → 영어 자동 번역 기능
- 번역 품질 검토 워크플로우

### 3. 일괄 편집 기능
- 여러 공휴일의 설명을 한 번에 편집
- CSV 업로드/다운로드 기능
- 번역 상태 대시보드

### 4. 버전 관리
- 설명 수정 이력 추적
- 이전 버전으로 롤백 기능
- 변경 사항 승인 워크플로우

## 주의사항

### 1. 데이터 일관성
- 같은 공휴일에 대해 로케일별로 다른 내용이 있을 수 있음
- 번역의 정확성과 문화적 적절성 검토 필요

### 2. 성능 고려사항
- 로케일별 캐시 관리
- 대량의 다국어 데이터 처리 시 메모리 사용량 모니터링

### 3. SEO 최적화
- 각 로케일별 메타데이터 설정
- hreflang 태그 적용
- 구조화된 데이터의 다국어 지원

## 관련 파일

### 컴포넌트
- `src/components/admin/MissingDescriptionEditor.tsx` - 메인 에디터
- `src/components/admin/MissingDescriptionsList.tsx` - 목록 표시

### API
- `src/app/api/admin/descriptions/route.ts` - 설명 CRUD API
- `src/lib/supabase-client.ts` - Supabase 클라이언트

### 캐시 시스템
- `src/lib/hybrid-cache.ts` - 하이브리드 캐시
- `src/lib/data-loader.ts` - 데이터 로더

### 테스트
- `scripts/test-locale-descriptions.ts` - 기능 테스트 스크립트

### 문서
- `docs/LOCALE_DESCRIPTION_FEATURE.md` - 이 문서
- `scripts/setup-supabase-schema.sql` - 데이터베이스 스키마