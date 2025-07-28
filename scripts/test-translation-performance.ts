#!/usr/bin/env tsx

/**
 * 번역 시스템 성능 테스트 스크립트
 */

import { 
  loadTranslation, 
  loadTranslations,
  getCacheInfo,
  getClientCacheInfo,
  clearTranslationCache,
  resetCacheStats,
  warmupCache,
  smartWarmupCache,
  generateCachePerformanceReport,
  debugCachePerformance
} from '../src/lib/translation-loader';

async function testPerformance() {
  console.log('🚀 번역 시스템 성능 테스트 시작\n');

  // 1. 초기 상태 확인
  console.log('📊 초기 캐시 상태:');
  console.log(getCacheInfo());
  console.log('');

  // 2. 기본 로딩 성능 테스트
  console.log('⏱️  기본 로딩 성능 테스트...');
  const startTime = Date.now();
  
  await loadTranslation('ko', 'common');
  await loadTranslation('en', 'common');
  await loadTranslation('ko', 'navigation');
  await loadTranslation('en', 'navigation');
  
  const basicLoadTime = Date.now() - startTime;
  console.log(`기본 로딩 시간: ${basicLoadTime}ms`);
  console.log('');

  // 3. 캐시 히트 성능 테스트
  console.log('⚡ 캐시 히트 성능 테스트...');
  const cacheStartTime = Date.now();
  
  // 같은 데이터를 다시 로드 (캐시에서 가져와야 함)
  await loadTranslation('ko', 'common');
  await loadTranslation('en', 'common');
  await loadTranslation('ko', 'navigation');
  await loadTranslation('en', 'navigation');
  
  const cacheHitTime = Date.now() - cacheStartTime;
  console.log(`캐시 히트 시간: ${cacheHitTime}ms`);
  console.log(`성능 향상: ${Math.round((basicLoadTime / cacheHitTime) * 100) / 100}배`);
  console.log('');

  // 4. 병렬 로딩 성능 테스트
  console.log('🔄 병렬 로딩 성능 테스트...');
  clearTranslationCache();
  resetCacheStats();
  
  const parallelStartTime = Date.now();
  
  await Promise.all([
    loadTranslations('ko'),
    loadTranslations('en')
  ]);
  
  const parallelLoadTime = Date.now() - parallelStartTime;
  console.log(`병렬 로딩 시간: ${parallelLoadTime}ms`);
  console.log('');

  // 5. 캐시 워밍업 테스트
  console.log('🔥 캐시 워밍업 테스트...');
  clearTranslationCache();
  resetCacheStats();
  
  const warmupStartTime = Date.now();
  await warmupCache('high');
  const warmupTime = Date.now() - warmupStartTime;
  
  console.log(`캐시 워밍업 시간: ${warmupTime}ms`);
  
  // 워밍업 후 로딩 시간 측정
  const afterWarmupStartTime = Date.now();
  await loadTranslation('ko', 'common');
  await loadTranslation('en', 'common');
  const afterWarmupTime = Date.now() - afterWarmupStartTime;
  
  console.log(`워밍업 후 로딩 시간: ${afterWarmupTime}ms`);
  console.log('');

  // 6. 스마트 캐시 워밍업 테스트
  console.log('🧠 스마트 캐시 워밍업 테스트...');
  clearTranslationCache();
  resetCacheStats();
  
  const smartWarmupStartTime = Date.now();
  await smartWarmupCache('en', 'ko');
  const smartWarmupTime = Date.now() - smartWarmupStartTime;
  
  console.log(`스마트 워밍업 시간: ${smartWarmupTime}ms`);
  console.log('');

  // 7. 최종 캐시 상태 및 성능 리포트
  console.log('📈 최종 성능 리포트:');
  const report = generateCachePerformanceReport();
  
  console.log('메모리 캐시:');
  console.log(`  - 크기: ${report.memory.size}개 엔트리`);
  console.log(`  - 히트율: ${report.memory.hitRate}%`);
  console.log(`  - 총 요청: ${report.memory.stats.totalRequests}`);
  console.log(`  - 히트: ${report.memory.stats.hits}`);
  console.log(`  - 미스: ${report.memory.stats.misses}`);
  console.log(`  - 제거: ${report.memory.stats.evictions}`);
  console.log('');

  console.log('클라이언트 캐시:');
  console.log(`  - localStorage: ${report.client.localStorage.entries}개 엔트리, ${Math.round(report.client.localStorage.size / 1024)}KB`);
  console.log(`  - sessionStorage: ${report.client.sessionStorage.entries}개 엔트리, ${Math.round(report.client.sessionStorage.size / 1024)}KB`);
  console.log('');

  if (report.recommendations.length > 0) {
    console.log('💡 권장사항:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log('');
  }

  console.log('🏆 상위 캐시 엔트리:');
  report.memory.topEntries.slice(0, 5).forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.key} (접근: ${entry.accessCount}회, 나이: ${Math.round(entry.age / 1000)}초)`);
  });
  console.log('');

  // 8. 성능 요약
  console.log('📋 성능 요약:');
  console.log(`  - 기본 로딩: ${basicLoadTime}ms`);
  console.log(`  - 캐시 히트: ${cacheHitTime}ms (${Math.round((basicLoadTime / cacheHitTime) * 100) / 100}배 빠름)`);
  console.log(`  - 병렬 로딩: ${parallelLoadTime}ms`);
  console.log(`  - 캐시 워밍업: ${warmupTime}ms`);
  console.log(`  - 스마트 워밍업: ${smartWarmupTime}ms`);
  console.log(`  - 캐시 히트율: ${report.memory.hitRate}%`);
  
  console.log('\n✅ 성능 테스트 완료!');
}

// 스크립트 실행
if (require.main === module) {
  testPerformance().catch(error => {
    console.error('❌ 성능 테스트 실패:', error);
    process.exit(1);
  });
}

export { testPerformance };