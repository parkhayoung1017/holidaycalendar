#!/usr/bin/env tsx

/**
 * 데이터 수집기 테스트 스크립트
 */

import { createHolidayApiClient } from '../src/lib/holiday-api';
import { createHolidayDataCollector } from '../src/lib/holiday-data-collector';

async function testDataCollector(): Promise<void> {
  console.log('🧪 데이터 수집기 테스트 시작\n');

  try {
    // API 클라이언트 및 데이터 수집기 초기화
    const apiClient = createHolidayApiClient();
    const collector = createHolidayDataCollector(apiClient);

    // 1. API 연결 테스트
    console.log('1️⃣ API 연결 테스트...');
    const isConnected = await apiClient.testConnection();
    console.log(`   결과: ${isConnected ? '✅ 성공' : '❌ 실패'}\n`);

    // 2. 데이터 존재 여부 확인
    console.log('2️⃣ 데이터 존재 여부 확인...');
    const hasUSData = await collector.hasData('US', 2024);
    const hasKRData = await collector.hasData('KR', 2024);
    console.log(`   US 2024: ${hasUSData ? '✅ 존재' : '❌ 없음'}`);
    console.log(`   KR 2024: ${hasKRData ? '✅ 존재' : '❌ 없음'}\n`);

    // 3. 통계 정보 확인
    console.log('3️⃣ 데이터 통계 확인...');
    const stats = await collector.getDataStatistics();
    console.log(`   📁 총 파일 수: ${stats.totalFiles}개`);
    console.log(`   🎉 총 공휴일 수: ${stats.totalHolidays}개`);
    console.log(`   🌍 국가 수: ${stats.countries.length}개`);
    console.log(`   📅 연도 범위: ${stats.years.join(', ')}`);
    console.log(`   🕐 마지막 업데이트: ${stats.lastUpdated}\n`);

    // 4. 새로운 국가 데이터 수집 테스트 (한국)
    if (!hasKRData) {
      console.log('4️⃣ 새로운 국가 데이터 수집 테스트 (한국)...');
      try {
        const holidays = await collector.collectHolidayData('KR', 2024);
        console.log(`   ✅ 성공: ${holidays.length}개 공휴일 수집`);
        
        // 첫 번째 공휴일 정보 출력
        if (holidays.length > 0) {
          const firstHoliday = holidays[0];
          console.log(`   📅 첫 번째 공휴일: ${firstHoliday.name} (${firstHoliday.date})`);
        }
      } catch (error) {
        console.log(`   ❌ 실패: ${error}`);
      }
      console.log();
    }

    // 5. 캐시 테스트
    console.log('5️⃣ 캐시 기능 테스트...');
    const startTime = Date.now();
    const cachedHolidays = await collector.collectHolidayData('US', 2024, true);
    const cacheTime = Date.now() - startTime;
    console.log(`   ✅ 캐시에서 로드: ${cachedHolidays.length}개 공휴일 (${cacheTime}ms)`);

    // 6. 데이터 검증 테스트
    console.log('\n6️⃣ 데이터 검증 테스트...');
    const sampleHoliday = cachedHolidays[0];
    if (sampleHoliday) {
      console.log(`   📝 샘플 공휴일:`);
      console.log(`      이름: ${sampleHoliday.name}`);
      console.log(`      날짜: ${sampleHoliday.date}`);
      console.log(`      국가: ${sampleHoliday.countryCode}`);
      console.log(`      타입: ${sampleHoliday.type}`);
      console.log(`      전국: ${sampleHoliday.global ? 'Yes' : 'No'}`);
      
      // 날짜 검증
      const date = new Date(sampleHoliday.date);
      const isValidDate = !isNaN(date.getTime());
      console.log(`      날짜 유효성: ${isValidDate ? '✅ 유효' : '❌ 무효'}`);
    }

    console.log('\n🎉 모든 테스트 완료!');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  testDataCollector().catch(error => {
    console.error('❌ 예상치 못한 오류:', error);
    process.exit(1);
  });
}

export { testDataCollector };