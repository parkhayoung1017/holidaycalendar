#!/usr/bin/env tsx

/**
 * 어드민 설명이 상세페이지에 반영되지 않는 문제 진단
 */

import { HybridCacheService } from './src/lib/hybrid-cache';
import { loadHolidayData } from './src/lib/data-loader';

async function debugAdminDescriptions() {
  console.log('🔍 어드민 설명 반영 문제 진단 시작...\n');

  try {
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
        console.log(`   ✅ ${env}: 설정됨 (${value.substring(0, 20)}...)`);
      } else {
        console.log(`   ❌ ${env}: 미설정`);
      }
    });

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
          console.log(`      생성일: ${result.generatedAt || 'N/A'}`);
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

    // 4. 실제 공휴일 데이터 로드 테스트
    console.log('\n🎄 실제 공휴일 데이터 로드 테스트:');
    try {
      const holidays = await loadHolidayData('KR', 2024, 'ko');
      const christmas = holidays.find(h => h.name.includes('Christmas') || h.name.includes('크리스마스'));
      
      if (christmas) {
        console.log(`   ✅ 크리스마스 데이터 발견:`);
        console.log(`      이름: ${christmas.name}`);
        console.log(`      설명 길이: ${christmas.description?.length || 0}자`);
        console.log(`      설명 미리보기: ${christmas.description?.substring(0, 100) || 'N/A'}...`);
      } else {
        console.log(`   ❌ 크리스마스 데이터 없음`);
        console.log(`   사용 가능한 공휴일들:`);
        holidays.slice(0, 5).forEach((h, i) => {
          console.log(`      ${i + 1}. ${h.name}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ 공휴일 데이터 로드 실패: ${error}`);
    }

    // 5. 해결 방법 제시
    console.log('\n💡 문제 해결 방법:');
    
    const hasSupabaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!hasSupabaseEnv) {
      console.log('   1. ⚠️  Supabase 환경 변수 설정 필요:');
      console.log('      - .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL 추가');
      console.log('      - .env.local 파일에 NEXT_PUBLIC_SUPABASE_ANON_KEY 추가');
      console.log('      - 어드민 페이지에서 사용하는 동일한 값 사용');
      console.log('');
      console.log('   2. 🔍 어드민 페이지에서 Supabase 설정 확인:');
      console.log('      - http://localhost:3000/admin 접속');
      console.log('      - 개발자 도구 > Network 탭에서 API 호출 확인');
      console.log('      - Supabase URL과 키 복사');
    } else {
      console.log('   1. ✅ Supabase 환경 변수 설정됨');
      console.log('   2. 🔄 개발 서버 재시작 필요할 수 있음');
      console.log('   3. 🧹 브라우저 캐시 클리어 권장');
    }

    console.log('\n✅ 진단 완료!');

  } catch (error) {
    console.error('❌ 진단 실패:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  debugAdminDescriptions();
}