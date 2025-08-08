/**
 * 간단한 성능 테스트 도구 (Supabase 없이 로컬 캐시만 사용)
 * 
 * 배치 처리와 데이터 로딩 개선 효과를 측정합니다.
 */

import { POPULAR_COUNTRIES, CURRENT_YEAR } from './constants';
import { loadHolidayData, getAllAvailableData, getHolidaysByMonth } from './data-loader';
import { logInfo } from './error-logger';

export interface SimplePerformanceTestResult {
  testName: string;
  duration: number;
  itemsProcessed: number;
  itemsPerSecond: number;
  details: any;
}

/**
 * 개별 로딩 vs 병렬 로딩 성능 비교
 */
export async function testSequentialVsParallel(): Promise<{
  sequential: SimplePerformanceTestResult;
  parallel: SimplePerformanceTestResult;
  improvement: number;
}> {
  console.log('🚀 순차 vs 병렬 로딩 성능 테스트 시작...');

  // 테스트 대상 국가들
  const testCountries = POPULAR_COUNTRIES.slice(0, 5);

  // 1. 순차 로딩 테스트
  console.log('📝 순차 로딩 테스트...');
  const sequentialStart = Date.now();
  
  let sequentialItems = 0;
  for (const country of testCountries) {
    try {
      const holidays = await loadHolidayData(country.code, CURRENT_YEAR, 'ko');
      sequentialItems += holidays.length;
    } catch (error) {
      console.warn(`순차 로딩 실패: ${country.name}`, error);
    }
  }
  
  const sequentialDuration = Date.now() - sequentialStart;
  
  const sequentialResult: SimplePerformanceTestResult = {
    testName: '순차 로딩',
    duration: sequentialDuration,
    itemsProcessed: sequentialItems,
    itemsPerSecond: Math.round((sequentialItems / sequentialDuration) * 1000),
    details: {
      countriesProcessed: testCountries.length,
      averageHolidaysPerCountry: Math.round(sequentialItems / testCountries.length)
    }
  };

  // 2. 병렬 로딩 테스트
  console.log('📦 병렬 로딩 테스트...');
  const parallelStart = Date.now();
  
  const parallelPromises = testCountries.map(async (country) => {
    try {
      return await loadHolidayData(country.code, CURRENT_YEAR, 'ko');
    } catch (error) {
      console.warn(`병렬 로딩 실패: ${country.name}`, error);
      return [];
    }
  });
  
  const parallelResults = await Promise.all(parallelPromises);
  const parallelItems = parallelResults.reduce((sum, holidays) => sum + holidays.length, 0);
  
  const parallelDuration = Date.now() - parallelStart;
  
  const parallelResult: SimplePerformanceTestResult = {
    testName: '병렬 로딩',
    duration: parallelDuration,
    itemsProcessed: parallelItems,
    itemsPerSecond: Math.round((parallelItems / parallelDuration) * 1000),
    details: {
      countriesProcessed: testCountries.length,
      averageHolidaysPerCountry: Math.round(parallelItems / testCountries.length)
    }
  };

  const improvement = sequentialDuration > 0 ? 
    Math.round(((sequentialDuration - parallelDuration) / sequentialDuration) * 100) : 0;

  console.log('✅ 순차 vs 병렬 로딩 테스트 완료');
  console.log(`순차 로딩: ${sequentialDuration}ms (${sequentialItems}개 항목)`);
  console.log(`병렬 로딩: ${parallelDuration}ms (${parallelItems}개 항목)`);
  console.log(`성능 개선: ${improvement}%`);

  return {
    sequential: sequentialResult,
    parallel: parallelResult,
    improvement
  };
}

/**
 * 홈페이지 로딩 시뮬레이션 테스트 (간단 버전)
 */
