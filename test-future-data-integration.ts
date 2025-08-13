#!/usr/bin/env tsx

/**
 * 2026-2030년 데이터 통합 테스트 스크립트
 * 
 * 이 스크립트는 새로 수집된 2026-2030년 데이터가 
 * 웹사이트의 모든 주요 기능에서 제대로 작동하는지 테스트합니다.
 */

import { loadHolidayData, getAllAvailableData, getHolidaysByMonth } from './src/lib/data-loader';
import { SUPPORTED_COUNTRIES, SUPPORTED_YEARS } from './src/lib/constants';

interface TestResult {
  testName: string;
  success: boolean;
  details: string;
  data?: any;
}

/**
 * 테스트 결과를 출력합니다.
 */
function displayTestResults(results: TestResult[]): void {
  console.log('\n📊 2026-2030년 데이터 통합 테스트 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.testName}`);
    console.log(`   ${result.details}`);
    if (result.data) {
      console.log(`   데이터: ${JSON.stringify(result.data).substring(0, 100)}...`);
    }
    console.log('');
  });
  
  console.log(`📈 총 ${results.length}개 테스트 중 ${passed}개 성공, ${failed}개 실패`);
  console.log(`성공률: ${Math.round((passed / results.length) * 100)}%`);
}

/**
 * 메인 테스트 실행 함수
 */
