# 설명 없는 공휴일 관리 시스템

## 개요

설명 없는 공휴일 관리 시스템은 AI가 생성하지 못한 공휴일에 대해 관리자가 수동으로 설명을 작성할 수 있는 기능을 제공합니다.

## 주요 기능

### 1. 설명 없는 공휴일 데이터 조회
- **API 엔드포인트**: `GET /api/admin/descriptions/missing`
- **기능**: AI 설명이 없는 공휴일 목록을 조회합니다
- **데이터 소스**: 
  - Supabase 데이터베이스 (우선)
  - AI 캐시 파일 (`public/ai-cache.json`)
  - 수동 설명 파일 (`data/descriptions/*.json`)
- **필터링**: 국가, 연도별 필터링 지원
- **페이지네이션**: 50개씩 페이지 단위로 조회

### 2. 수동 설명 작성 및 저장
- **API 엔드포인트**: `POST /api/admin/descriptions`
- **기능**: 관리자가 수동으로 공휴일 설명을 작성하고 저장
- **저장 위치**:
  - Supabase 데이터베이스 (메인 저장소)
  - 로컬 파일 시스템 (`data/descriptions/`) (백업)
  - 하이브리드 캐시 시스템 (즉시 반영)

### 3. 웹사이트 반영
- **하이브리드 캐시 시스템**: 수동 작성된 설명이 즉시 웹사이트에 반영
- **데이터 로더 통합**: `loadHolidayData()` 함수를 통해 자동으로 설명 추가
- **우선순위**: 수동 작성 설명 > AI 생성 설명 > 기본 설명

### 4. 어드민 관리 인터페이스
- **설명 없는 공휴일 페이지**: `/admin/descriptions/missing`
- **설명 관리 페이지**: `/admin/descriptions`
- **실시간 업데이트**: 설명 작성 후 목록 자동 새로고침

## 시스템 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   어드민 UI     │───▶│   API Routes     │───▶│   Supabase DB   │
│                 │    │                  │    │                 │
│ - 목록 조회     │    │ - missing/route  │    │ - 설명 저장     │
│ - 설명 작성     │    │ - descriptions   │    │ - 중복 방지     │
│ - 실시간 업데이트│    │   /route         │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ 하이브리드 캐시   │
                       │                  │
                       │ - Supabase 우선  │
                       │ - 로컬 캐시 폴백 │
                       │ - 즉시 반영      │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   웹사이트       │
                       │                  │
                       │ - 데이터 로더    │
                       │ - 공휴일 상세    │
                       │ - 설명 표시      │
                       └──────────────────┘
```

## API 명세

### 설명 없는 공휴일 조회

```typescript
GET /api/admin/descriptions/missing

Query Parameters:
- country?: string    // 국가 코드 필터 (예: "US", "KR")
- year?: string      // 연도 필터 (예: "2024")
- page?: number      // 페이지 번호 (기본값: 1)
- limit?: number     // 페이지 크기 (기본값: 50)

Response:
{
  success: boolean;
  data: Array<{
    holiday_id: string;
    holiday_name: string;
    country_name: string;
    country_code: string;
    date: string;
    year: number;
  }>;
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### 설명 생성

```typescript
POST /api/admin/descriptions

Request Body:
{
  holiday_id: string;
  holiday_name: string;
  country_name: string;
  locale: string;        // "ko" 또는 "en"
  description: string;   // 설명 내용 (최대 2000자)
  is_manual: boolean;    // true (수동 작성)
  modified_by: string;   // 작성자 이름
}

Response:
{
  success: boolean;
  message: string;
  data?: HolidayDescriptionCreate;
}
```

## 데이터 플로우

### 1. 설명 없는 공휴일 식별
```
로컬 공휴일 데이터 → 기존 설명 확인 → 설명 없는 항목 필터링
```

### 2. 수동 설명 작성
```
어드민 UI → API 호출 → Supabase 저장 → 파일 백업 → 하이브리드 캐시 업데이트
```

### 3. 웹사이트 반영
```
사용자 요청 → 데이터 로더 → 하이브리드 캐시 조회 → 설명 포함된 공휴일 반환
```

## 파일 구조

```
src/
├── app/api/admin/descriptions/
│   ├── route.ts                    # 설명 CRUD API
│   └── missing/
│       └── route.ts                # 설명 없는 공휴일 조회 API
├── components/admin/
│   ├── MissingDescriptionsList.tsx # 설명 없는 공휴일 목록
│   ├── MissingDescriptionEditor.tsx# 설명 작성 에디터
│   ├── DescriptionList.tsx         # 설명 관리 목록
│   └── AdminNavigation.tsx         # 어드민 네비게이션
├── app/admin/descriptions/
│   ├── page.tsx                    # 설명 관리 페이지
│   └── missing/
│       └── page.tsx                # 설명 없는 공휴일 페이지
└── lib/
    ├── hybrid-cache.ts             # 하이브리드 캐시 시스템
    ├── data-loader.ts              # 데이터 로더 (설명 통합)
    └── supabase-client.ts          # Supabase 클라이언트
```

## 사용 방법

### 1. 어드민 로그인
```
/admin/login → 인증 → /admin/dashboard
```

### 2. 설명 없는 공휴일 확인
```
/admin/descriptions/missing → 목록 조회 → 필터링
```

### 3. 설명 작성
```
"설명 작성" 버튼 클릭 → 모달 열기 → 설명 입력 → 저장
```

### 4. 결과 확인
```
/admin/descriptions → 작성된 설명 확인
웹사이트 → 공휴일 페이지에서 설명 표시 확인
```

## 테스트

### 자동 테스트 스크립트
```bash
npx tsx scripts/test-missing-descriptions-flow.ts
```

### 수동 테스트 체크리스트
- [ ] 설명 없는 공휴일 목록이 정확히 조회되는가?
- [ ] 수동 설명 작성이 성공적으로 저장되는가?
- [ ] 작성된 설명이 웹사이트에 즉시 반영되는가?
- [ ] 어드민 설명 관리 탭에서 수동 작성 설명이 표시되는가?
- [ ] 페이지네이션이 올바르게 작동하는가?
- [ ] 필터링 기능이 정상 작동하는가?

## 주의사항

### 성능 고려사항
- 설명 없는 공휴일 조회 시 모든 공휴일 파일을 스캔하므로 시간이 걸릴 수 있음
- 페이지네이션을 통해 부하 분산
- 하이브리드 캐시를 통한 조회 성능 최적화

### 데이터 일관성
- Supabase와 로컬 파일 시스템 간 동기화 필요
- 하이브리드 캐시 시스템을 통한 일관성 보장
- 백업 파일을 통한 데이터 복구 가능

### 보안
- 어드민 인증 필수
- CSRF 보호
- 입력 데이터 검증 및 sanitization

## 문제 해결

### 설명이 웹사이트에 반영되지 않는 경우
1. 하이브리드 캐시 상태 확인
2. Supabase 연결 상태 확인
3. 로컬 캐시 파일 권한 확인
4. 브라우저 캐시 클리어

### 설명 없는 공휴일이 표시되지 않는 경우
1. 공휴일 데이터 파일 존재 확인
2. AI 캐시 파일 형식 확인
3. Supabase 데이터 동기화 상태 확인

### API 오류 발생 시
1. 로그 파일 확인 (`logs/error.log`)
2. 환경 변수 설정 확인
3. 데이터베이스 연결 상태 확인