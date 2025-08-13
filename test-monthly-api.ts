#!/usr/bin/env tsx

/**
 * 월별 공휴일 API 테스트 스크립트
 */

import { getHolidaysByMonth } from './src/lib/data-loader';

async function testMonthlyAPI() {
  console.log('🧪 월별 공휴일 API 테스트 시작...\n');

  try {
    // 현재 월 테스트
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    console.log(`📅 테스트 대상: ${currentYear}년 ${currentMonth + 1}월`);
    
    const holidays = await getHolidaysByMonth(currentYear, currentMonth);
    
    console.log(`\n📊 결과:`);
    console.log(`   총 공휴일 수: ${holidays.length}개`);
    
    // 국가별 통계
    const countryStats = holidays.reduce((acc, holiday) => {
      acc[holiday.countryCode] = (acc[holiday.countryCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalCountries = Object.keys(countryStats).length;
    console.log(`   참여 국가 수: ${totalCountries}개국`);
    
    // 상위 10개 국가 표시
    const topCountries = Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    console.log(`\n🏆 공휴일이 많은 상위 10개국:`);
    topCountries.forEach(([country, count], index) => {
      console.log(`   ${index + 1}. ${country}: ${count}개`);
    });
    
    // 샘플 공휴일 표시
    console.log(`\n📋 샘플 공휴일 (처음 10개):`);
    holidays.slice(0, 10).forEach((holiday, index) => {
      console.log(`   ${index + 1}. ${holiday.date} - ${holiday.name} (${holiday.countryCode})`);
    });
    
    // 2026년 테스트
    console.log(`\n🔮 2026년 ${currentMonth + 1}월 테스트:`);
    const futureHolidays = await getHolidaysByMonth(2026, currentMonth);
    console.log(`   2026년 공휴일 수: ${futureHolidays.length}개`);
    
    const futureCountryStats = futureHolidays.reduce((acc, holiday) => {
      acc[holiday.countryCode] = (acc[holiday.countryCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`   2026년 참여 국가 수: ${Object.keys(futureCountryStats).length}개국`);
    
    // 2026년 샘플
    console.log(`\n📋 2026년 샘플 공휴일 (처음 5개):`);
    futureHolidays.slice(0, 5).forEach((holiday, index) => {
      console.log(`   ${index + 1}. ${holiday.date} - ${holiday.name} (${holiday.countryCode})`);
    });
    
    console.log('\n✅ 월별 공휴일 API 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  testMonthlyAPI();
}