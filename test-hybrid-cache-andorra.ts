#!/usr/bin/env tsx

/**
 * 하이브리드 캐시 Supabase 연결 테스트
 */

import { config } from 'dotenv';
import path from 'path';

// .env.local 파일 로드
config({ path: path.join(process.cwd(), '.env.local') });

import { HybridCacheService } from './src/lib/hybrid-cache';
import { checkSupabaseConnection } from './src/lib/supabase';

async function testHybridCache() {
  console.log('🔍 하이브리드 캐시 Supabase 연결 테스트\n');

  try {
    // 1. 기본 Supabase 연결 확인
    console.log('🔗 기본 Supabase 연결 확인:');
    const isConnected = await checkSupabaseConnection();
    console.log(`   연결 상태: ${isConnected ? '✅ 성공' : '❌ 실패'}`);

    // 2. 하이브리드 캐시 인스턴스 생성
    console.log('\n🔄 하이브리드 캐시 인스턴스 생성:');
    const hybridCache = new HybridCacheService({
      enableSupabase: true,
      fallbackToLocal: true,
      cacheTimeout: 3600000, // 1시간
      retryAttempts: 2,
      retryDelay: 1000
    });

    // 잠시 대기 (연결 상태 확인 완료 대기)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. 캐시 통계 확인
    console.log('\n📊 초기 캐시 통계:');
    const initialStats = hybridCache.getStats();
    console.log(`   Supabase 사용 가능: ${initialStats.isSupabaseAvailable ? '✅' : '❌'}`);
    console.log(`   마지막 Supabase 확인: ${initialStats.lastSupabaseCheck}`);

    // 4. 어드민이 작성한 설명 테스트
    console.log('\n🔍 어드민 작성 설명 테스트:');
    
    // 실제 어드민이 작성한 데이터 조회 (스키마에서 확인한 데이터)
    const adminTestCases = [
      { name: 'Saint Mary\'s Day', country: 'Georgia', locale: 'ko' },
      { name: 'Emancipation Day', country: 'Barbados', locale: 'ko' },
      { name: 'Independence Day', country: 'Benin', locale: 'ko' }
    ];

    for (const testCase of adminTestCases) {
      console.log(`\n   🎯 테스트: ${testCase.name} (${testCase.country})`);
      
      try {
        const result = await hybridCache.getDescription(
          testCase.name,
          testCase.country,
          testCase.locale
        );
        
        if (result) {
          console.log(`   ✅ 설명 발견:`);
          console.log(`      설명 길이: ${result.description?.length || 0}자`);
          console.log(`      소스: ${result.source || 'N/A'}`);
          console.log(`      생성일: ${result.generatedAt || 'N/A'}`);
          console.log(`      미리보기: ${result.description?.substring(0, 100) || 'N/A'}...`);
        } else {
          console.log(`   ❌ 설명 없음`);
        }
      } catch (error) {
        console.log(`   ❌ 오류: ${error}`);
      }
    }

    // 5. 일반적인 공휴일 테스트
    console.log('\n🎄 일반 공휴일 테스트:');
    const generalTestCases = [
      { name: 'Christmas Day', country: 'South Korea', locale: 'ko' },
      { name: 'New Year\'s Day', country: 'South Korea', locale: 'ko' }
    ];

    for (const testCase of generalTestCases) {
      console.log(`\n   🎯 테스트: ${testCase.name} (${testCase.country})`);
      
      try {
        const result = await hybridCache.getDescription(
          testCase.name,
          testCase.country,
          testCase.locale
        );
        
        if (result) {
          console.log(`   ✅ 설명 발견:`);
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

    // 6. 최종 캐시 통계
    console.log('\n📊 최종 캐시 통계:');
    const finalStats = hybridCache.getStats();
    console.log(`   Supabase 사용 가능: ${finalStats.isSupabaseAvailable ? '✅' : '❌'}`);
    console.log(`   Supabase 히트: ${finalStats.supabaseHits}`);
    console.log(`   로컬 캐시 히트: ${finalStats.localHits}`);
    console.log(`   미스: ${finalStats.misses}`);
    console.log(`   오류: ${finalStats.errors}`);

    console.log('\n✅ 하이브리드 캐시 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  testHybridCache();
}