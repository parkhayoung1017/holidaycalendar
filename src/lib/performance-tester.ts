/**
 * 성능 테스트 도구
 * 
 * 캐시 워밍과 배치 처리 개선 효과를 측정합니다.
 * Supabase 환경 변수가 없어도 로컬 캐시 기반으로 테스트 가능합니다.
 */

import { quickWarmCache } from './cache-warmer';
import { POPULAR_COUNTRIES, CURRENT_YEAR } from './constants';
import { loadHolidayData } from './data-loader';
import { getHybridCache } from './hybrid-cache';
import { logInfo } from './error-logger';
import { getHybridCache } from './hybrid-cache';
import { getHybridCache } from './hybrid-cache';

export interface PerformanceTestResult {
  testName: string;
  duration: number;
  itemsProcessed: number;
  itemsPerSecond: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  details: any;
}

/**
 * 개별 조회 vs 배치 조회 성능 비교
 */
export async function testBatchVsIndividual(): Promise<{
  individual: PerformanceTestResult;
  batch: PerformanceTestResult;
  improvement: number;
}> {
  console.log('🚀 배치 처리 성능 테스트 시작...');

  // 테스트 데이터 준비
  const testCountry = POPULAR_COUNTRIES[0]; // 한국
  const holidays = await loadHolidayData(testCountry.code, CURRENT_YEAR, 'ko');
  const testHolidays = holidays.slice(0, 10); // 처음 10개만 테스트

  if (testHolidays.length === 0) {
    throw new Error('테스트할 공휴일 데이터가 없습니다.');
  }

  const cache = getHybridCache();
  
  // 1. 개별 조회 테스트
  console.log('📝 개별 조회 테스트...');
  cache.resetStats();
  const individualStart = Date.now();
  
  for (const holiday of testHolidays) {
    await cache.getDescription(holiday.name, testCountry.name, 'ko');
  }
  
  const individualDuration = Date.now() - individualStart;
  const individualStats = cache.getStats();
  
  const individualResult: PerformanceTestResult = {
    testName: '개별 조회',
    duration: individualDuration,
    itemsProcessed: testHolidays.length,
    itemsPerSecond: Math.round((testHolidays.length / individualDuration) * 1000),
    cacheHits: individualStats.supabaseHits + individualStats.localHits,
    cacheMisses: individualStats.misses,
    errors: individualStats.errors,
    details: individualStats
  };

  // 2. 배치 조회 테스트
  console.log('📦 배치 조회 테스트...');
  cache.resetStats();
  const batchStart = Date.now();
  
  const batchRequests = testHolidays.map(holiday => ({
    holidayName: holiday.name,
    countryName: testCountry.name,
    locale: 'ko'
  }));
  
  await cache.getDescriptions(batchRequests);
  
  const batchDuration = Date.now() - batchStart;
  const batchStats = cache.getStats();
  
  const batchResult: PerformanceTestResult = {
    testName: '배치 조회',
    duration: batchDuration,
    itemsProcessed: testHolidays.length,
    itemsPerSecond: Math.round((testHolidays.length / batchDuration) * 1000),
    cacheHits: batchStats.supabaseHits + batchStats.localHits,
    cacheMisses: batchStats.misses,
    errors: batchStats.errors,
    details: batchStats
  };

  const improvement = individualDuration > 0 ? 
    Math.round(((individualDuration - batchDuration) / individualDuration) * 100) : 0;

  console.log('✅ 배치 처리 성능 테스트 완료');
  console.log(`개별 조회: ${individualDuration}ms`);
  console.log(`배치 조회: ${batchDuration}ms`);
  console.log(`성능 개선: ${improvement}%`);

  return {
    individual: individualResult,
    batch: batchResult,
    improvement
  };
}

/**
 * 캐시 워밍 효과 테스트
 */
