#!/usr/bin/env tsx

/**
 * 성능 테스트 실행 스크립트
 * 
 * 사용법:
 * npm run test:performance
 * 또는
 * npx tsx test-performance.ts
 */

// 환경 변수 로드
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { runFullPerformanceTest, savePerformanceTestResults } from './src/lib/performance-tester';

async function main() {
  console.log('🚀 World Holiday Calendar 성능 테스트 시작');
  console.log('=' .repeat(60));

  try {
    // 전체 성능 테스트 실행
    const results = await runFullPerformanceTest();

    // 결과 출력
    console.log('\n📊 테스트 결과 요약');
    console.log('=' .repeat(60));
    
    console.log('\n🔄 배치 처리 테스트:');
    console.log(`  개별 조회: ${results.batchTest.individual.duration}ms`);
    console.log(`  배치 조회: ${results.batchTest.batch.duration}ms`);
    console.log(`  성능 개선: ${results.batchTest.improvement}%`);
    
    console.log('\n🔥 캐시 워밍 테스트:');
    console.log(`  워밍 전: ${results.warmingTest.beforeWarming.duration}ms`);
    console.log(`  워밍 후: ${results.warmingTest.afterWarming.duration}ms`);
    console.log(`  성능 개선: ${results.warmingTest.improvement}%`);
    
    console.log('\n🏠 홈페이지 로딩 시뮬레이션:');
    console.log(`  소요 시간: ${results.homePageTest.duration}ms`);
    console.log(`  처리 항목: ${results.homePageTest.itemsProcessed}개`);
    console.log(`  초당 처리량: ${results.homePageTest.itemsPerSecond}개/초`);
    
    console.log('\n📈 전체 요약:');
    console.log(`  총 테스트 시간: ${results.summary.totalDuration}ms`);
    console.log(`  전체 성능 개선: ${results.summary.overallImprovement}%`);
    
    console.log('\n💡 권장사항:');
    results.summary.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });

    // 결과 저장
    await savePerformanceTestResults(results);

    console.log('\n✅ 성능 테스트 완료!');
    
    // 성능 개선이 충분한지 확인
    if (results.summary.overallImprovement > 25) {
      console.log('🎉 성능 개선이 성공적입니다!');
      process.exit(0);
    } else {
      console.log('⚠️ 추가 성능 최적화가 필요할 수 있습니다.');
      process.exit(0);
    }

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