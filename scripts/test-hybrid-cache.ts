#!/usr/bin/env tsx

/**
 * 하이브리드 캐시 조회 테스트 스크립트
 */

import { config } from 'dotenv';
import path from 'path';

// 환경 변수 로드
config({ path: path.join(process.cwd(), '.env.local') });

async function testHybridCache() {
  console.log('🔍 하이브리드 캐시 조회 테스트\n');

  try {
    const { getCachedDescription } = await import('../src/lib/hybrid-cache');
    
    // 테스트 케이스들
    const testCases = [
      {
        holidayName: "Good Friday",
        countryName: "Bosnia and Herzegovina",
        locale: "ko",
        description: "보스니아 헤르체고비나 Good Friday (국가명)"
      },
      {
        holidayName: "Good Friday", 
        countryName: "BA",
        locale: "ko",
        description: "보스니아 헤르체고비나 Good Friday (국가코드)"
      }
    ];

    for (const testCase of testCases) {
      console.log(`📋 테스트: ${testCase.description}`);
      console.log(`   입력: holidayName="${testCase.holidayName}", countryName="${testCase.countryName}", locale="${testCase.locale}"`);
      
      const result = await getCachedDescription(
        testCase.holidayName,
        testCase.countryName,
        testCase.locale
      );

      if (result) {
        console.log('✅ 조회 성공:');
        console.log(`   설명 길이: ${result.description.length}자`);
        console.log(`   신뢰도: ${result.confidence}`);
        console.log(`   수동 작성: ${result.confidence === 1.0 ? 'Yes' : 'No'}`);
        console.log(`   미리보기: ${result.description.substring(0, 100)}...`);
      } else {
        console.log('❌ 조회 실패: 설명을 찾을 수 없음');
      }
      console.log('');
    }

    // 캐시 상태 확인
    console.log('📊 캐시 상태 확인');
    const { getCacheStatus } = await import('../src/lib/hybrid-cache');
    const status = await getCacheStatus();
    
    console.log('하이브리드 캐시 통계:');
    console.log(`  - Supabase 히트: ${status.hybrid.supabaseHits}`);
    console.log(`  - 로컬 캐시 히트: ${status.hybrid.localHits}`);
    console.log(`  - 미스: ${status.hybrid.misses}`);
    console.log(`  - 오류: ${status.hybrid.errors}`);
    console.log(`  - Supabase 사용 가능: ${status.hybrid.isSupabaseAvailable ? '✅' : '❌'}`);
    
    console.log('\n로컬 캐시 통계:');
    console.log(`  - 총 항목 수: ${status.local.totalEntries}`);
    console.log(`  - 마지막 수정: ${status.local.lastModified || '없음'}`);

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 메인 실행
if (require.main === module) {
  testHybridCache().catch(console.error);
}

export { testHybridCache };