export async function testCacheWarmingEffect(): Promise<{
  beforeWarming: PerformanceTestResult;
  afterWarming: PerformanceTestResult;
  improvement: number;
}> {
  console.log('🔥 캐시 워밍 효과 테스트 시작...');

  // 테스트 데이터 준비
  const testCountries = POPULAR_COUNTRIES.slice(0, 3); // 처음 3개 국가
  const cache = getHybridCache();

  // 1. 캐시 워밍 전 테스트
  console.log('❄️ 캐시 워밍 전 테스트...');
  cache.resetStats();
  const beforeStart = Date.now();
  
  let totalItemsBefore = 0;
  for (const country of testCountries) {
    const holidays = await loadHolidayData(country.code, CURRENT_YEAR, 'ko');
    const testHolidays = holidays.slice(0, 5); // 각 국가당 5개
    totalItemsBefore += testHolidays.length;
    
    for (const holiday of testHolidays) {
      await cache.getDescription(holiday.name, country.name, 'ko');
    }
  }
  
  const beforeDuration = Date.now() - beforeStart;
  const beforeStats = cache.getStats();
  
  const beforeResult: PerformanceTestResult = {
    testName: '캐시 워밍 전',
    duration: beforeDuration,
    itemsProcessed: totalItemsBefore,
    itemsPerSecond: Math.round((totalItemsBefore / beforeDuration) * 1000),
    cacheHits: beforeStats.supabaseHits + beforeStats.localHits,
    cacheMisses: beforeStats.misses,
    errors: beforeStats.errors,
    details: beforeStats
  };

  // 2. 캐시 워밍 실행
  console.log('🔥 캐시 워밍 실행...');
  await quickWarmCache();

  // 3. 캐시 워밍 후 테스트
  console.log('🌡️ 캐시 워밍 후 테스트...');
  cache.resetStats();
  const afterStart = Date.now();
  
  let totalItemsAfter = 0;
  for (const country of testCountries) {
    const holidays = await loadHolidayData(country.code, CURRENT_YEAR, 'ko');
    const testHolidays = holidays.slice(0, 5); // 각 국가당 5개
    totalItemsAfter += testHolidays.length;
    
    for (const holiday of testHolidays) {
      await cache.getDescription(holiday.name, country.name, 'ko');
    }
  }
  
  const afterDuration = Date.now() - afterStart;
  const afterStats = cache.getStats();
  
  const afterResult: PerformanceTestResult = {
    testName: '캐시 워밍 후',
    duration: afterDuration,
    itemsProcessed: totalItemsAfter,
    itemsPerSecond: Math.round((totalItemsAfter / afterDuration) * 1000),
    cacheHits: afterStats.supabaseHits + afterStats.localHits,
    cacheMisses: afterStats.misses,
    errors: afterStats.errors,
    details: afterStats
  };

  const improvement = beforeDuration > 0 ? 
    Math.round(((beforeDuration - afterDuration) / beforeDuration) * 100) : 0;

  console.log('✅ 캐시 워밍 효과 테스트 완료');
  console.log(`워밍 전: ${beforeDuration}ms`);
  console.log(`워밍 후: ${afterDuration}ms`);
  console.log(`성능 개선: ${improvement}%`);

  return {
    beforeWarming: beforeResult,
    afterWarming: afterResult,
    improvement
  };
}

/**
 * 홈페이지 로딩 시뮬레이션 테스트
 */
