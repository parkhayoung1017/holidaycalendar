#!/usr/bin/env tsx

/**
 * 간단한 성능 테스트 실행 스크립트 (Supabase 없이)
 * 
 * 사용법:
 * npm run test:performance-simple
 * 또는
 * npx tsx test-performance-simple.ts
 */

import { runSimplePerformanceTest, saveSimplePerformanceTestResults } from './src/lib/performance-tester-simple';

async function main() {
  console.log('🚀 World Holiday Calendar 간단한 성능 테스트 시작');
  console.log('=' .repeat(60));

  try {
    // 간단한 성능 테스트 실행
    const results = await runSimplePerformanceTest();

    // 결과 출력
    console.log('\n📊 테스트 결과 요약');
    console.log('=' .repeat(60));
    
    console.log('\n🔄 병렬 처리 테스트:');
    console.log(`  순차 로딩: ${results.parallelTest.sequential.duration}ms (${results.parallelTest.sequential.itemsProcessed}개 항목)`);
    console.log(`  병렬 로딩: ${results.parallelTest.parallel.duration}ms (${results.parallelTest.parallel.itemsProcessed}개 항목)`);
    console.log(`  성능 개선: ${results.parallelTest.improvement}%`);
    
    console.log('\n🏠 홈페이지 로딩 시뮬레이션:');
    console.log(`  소요 시간: ${results.homePageTest.duration}ms`);
    console.log(`  처리 항목: ${results.homePageTest.itemsProcessed}개`);
    console.log(`  초당 처리량: ${results.homePageTest.itemsPerSecond}개/초`);
    console.log(`  인기 국가 처리: ${results.homePageTest.details.popularCountriesProcessed}개`);
    
    console.log('\n📊 데이터 로딩 효율성:');
    console.log(`  소요 시간: ${results.efficiencyTest.duration}ms`);
    console.log(`  성공률: ${results.efficiencyTest.details.successRate}% (${results.efficiencyTest.details.successfulLoads}/${results.efficiencyTest.details.totalCountries})`);
    console.log(`  처리된 공휴일: ${results.efficiencyTest.itemsProcessed}개`);
    console.log(`  초당 처리량: ${results.efficiencyTest.itemsPerSecond}개/초`);
    
    console.log('\n📈 전체 요약:');
    console.log(`  총 테스트 시간: ${results.summary.totalDuration}ms`);
    console.log(`  병렬 처리 개선: ${results.summary.overallImprovement}%`);
    
    console.log('\n💡 권장사항:');
    results.summary.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });

    // 성공한 국가들 표시
    console.log('\n🌍 국가별 로딩 결과:');
    const countryResults = results.efficiencyTest.details.countryResults || [];
    countryResults.forEach((country: any) => {
      const status = country.success ? '✅' : '❌';
      console.log(`  ${status} ${country.country} (${country.code}): ${country.holidayCount}개 공휴일`);
    });

    // 결과 저장
    await saveSimplePerformanceTestResults(results);

    console.log('\n✅ 성능 테스트 완료!');
    
    // 성능 평가
    const homePagePerformance = results.homePageTest.itemsPerSecond;
    const parallelImprovement = results.parallelTest.improvement;
    const successRate = results.efficiencyTest.details.successRate;

    if (homePagePerformance > 20 && parallelImprovement > 20 && successRate > 70) {
      console.log('🎉 전체적으로 성능이 우수합니다!');
      console.log('💡 Phase 1 성능 개선이 성공적으로 적용되었습니다.');
    } else if (homePagePerformance > 10 && parallelImprovement > 10 && successRate > 50) {
      console.log('✅ 성능이 양호합니다.');
      console.log('💡 추가 최적화를 통해 더 개선할 수 있습니다.');
    } else {
      console.log('⚠️ 성능 개선이 더 필요합니다.');
      console.log('💡 데이터 구조나 네트워크 상태를 확인해보세요.');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ 성능 테스트 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });
}