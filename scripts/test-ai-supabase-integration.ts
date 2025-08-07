#!/usr/bin/env tsx

/**
 * AI 콘텐츠 생성 시스템의 Supabase 연동 테스트 스크립트
 * 
 * 이 스크립트는 AI 콘텐츠 생성 시스템이 Supabase와 올바르게 연동되는지 테스트합니다.
 */

import { 
  saveAIDescriptionToSupabase, 
  addHolidayDescription,
  getAIModelStats,
  findLowConfidenceDescriptions
} from '../src/lib/ai-content-supabase-integration';
import { getCacheStatus } from '../src/lib/hybrid-cache';
import { checkSupabaseConnection } from '../src/lib/supabase';

async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결 상태 확인...');
  
  try {
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
      console.log('✅ Supabase 연결 성공');
      return true;
    } else {
      console.log('❌ Supabase 연결 실패');
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase 연결 오류:', error);
    return false;
  }
}

async function testAIDescriptionSaving() {
  console.log('\n📝 AI 설명 저장 테스트...');
  
  const testData = {
    holidayId: `test-holiday-${Date.now()}`,
    holidayName: 'Test Holiday',
    countryName: 'Test Country',
    locale: 'ko',
    description: '이것은 테스트용 AI 생성 공휴일 설명입니다. 충분한 길이를 가지고 있으며, Supabase 연동 기능을 테스트하기 위해 작성되었습니다.',
    confidence: 0.9,
    aiModel: 'test-model'
  };
  
  try {
    await saveAIDescriptionToSupabase(
      testData.holidayId,
      testData.holidayName,
      testData.countryName,
      testData.locale,
      testData.description,
      testData.confidence,
      testData.aiModel
    );
    
    console.log('✅ AI 설명 저장 성공');
    return true;
  } catch (error) {
    console.log('❌ AI 설명 저장 실패:', error);
    return false;
  }
}

async function testLegacyCompatibility() {
  console.log('\n🔄 레거시 호환성 테스트...');
  
  const testData = {
    holidayId: `legacy-test-${Date.now()}`,
    holidayName: 'Legacy Test Holiday',
    countryName: 'Legacy Test Country',
    description: '이것은 레거시 호환성을 테스트하기 위한 설명입니다.'
  };
  
  try {
    await addHolidayDescription(
      testData.holidayId,
      testData.holidayName,
      testData.countryName,
      testData.description
    );
    
    console.log('✅ 레거시 호환성 테스트 성공');
    return true;
  } catch (error) {
    console.log('❌ 레거시 호환성 테스트 실패:', error);
    return false;
  }
}

async function testHybridCacheIntegration() {
  console.log('\n💾 하이브리드 캐시 통합 테스트...');
  
  try {
    const cacheStatus = await getCacheStatus();
    
    console.log('📊 캐시 상태:');
    console.log(`  - Supabase 히트: ${cacheStatus.hybrid.supabaseHits}`);
    console.log(`  - 로컬 캐시 히트: ${cacheStatus.hybrid.localHits}`);
    console.log(`  - 캐시 미스: ${cacheStatus.hybrid.misses}`);
    console.log(`  - Supabase 연결: ${cacheStatus.hybrid.isSupabaseAvailable ? '✅' : '❌'}`);
    console.log(`  - 로컬 캐시 항목: ${cacheStatus.local.totalEntries}개`);
    
    console.log('✅ 하이브리드 캐시 통합 테스트 성공');
    return true;
  } catch (error) {
    console.log('❌ 하이브리드 캐시 통합 테스트 실패:', error);
    return false;
  }
}

async function testAIModelStats() {
  console.log('\n📈 AI 모델 통계 테스트...');
  
  try {
    const stats = await getAIModelStats();
    
    console.log('📊 AI 모델 통계:');
    console.log(`  - 총 설명 수: ${stats.totalDescriptions}개`);
    console.log(`  - 평균 신뢰도: ${stats.averageConfidence}`);
    console.log('  - 모델별 분포:');
    
    Object.entries(stats.byModel).forEach(([model, count]) => {
      console.log(`    * ${model}: ${count}개`);
    });
    
    console.log('✅ AI 모델 통계 테스트 성공');
    return true;
  } catch (error) {
    console.log('❌ AI 모델 통계 테스트 실패:', error);
    return false;
  }
}

async function testLowConfidenceDetection() {
  console.log('\n🔍 낮은 신뢰도 설명 탐지 테스트...');
  
  try {
    const lowConfidenceItems = await findLowConfidenceDescriptions(0.8);
    
    console.log(`📋 신뢰도 0.8 미만 항목: ${lowConfidenceItems.length}개`);
    
    if (lowConfidenceItems.length > 0) {
      console.log('상위 5개 항목:');
      lowConfidenceItems.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.holidayName} (${item.countryName}) - 신뢰도: ${item.confidence}`);
      });
    }
    
    console.log('✅ 낮은 신뢰도 설명 탐지 테스트 성공');
    return true;
  } catch (error) {
    console.log('❌ 낮은 신뢰도 설명 탐지 테스트 실패:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 AI 콘텐츠 생성 시스템 Supabase 연동 테스트 시작');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Supabase 연결', fn: testSupabaseConnection },
    { name: 'AI 설명 저장', fn: testAIDescriptionSaving },
    { name: '레거시 호환성', fn: testLegacyCompatibility },
    { name: '하이브리드 캐시 통합', fn: testHybridCacheIntegration },
    { name: 'AI 모델 통계', fn: testAIModelStats },
    { name: '낮은 신뢰도 탐지', fn: testLowConfidenceDetection }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} 테스트 중 예외 발생:`, error);
    }
    
    // 테스트 간 간격
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));
  console.log(`통과: ${passedTests}/${totalTests}`);
  console.log(`성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 모든 테스트가 성공적으로 완료되었습니다!');
    console.log('AI 콘텐츠 생성 시스템의 Supabase 연동이 올바르게 작동합니다.');
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다.');
    console.log('실패한 테스트를 확인하고 문제를 해결해주세요.');
  }
  
  console.log('\n📝 다음 단계:');
  console.log('1. 기존 AI 콘텐츠 생성 스크립트들이 새로운 Supabase 연동을 사용하도록 업데이트됨');
  console.log('2. 어드민 페이지에서 AI 생성 설명들을 확인하고 편집할 수 있음');
  console.log('3. 하이브리드 캐시 시스템으로 성능과 안정성이 향상됨');
  console.log('4. AI 모델 정보와 메타데이터가 체계적으로 관리됨');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}