export async function testHomePageLoadingSimple(): Promise<SimplePerformanceTestResult> {
  console.log('🏠 홈페이지 로딩 시뮬레이션 테스트 시작...');

  const startTime = Date.now();

  try {
    // 홈페이지에서 필요한 데이터들을 병렬로 로딩
    const [availableData, monthlyHolidays] = await Promise.all([
      getAllAvailableData(),
      (async () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        return await getHolidaysByMonth(currentYear, currentMonth);
      })()
    ]);

    // 인기 국가들의 데이터 로딩
    const popularCountries = POPULAR_COUNTRIES.slice(0, 8);
    const countryDataPromises = popularCountries
      .filter(country => availableData[country.code] && availableData[country.code].length > 0)
      .map(async (country) => {
        try {
          const availableYears = availableData[country.code];
          const targetYear = availableYears.includes(CURRENT_YEAR) ? CURRENT_YEAR : availableYears[0];
          return await loadHolidayData(country.code, targetYear, 'ko');
        } catch (error) {
          console.warn(`국가 데이터 로딩 실패: ${country.name}`, error);
          return [];
        }
      });

    const countryDataResults = await Promise.all(countryDataPromises);
    const totalHolidays = countryDataResults.reduce((sum, holidays) => sum + holidays.length, 0);

    const duration = Date.now() - startTime;
    const totalItems = totalHolidays + monthlyHolidays.length;

    const result: SimplePerformanceTestResult = {
      testName: '홈페이지 로딩 시뮬레이션',
      duration,
      itemsProcessed: totalItems,
      itemsPerSecond: Math.round((totalItems / duration) * 1000),
      details: {
        availableCountries: Object.keys(availableData).length,
        popularCountriesProcessed: countryDataResults.filter(data => data.length > 0).length,
        monthlyHolidays: monthlyHolidays.length,
        totalCountryHolidays: totalHolidays,
        averageHolidaysPerCountry: Math.round(totalHolidays / countryDataResults.length)
      }
    };

    console.log('✅ 홈페이지 로딩 시뮬레이션 완료');
    console.log(`총 소요 시간: ${duration}ms`);
    console.log(`처리된 항목: ${totalItems}개`);
    console.log(`초당 처리량: ${result.itemsPerSecond}개/초`);

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ 홈페이지 로딩 시뮬레이션 실패:', error);

    return {
      testName: '홈페이지 로딩 시뮬레이션 (실패)',
      duration,
      itemsProcessed: 0,
      itemsPerSecond: 0,
      details: {
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    };
  }
}

/**
 * 데이터 로딩 효율성 테스트
 */
export async function testDataLoadingEfficiency(): Promise<SimplePerformanceTestResult> {
  console.log('📊 데이터 로딩 효율성 테스트 시작...');

  const startTime = Date.now();
  let totalItems = 0;
  let successfulLoads = 0;
  let failedLoads = 0;

  try {
    // 모든 인기 국가의 현재 연도 데이터 로딩 테스트
    const loadingPromises = POPULAR_COUNTRIES.map(async (country) => {
      try {
        const holidays = await loadHolidayData(country.code, CURRENT_YEAR, 'ko');
        totalItems += holidays.length;
        successfulLoads++;
        return holidays.length;
      } catch (error) {
        console.warn(`데이터 로딩 실패: ${country.name}`, error);
        failedLoads++;
        return 0;
      }
    });

    const results = await Promise.all(loadingPromises);
    const duration = Date.now() - startTime;

    const result: SimplePerformanceTestResult = {
      testName: '데이터 로딩 효율성',
      duration,
      itemsProcessed: totalItems,
      itemsPerSecond: Math.round((totalItems / duration) * 1000),
      details: {
        totalCountries: POPULAR_COUNTRIES.length,
        successfulLoads,
        failedLoads,
        successRate: Math.round((successfulLoads / POPULAR_COUNTRIES.length) * 100),
        averageHolidaysPerCountry: successfulLoads > 0 ? Math.round(totalItems / successfulLoads) : 0,
        countryResults: POPULAR_COUNTRIES.map((country, index) => ({
          country: country.name,
          code: country.code,
          holidayCount: results[index],
          success: results[index] > 0
        }))
      }
    };

    console.log('✅ 데이터 로딩 효율성 테스트 완료');
    console.log(`총 소요 시간: ${duration}ms`);
    console.log(`성공한 로딩: ${successfulLoads}/${POPULAR_COUNTRIES.length}개 국가`);
    console.log(`처리된 공휴일: ${totalItems}개`);
    console.log(`초당 처리량: ${result.itemsPerSecond}개/초`);

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ 데이터 로딩 효율성 테스트 실패:', error);

    return {
      testName: '데이터 로딩 효율성 (실패)',
      duration,
      itemsProcessed: totalItems,
      itemsPerSecond: 0,
      details: {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        successfulLoads,
        failedLoads
      }
    };
  }
}

