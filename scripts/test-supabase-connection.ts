#!/usr/bin/env tsx

/**
 * Supabase 연결 테스트 스크립트
 * 환경 변수 설정과 데이터베이스 연결을 확인합니다.
 */

import { config } from 'dotenv';
import path from 'path';

// 환경 변수 로드 (순서 중요: .env.local이 우선)
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

// 환경 변수가 로드되지 않은 경우 직접 설정 (테스트용)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://wkajscrxfcmeksyxllft.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYWpzY3J4ZmNtZWtzeXhsbGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzU4NDUsImV4cCI6MjA2OTg1MTg0NX0.dZi1lmJYODf0JlGaiIVQEG0Txnp2EobW_8YBDoZ6oC4';
}
if (!process.env.ADMIN_PASSWORD) {
  process.env.ADMIN_PASSWORD = 'Gkdud1017!@';
}
if (!process.env.ADMIN_SESSION_SECRET) {
  process.env.ADMIN_SESSION_SECRET = 'your_session_secret_here_minimum_32_characters_long_for_security';
}

// 환경 변수 로드 후 모듈 import
import { getEnvironmentConfig, validateEnvironmentSetup, logEnvironmentInfo } from '../src/lib/env-config';
import { checkSupabaseConnection, getSupabaseAdmin } from '../src/lib/supabase';
import { SupabaseHolidayDescriptionService } from '../src/lib/supabase-client';

async function testSupabaseConnection() {
  console.log('🧪 Supabase 연결 테스트를 시작합니다...\n');

  try {
    // 1. 환경 변수 검증
    console.log('1️⃣ 환경 변수 검증 중...');
    logEnvironmentInfo();
    
    const validation = validateEnvironmentSetup();
    if (!validation.isValid) {
      console.error('❌ 환경 변수 설정이 올바르지 않습니다.');
      process.exit(1);
    }

    // 2. 기본 연결 테스트
    console.log('2️⃣ Supabase 기본 연결 테스트 중...');
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️  기본 연결 테스트 실패 - 테이블이 아직 생성되지 않았을 수 있습니다.');
      console.log('   Supabase 대시보드에서 setup-supabase-schema.sql을 실행해주세요.');
    } else {
      console.log('✅ 기본 연결 테스트 성공');
    }

    // 3. 관리자 클라이언트 테스트
    console.log('\n3️⃣ 관리자 클라이언트 테스트 중...');
    try {
      const adminClient = getSupabaseAdmin();
      console.log('✅ 관리자 클라이언트 초기화 성공');

      // 간단한 쿼리 테스트
      const { data, error } = await adminClient
        .from('holiday_descriptions')
        .select('count')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log('⚠️  테이블이 존재하지 않습니다. 스키마를 먼저 설정해주세요.');
        } else {
          console.log(`⚠️  쿼리 테스트 실패: ${error.message}`);
        }
      } else {
        console.log('✅ 관리자 권한 쿼리 테스트 성공');
      }
    } catch (error) {
      console.error('❌ 관리자 클라이언트 테스트 실패:', error);
    }

    // 4. 서비스 클래스 테스트
    console.log('\n4️⃣ 서비스 클래스 테스트 중...');
    try {
      const service = new SupabaseHolidayDescriptionService();
      
      // 대시보드 통계 조회 테스트
      const stats = await service.getDashboardStats();
      console.log('✅ 서비스 클래스 초기화 및 통계 조회 성공');
      console.log(`   - 총 설명 수: ${stats.totalDescriptions}`);
      console.log(`   - AI 생성: ${stats.aiGeneratedCount}`);
      console.log(`   - 수동 작성: ${stats.manualCount}`);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('relation "holiday_descriptions" does not exist')) {
        console.log('⚠️  테이블이 존재하지 않습니다. 스키마를 먼저 설정해주세요.');
      } else {
        console.error('❌ 서비스 클래스 테스트 실패:', error);
      }
    }

    console.log('\n🎉 Supabase 연결 테스트가 완료되었습니다!');
    console.log('\n📋 다음 단계:');
    console.log('1. Supabase 대시보드에서 scripts/setup-supabase-schema.sql 실행');
    console.log('2. 데이터 마이그레이션 스크립트 실행');
    console.log('3. 어드민 페이지 구현 시작');

  } catch (error) {
    console.error('\n💥 테스트 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  testSupabaseConnection();
}