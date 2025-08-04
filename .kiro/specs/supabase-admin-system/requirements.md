# Requirements Document

## Introduction

이 기능은 기존의 로컬 JSON 파일 기반 AI 캐시 시스템을 Supabase 데이터베이스로 마이그레이션하고, 어드민 페이지를 통해 공휴일 상세설명을 관리할 수 있는 시스템을 구축하는 것입니다. 어드민은 AI로 생성된 설명을 수정하거나, 새로운 설명을 직접 작성할 수 있으며, 모든 변경사항은 실시간으로 웹사이트에 반영됩니다.

## Requirements

### Requirement 1

**User Story:** 어드민으로서, 기존 AI 캐시 데이터를 Supabase로 마이그레이션하여 중앙화된 데이터베이스에서 관리하고 싶습니다.

#### Acceptance Criteria

1. WHEN 마이그레이션 스크립트를 실행하면 THEN 시스템은 기존 `data/ai-cache/holiday-descriptions.json` 파일의 모든 데이터를 Supabase 테이블로 이전해야 합니다
2. WHEN 데이터 마이그레이션이 완료되면 THEN 시스템은 기존 데이터의 무결성을 검증하고 마이그레이션 결과를 로그로 출력해야 합니다
3. WHEN 웹사이트에서 공휴일 설명을 요청하면 THEN 시스템은 Supabase에서 데이터를 조회하여 응답해야 합니다

### Requirement 2

**User Story:** 어드민으로서, 보안이 적용된 어드민 페이지에 접근하여 공휴일 설명을 관리하고 싶습니다.

#### Acceptance Criteria

1. WHEN 어드민 페이지 URL에 직접 접근하면 THEN 시스템은 패스워드 입력 화면을 표시해야 합니다
2. WHEN 올바른 패스워드(Gkdud1017!@)를 입력하면 THEN 시스템은 어드민 대시보드로 리다이렉트해야 합니다
3. WHEN 잘못된 패스워드를 입력하면 THEN 시스템은 오류 메시지를 표시하고 재입력을 요구해야 합니다
4. WHEN 어드민 페이지가 검색엔진에 크롤링되려고 하면 THEN 시스템은 robots.txt와 meta 태그를 통해 이를 차단해야 합니다

### Requirement 3

**User Story:** 어드민으로서, 기존 AI 생성 설명을 조회하고 수정하여 품질을 개선하고 싶습니다.

#### Acceptance Criteria

1. WHEN 어드민 대시보드에 접근하면 THEN 시스템은 모든 공휴일 설명 목록을 페이지네이션과 함께 표시해야 합니다
2. WHEN 특정 공휴일 설명을 선택하면 THEN 시스템은 편집 가능한 폼을 표시해야 합니다
3. WHEN 설명을 수정하고 저장하면 THEN 시스템은 Supabase에 변경사항을 저장하고 즉시 웹사이트에 반영해야 합니다
4. WHEN 수정된 설명이 있으면 THEN 시스템은 수정 날짜와 수정자 정보를 기록해야 합니다

### Requirement 4

**User Story:** 어드민으로서, AI 설명이 없는 공휴일을 확인하고 수동으로 설명을 작성하고 싶습니다.

#### Acceptance Criteria

1. WHEN 어드민이 "설명 없는 공휴일" 탭을 클릭하면 THEN 시스템은 AI 설명이 생성되지 않은 공휴일 목록을 표시해야 합니다
2. WHEN 설명 없는 공휴일을 선택하면 THEN 시스템은 새 설명 작성 폼을 표시해야 합니다
3. WHEN 새 설명을 작성하고 저장하면 THEN 시스템은 Supabase에 저장하고 즉시 웹사이트에 반영해야 합니다
4. WHEN 수동 작성된 설명이 있으면 THEN 시스템은 작성자와 작성 날짜를 기록해야 합니다

### Requirement 5

**User Story:** 시스템으로서, 새로 AI로 생성되는 설명을 자동으로 Supabase에 저장하고 웹사이트에 반영하고 싶습니다.

#### Acceptance Criteria

1. WHEN AI 콘텐츠 생성 스크립트가 실행되면 THEN 시스템은 새로운 설명을 Supabase에 저장해야 합니다
2. WHEN 새 AI 설명이 생성되면 THEN 시스템은 생성 날짜, 신뢰도, AI 모델 정보를 함께 저장해야 합니다
3. WHEN 웹사이트에서 새로 생성된 설명을 요청하면 THEN 시스템은 Supabase에서 최신 데이터를 조회하여 응답해야 합니다
4. WHEN AI 설명이 생성되면 THEN 시스템은 어드민 페이지에서 해당 설명을 수정할 수 있도록 해야 합니다

### Requirement 6

**User Story:** 어드민으로서, 대시보드를 통해 시스템 상태와 통계를 확인하고 싶습니다.

#### Acceptance Criteria

1. WHEN 어드민 대시보드에 접근하면 THEN 시스템은 전체 공휴일 수, AI 설명 생성 완료율, 수동 작성 설명 수를 표시해야 합니다
2. WHEN 대시보드를 확인하면 THEN 시스템은 최근 수정된 설명 목록을 표시해야 합니다
3. WHEN 통계 정보를 요청하면 THEN 시스템은 국가별, 언어별 설명 생성 현황을 표시해야 합니다
4. WHEN 시스템 상태를 확인하면 THEN 시스템은 Supabase 연결 상태와 API 응답 시간을 표시해야 합니다

### Requirement 7

**User Story:** 개발자로서, 기존 시스템과의 호환성을 유지하면서 점진적으로 마이그레이션하고 싶습니다.

#### Acceptance Criteria

1. WHEN Supabase 연결이 실패하면 THEN 시스템은 기존 로컬 캐시 파일로 폴백해야 합니다
2. WHEN 마이그레이션 중에 오류가 발생하면 THEN 시스템은 롤백 기능을 제공해야 합니다
3. WHEN 기존 API 엔드포인트를 호출하면 THEN 시스템은 동일한 응답 형식을 유지해야 합니다
4. WHEN 환경 변수가 설정되지 않으면 THEN 시스템은 개발 모드에서 로컬 파일을 사용해야 합니다