/**
 * 간단한 전체 성능 테스트 실행
 */
export async function runSimplePerformanceTest(): Promise<{
  parallelTest: any;
  homePageTest: SimplePerformanceTestResult;
  efficiencyTest: SimplePerformanceTestResult;
  summary: {
    totalDuration: number;
    overallImprovement: number;
    recommendations: string[];
  };
}> {
  console.log('🎯 간단한 성능 테스트 시작...');
  const fullTestStart = Date.now();

  try {
    // 1. 병렬 처리 테스트
    const parallelTest = await testSequentialVsParallel();

    // 2. 홈페이지 로딩 시뮬레이션
    const homePageTest = await testHomePageLoadingSimple();

    // 3. 데이터 로딩 효율성 테스트
    const efficiencyTest = await testDataLoadingEfficiency();

    const totalDuration = Date.now() - fullTestStart;
    const overallImprovement = parallelTest.improvement;

    // 권장사항 생성
    const recommendations: string[] = [];
    
    if (parallelTest.improvement > 30) {
      recommendations.push('✅ 병렬 처리가 매우 효과적입니다. 계속 사용하세요.');
    } else if (parallelTest.improvement > 10) {
      recommendations.push('✅ 병렬 처리가 효과적입니다.');
    } else {
      recommendations.push('⚠️ 병렬 처리 효과가 제한적입니다. 데이터 크기나 네트워크를 확인하세요.');
    }

    if (homePageTest.itemsPerSecond > 50) {
      recommendations.push('✅ 홈페이지 로딩 성능이 우수합니다.');
    } else if (homePageTest.itemsPerSecond > 20) {
      recommendations.push('✅ 홈페이지 로딩 성능이 양호합니다.');
    } else {
      recommendations.push('⚠️ 홈페이지 로딩 성능을 개선할 필요가 있습니다.');
    }

    if (efficiencyTest.details.successRate > 80) {
      recommendations.push('✅ 데이터 로딩 안정성이 우수합니다.');
    } else if (efficiencyTest.details.successRate > 60) {
      recommendations.push('✅ 데이터 로딩 안정성이 양호합니다.');
    } else {
      recommendations.push('⚠️ 데이터 로딩 안정성을 개선해야 합니다.');
    }

    const summary = {
      totalDuration,
      overallImprovement,
      recommendations
    };

    console.log('🎉 간단한 성능 테스트 완료!');
    console.log(`총 테스트 시간: ${totalDuration}ms`);
    console.log(`병렬 처리 개선: ${overallImprovement}%`);
    console.log('권장사항:', recommendations);

    return {
      parallelTest,
      homePageTest,
      efficiencyTest,
      summary
    };

  } catch (error) {
    console.error('❌ 간단한 성능 테스트 실패:', error);
    throw error;
  }
}

/**
 * 성능 테스트 결과를 파일로 저장
 */
export async function saveSimplePerformanceTestResults(results: any): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const resultsPath = path.join(process.cwd(), 'logs', 'simple-performance-test-results.json');
    
    const testReport = {
      timestamp: new Date().toISOString(),
      testType: 'simple_performance_test',
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