export async function testHomePageLoadingSimulation(): Promise<PerformanceTestResult> {
  console.log('🏠 홈페이지 로딩 시뮬레이션 테스트 시작...');

  const startTime = Date.now();
  const cache = getHybridCache();
  cache.resetStats();

  try {
    // 홈페이지에서 로딩하는 데이터들을 시뮬레이션
    const popularCountries = POPULAR_COUNTRIES.slice(0, 8); // 홈페이지에 표시되는 인기 국가들
    let totalItems = 0;

    // 각 국가의 주요 공휴일들 로딩
    const loadingPromises = popularCountries.map(async (country) => {
      const holidays = await loadHolidayData(country.code, CURRENT_YEAR, 'ko');
      const mainHolidays = holidays.slice(0, 3); // 주요 공휴일 3개만
      totalItems += mainHolidays.length;

      // 배치로 설명 조회
      const requests = mainHolidays.map(holiday => ({
        holidayName: holiday.name,
        countryName: country.name,
        locale: 'ko'
      }));

      return await cache.getDescriptions(requests);
    });

    // 병렬로 모든 국가 데이터 로딩
    await Promise.all(loadingPromises);

    const duration = Date.now() - startTime;
    const stats = cache.getStats();

    const result: PerformanceTestResult = {
      testName: '홈페이지 로딩 시뮬레이션',
      duration,
      itemsProcessed: totalItems,
      itemsPerSecond: Math.round((totalItems / duration) * 1000),
      cacheHits: stats.supabaseHits + stats.localHits,
      cacheMisses: stats.misses,
      errors: stats.errors,
      details: {
        ...stats,
        countriesProcessed: popularCountries.length,
        averageHolidaysPerCountry: Math.round(totalItems / popularCountries.length)
      }
    };

    console.log('✅ 홈페이지 로딩 시뮬레이션 완료');
    console.log(`총 소요 시간: ${duration}ms`);
    console.log(`처리된 항목: ${totalItems}개`);
    console.log(`초당 처리량: ${result.itemsPerSecond}개/초`);

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const stats = cache.getStats();

    console.error('❌ 홈페이지 로딩 시뮬레이션 실패:', error);

    return {
      testName: '홈페이지 로딩 시뮬레이션 (실패)',
      duration,
      itemsProcessed: 0,
      itemsPerSecond: 0,
      cacheHits: stats.supabaseHits + stats.localHits,
      cacheMisses: stats.misses,
      errors: stats.errors + 1,
      details: {
        ...stats,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    };
  }
}

/**
 * 전체 성능 테스트 실행
 */
export async function runFullPerformanceTest(): Promise<{
  batchTest: any;
  warmingTest: any;
  homePageTest: PerformanceTestResult;
  summary: {
    totalDuration: number;
    overallImprovement: number;
    recommendations: string[];
  };
}> {
  console.log('🎯 전체 성능 테스트 시작...');
  const fullTestStart = Date.now();

  try {
    // 1. 배치 처리 테스트
    const batchTest = await testBatchVsIndividual();

    // 2. 캐시 워밍 테스트
    const warmingTest = await testCacheWarmingEffect();

    // 3. 홈페이지 로딩 시뮬레이션
    const homePageTest = await testHomePageLoadingSimulation();

    const totalDuration = Date.now() - fullTestStart;
    const overallImprovement = Math.round((batchTest.improvement + warmingTest.improvement) / 2);

    // 권장사항 생성
    const recommendations: string[] = [];
    
    if (batchTest.improvement > 30) {
      recommendations.push('✅ 배치 처리가 효과적입니다. 계속 사용하세요.');
    } else {
      recommendations.push('⚠️ 배치 처리 효과가 제한적입니다. 네트워크 상태를 확인하세요.');
    }

    if (warmingTest.improvement > 20) {
      recommendations.push('✅ 캐시 워밍이 효과적입니다. 프로덕션에서 활용하세요.');
    } else {
      recommendations.push('⚠️ 캐시 워밍 효과가 제한적입니다. 캐시 전략을 재검토하세요.');
    }

    if (homePageTest.itemsPerSecond > 10) {
      recommendations.push('✅ 홈페이지 로딩 성능이 양호합니다.');
    } else {
      recommendations.push('⚠️ 홈페이지 로딩 성능을 더 개선할 필요가 있습니다.');
    }

    const summary = {
      totalDuration,
      overallImprovement,
      recommendations
    };

    console.log('🎉 전체 성능 테스트 완료!');
    console.log(`총 테스트 시간: ${totalDuration}ms`);
    console.log(`전체 성능 개선: ${overallImprovement}%`);
    console.log('권장사항:', recommendations);

    return {
      batchTest,
      warmingTest,
      homePageTest,
      summary
    };

  } catch (error) {
    console.error('❌ 전체 성능 테스트 실패:', error);
    throw error;
  }
}

/**
 * 성능 테스트 결과를 파일로 저장
 */
export async function savePerformanceTestResults(results: any): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const resultsPath = path.join(process.cwd(), 'logs', 'performance-test-results.json');
    
    const testReport = {
      timestamp: new Date().toISOString(),
      results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    await fs.mkdir(path.dirname(resultsPath), { recursive: true });
    await fs.writeFile(resultsPath, JSON.stringify(testReport, null, 2));
    
    console.log(`📊 성능 테스트 결과 저장됨: ${resultsPath}`);
  } catch (error) {
    console.error('성능 테스트 결과 저장 실패:', error);
  }
}