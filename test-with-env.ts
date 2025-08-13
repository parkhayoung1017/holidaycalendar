#!/usr/bin/env tsx

/**
 * 환경 변수를 직접 로드하여 어드민 설명 테스트
 */

import { config } from 'dotenv';
import path from 'path';

// .env.local 파일 로드
config({ path: path.join(process.cwd(), '.env.local') });

import { HybridCacheService } from './src/lib/hybrid-cache';

async function testWithEnv() {
  console.log('🔍 환경 변수 로드 후 어드민 설명 테스트\n');

  // 1. 환경 변수 확인
  console.log('📋 환경 변수 상태:');
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  envVars.forEach(env => {
    const value = process.env[env];
    if (value) {
      console.log(`   ✅ ${env}: 설정됨 (${value.substring(0, 30)}...)`);
    } else {
      console.log(`   ❌ ${env}: 미설정`);
    }
  });

  try {
    // 2. 하이브리드 캐시 테스트
    console.log('\n🔄 하이브리드 캐시 테스트:');
    const hybridCache = new HybridCacheService();
    
    // 테스트할 공휴일들
    const testCases = [
      { name: 'Christmas Day', country: 'South Korea', locale: 'ko' },
      { name: 'New Year\'s Day', country: 'South Korea', locale: 'ko' },
      { name: 'Independence Day', country: 'United States', locale: 'ko' }
    ];

    for (const testCase of testCases) {
      console.log(`\n   🔍 테스트: ${testCase.name} (${testCase.country})`);
      
      try {
        const result = await hybridCache.getDescription(
          testCase.name,
          testCase.country,
          testCase.locale
        );
        
        if (result) {
          console.log(`   ✅ 설명 발견:`);
          console.log(`      제목: ${result.title || 'N/A'}`);
          console.log(`      설명 길이: ${result.description?.length || 0}자`);
          console.log(`      소스: ${result.source || 'N/A'}`);
          console.log(`      미리보기: ${result.description?.substring(0, 100) || 'N/A'}...`);
        } else {
          console.log(`   ❌ 설명 없음`);
        }
      } catch (error) {
        console.log(`   ❌ 오류: ${error}`);
      }
    }

    // 3. 캐시 통계 확인
    console.log('\n📊 캐시 통계:');
    try {
      const stats = hybridCache.getStats();
      console.log(`   Supabase 사용 가능: ${stats.isSupabaseAvailable ? '✅' : '❌'}`);
      console.log(`   Supabase 히트: ${stats.supabaseHits}`);
      console.log(`   로컬 캐시 히트: ${stats.localHits}`);
      console.log(`   미스: ${stats.misses}`);
      console.log(`   오류: ${stats.errors}`);
    } catch (error) {
      console.log(`   ❌ 통계 조회 실패: ${error}`);
    }

    console.log('\n✅ 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  testWithEnv();
}