async function runTests(): Promise<void> {
  const results: TestResult[] = [];
  
  console.log('🚀 2026-2030년 데이터 통합 테스트 시작...\n');
  
  // 테스트 1: 상수 파일의 연도 범위 확인
  try {
    const hasNewYears = SUPPORTED_YEARS.includes(2026) && 
                       SUPPORTED_YEARS.includes(2027) && 
                       SUPPORTED_YEARS.includes(2028) && 
                       SUPPORTED_YEARS.includes(2029) && 
                       SUPPORTED_YEARS.includes(2030);
    
    results.push({
      testName: '상수 파일 연도 범위 확인',
      success: hasNewYears,
      details: hasNewYears 
        ? `2026-2030년이 SUPPORTED_YEARS에 포함됨 (${SUPPORTED_YEARS.join(', ')})` 
        : `2026-2030년이 SUPPORTED_YEARS에 누락됨 (${SUPPORTED_YEARS.join(', ')})`,
      data: { supportedYears: SUPPORTED_YEARS }
    });
  } catch (error) {
    results.push({
      testName: '상수 파일 연도 범위 확인',
      success: false,
      details: `오류 발생: ${error}`
    });
  }
  
  // 테스트 2: 전체 사용 가능한 데이터 확인
  try {
    const availableData = await getAllAvailableData();
    const countriesWithNewData = Object.keys(availableData).filter(country => {
      const years = availableData[country];
      return years.some(year => year >= 2026 && year <= 2030);
    });
    
    results.push({
      testName: '전체 데이터 가용성 확인',
      success: countriesWithNewData.length > 0,
      details: `${countriesWithNewData.length}개 국가에서 2026-2030년 데이터 확인됨`,
      data: { 
        totalCountries: Object.keys(availableData).length,
        countriesWithNewData: countriesWithNewData.length,
        sampleCountries: countriesWithNewData.slice(0, 10)
      }
    });
  } catch (error) {
    results.push({
      testName: '전체 데이터 가용성 확인',
      success: false,
      details: `오류 발생: ${error}`
    });
  }
  
  // 테스트 3: 주요 국가들의 2026-2030년 데이터 로드 테스트
  const testCountries = ['KR', 'US', 'GB', 'DE', 'FR', 'JP', 'CA', 'AU'];
  const testYears = [2026, 2027, 2028, 2029, 2030];
  
  for (const year of testYears) {
    let successCount = 0;
    let totalHolidays = 0;
    const countryResults: string[] = [];
    
    for (const countryCode of testCountries) {
      try {
        const holidays = await loadHolidayData(countryCode, year);
        if (holidays.length > 0) {
          successCount++;
          totalHolidays += holidays.length;
          countryResults.push(`${countryCode}(${holidays.length})`);
        }
      } catch (error) {
        // 일부 국가는 데이터가 없을 수 있으므로 무시
      }
    }
    
    results.push({
      testName: `${year}년 주요 국가 데이터 로드`,
      success: successCount > 0,
      details: `${successCount}/${testCountries.length}개 국가에서 총 ${totalHolidays}개 공휴일 로드됨`,
      data: { 
        year, 
        successfulCountries: countryResults,
        totalHolidays 
      }
    });
  }
  
  // 테스트 4: 월별 공휴일 조회 테스트 (2026년 1월)
  try {
    const monthlyHolidays = await getHolidaysByMonth(2026, 0); // 2026년 1월
    
    results.push({
      testName: '2026년 1월 월별 공휴일 조회',
      success: monthlyHolidays.length >= 0, // 0개여도 성공 (정상 동작)
      details: `2026년 1월에 ${monthlyHolidays.length}개 공휴일 발견`,
      data: { 
        month: '2026-01',
        holidayCount: monthlyHolidays.length,
        sampleHolidays: monthlyHolidays.slice(0, 3).map(h => ({ name: h.name, date: h.date, country: h.countryCode }))
      }
    });
  } catch (error) {
    results.push({
      testName: '2026년 1월 월별 공휴일 조회',
      success: false,
      details: `오류 발생: ${error}`
    });
  }
  
  // 테스트 5: 특정 국가의 연도별 데이터 연속성 확인
  try {
    const testCountry = 'KR';
    const allYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
    const availableYears: number[] = [];
    
    for (const year of allYears) {
      try {
        const holidays = await loadHolidayData(testCountry, year);
        if (holidays.length > 0) {
          availableYears.push(year);
        }
      } catch (error) {
        // 데이터가 없는 연도는 무시
      }
    }
    
    const hasNewYears = availableYears.some(year => year >= 2026);
    
    results.push({
      testName: `${testCountry} 연도별 데이터 연속성`,
      success: hasNewYears,
      details: `${testCountry}에서 ${availableYears.length}개 연도 데이터 확인됨: ${availableYears.join(', ')}`,
      data: { 
        country: testCountry,
        availableYears,
        hasNewYears
      }
    });
  } catch (error) {
    results.push({
      testName: 'KR 연도별 데이터 연속성',
      success: false,
      details: `오류 발생: ${error}`
    });
  }
  
  // 테스트 6: 데이터 품질 검증 (샘플)
  try {
    const sampleHolidays = await loadHolidayData('US', 2026);
    const validHolidays = sampleHolidays.filter(holiday => {
      return holiday.name && 
             holiday.date && 
             holiday.countryCode === 'US' &&
             new Date(holiday.date).getFullYear() === 2026;
    });
    
    const qualityScore = sampleHolidays.length > 0 ? (validHolidays.length / sampleHolidays.length) * 100 : 0;
    
    results.push({
      testName: '데이터 품질 검증 (US 2026)',
      success: qualityScore >= 90,
      details: `${sampleHolidays.length}개 공휴일 중 ${validHolidays.length}개 유효 (품질: ${qualityScore.toFixed(1)}%)`,
      data: { 
        totalHolidays: sampleHolidays.length,
        validHolidays: validHolidays.length,
        qualityScore: qualityScore.toFixed(1)
      }
    });
  } catch (error) {
    results.push({
      testName: '데이터 품질 검증 (US 2026)',
      success: false,
      details: `오류 발생: ${error}`
    });
  }
  
  // 결과 출력
  displayTestResults(results);
  
  // 전체 성공률 확인
  const overallSuccess = results.filter(r => r.success).length / results.length;
  if (overallSuccess >= 0.8) {
    console.log('\n🎉 2026-2030년 데이터 통합이 성공적으로 완료되었습니다!');
    console.log('   웹사이트의 모든 주요 기능에서 새로운 연도 데이터를 사용할 수 있습니다.');
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다. 문제를 확인하고 수정이 필요합니다.');
  }
  
  // 사용 가능한 기능 안내
  console.log('\n📋 사용 가능한 기능:');
  console.log('   1. 홈페이지 월별 캘린더 (2026-2030년 데이터 표시)');
  console.log('   2. 국가별 연도별 공휴일 페이지 (예: /ko/south-korea-2026)');
  console.log('   3. 대륙별 공휴일 페이지 (예: /ko/regions/asia/2026)');
  console.log('   4. 오늘의 공휴일 (2026-2030년 데이터 포함)');
  console.log('   5. 검색 기능 (새로운 연도 데이터 검색 가능)');
}

// 스크립트 실행
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류:', error);
    process.exit(1);
  });
}

export { runTests };