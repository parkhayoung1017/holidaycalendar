#!/usr/bin/env tsx

/**
 * Supabase 설정 가이드 및 검증 스크립트
 * 
 * 이 스크립트는 Supabase 프로젝트 설정을 위한 단계별 가이드를 제공하고,
 * 설정이 올바르게 완료되었는지 검증합니다.
 * 
 * 요구사항:
 * - 1.1: 기존 AI 캐시 데이터를 Supabase로 마이그레이션
 * - 2.4: 보안이 적용된 어드민 페이지 접근 제어
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// 환경 변수 확인
function checkEnvironmentVariables(): boolean {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  console.log('🔍 환경 변수 확인 중...\n');

  let allPresent = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: 설정됨`);
    } else {
      console.log(`❌ ${varName}: 누락됨`);
      allPresent = false;
    }
  }

  return allPresent;
}

// SQL 스크립트 내용 표시
function displaySqlScript(): void {
  console.log('\n📋 SQL 스크립트 내용:\n');
  
  try {
    const sqlPath = join(process.cwd(), 'scripts', 'setup-supabase-schema.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    console.log('스크립트 위치:', sqlPath);
    console.log('스크립트 크기:', sqlContent.length, '바이트');
    console.log('\n스크립트에 포함된 주요 구성 요소:');
    
    // 주요 구성 요소 확인
    const components = [
      { name: 'holiday_descriptions 테이블', pattern: /CREATE TABLE.*holiday_descriptions/i },
      { name: 'admin_sessions 테이블', pattern: /CREATE TABLE.*admin_sessions/i },
      { name: '인덱스 생성', pattern: /CREATE INDEX/gi },
      { name: 'RLS 정책', pattern: /CREATE POLICY/gi },
      { name: '트리거 함수', pattern: /CREATE TRIGGER/gi },
      { name: '유틸리티 함수', pattern: /CREATE OR REPLACE FUNCTION/gi },
      { name: '제약조건', pattern: /ADD CONSTRAINT/gi }
    ];

    components.forEach(({ name, pattern }) => {
      const matches = sqlContent.match(pattern);
      const count = matches ? matches.length : 0;
      console.log(`  ✓ ${name}: ${count}개`);
    });

  } catch (error) {
    console.error('❌ SQL 스크립트 파일을 읽을 수 없습니다:', error);
  }
}

// 설정 가이드 표시
function displaySetupGuide(): void {
  console.log('\n📚 Supabase 설정 가이드\n');
  
  console.log('1️⃣ Supabase 프로젝트 생성');
  console.log('   - https://supabase.com 에서 새 프로젝트 생성');
  console.log('   - 프로젝트 이름: world-holiday-calendar-admin');
  console.log('   - 데이터베이스 비밀번호 설정 및 기록');
  console.log('');

  console.log('2️⃣ 환경 변수 설정');
  console.log('   .env.local 파일에 다음 변수들을 추가:');
  console.log('   ```');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.log('   ```');
  console.log('');

  console.log('3️⃣ SQL 스크립트 실행');
  console.log('   - Supabase 대시보드 → SQL Editor 이동');
  console.log('   - scripts/setup-supabase-schema.sql 내용 복사');
  console.log('   - SQL Editor에 붙여넣기 후 실행');
  console.log('');

  console.log('4️⃣ 설정 검증');
  console.log('   - 이 스크립트를 다시 실행하여 설정 확인');
  console.log('   - npm run tsx scripts/setup-supabase-instructions.ts');
  console.log('');

  console.log('5️⃣ 데이터 마이그레이션');
  console.log('   - 다음 작업에서 마이그레이션 스크립트 실행');
  console.log('   - 기존 AI 캐시 데이터를 Supabase로 이전');
  console.log('');
}

// 연결 테스트 (환경 변수가 설정된 경우)
async function testConnection(): Promise<void> {
  if (!checkEnvironmentVariables()) {
    console.log('\n⚠️  환경 변수가 설정되지 않아 연결 테스트를 건너뜁니다.');
    return;
  }

  console.log('\n🔗 Supabase 연결 테스트 중...\n');

  try {
    // 동적 import를 사용하여 Supabase 클라이언트 로드
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase
      .from('holiday_descriptions')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation "holiday_descriptions" does not exist')) {
        console.log('⚠️  테이블이 아직 생성되지 않았습니다. SQL 스크립트를 실행해주세요.');
      } else {
        console.log('❌ 연결 오류:', error.message);
      }
    } else {
      console.log('✅ Supabase 연결 성공!');
      console.log(`📊 holiday_descriptions 테이블 레코드 수: ${data || 0}`);
    }

  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error);
  }
}

// 메인 실행 함수
async function main(): void {
  console.log('🚀 Supabase 설정 가이드 및 검증 도구\n');
  console.log('=' .repeat(50));

  // 환경 변수 확인
  const envVarsOk = checkEnvironmentVariables();

  // SQL 스크립트 정보 표시
  displaySqlScript();

  // 설정 가이드 표시
  displaySetupGuide();

  // 연결 테스트 (환경 변수가 설정된 경우만)
  if (envVarsOk) {
    await testConnection();
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📝 참고사항:');
  console.log('- 이 스크립트는 설정 가이드 및 검증 목적으로만 사용됩니다');
  console.log('- 실제 데이터베이스 변경은 Supabase 대시보드에서 수행해야 합니다');
  console.log('- 문제가 발생하면 Supabase 문서를 참조하세요: https://supabase.com/docs');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { checkEnvironmentVariables, displaySetupGuide, testConnection };