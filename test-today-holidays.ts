#!/usr/bin/env tsx

/**
 * 오늘의 공휴일 기능을 테스트하는 스크립트
 */

import { getHolidaysByDate } from './src/lib/data-loader';
import { SUPPORTED_COUNTRIES } from './src/lib/constants';

async function testTodayHolidays() {
  console.log('🧪 오늘의 공휴일 기능 테스트');
  console.log('─────────────────────────────────────');

  // 테스트할 날짜들
  const testDates = [
    '2025-01-01', // 신정 (여러 국가)
    '2025-12-25', // 크리스마스 (여러 국가)
    '2025-07-04', // 미국 독립기념일
    '2025-07-20', // 오늘 (공휴일 없음)
  ];

  for (const date of testDates) {
    console.log(`\n📅 ${date} 테스트:`);
    
    try {
      const holidays = await getHolidaysByDate(date);
      
      if (holidays.length === 0) {
        console.log('   ❌ 공휴일이 없습니다.');
      } else {
        console.log(`   ✅ ${holidays.length}개의 공휴일 발견:`);
        
        // 국가별로 그룹화
        const countryGroups = holidays.reduce((acc, holiday) => {
          const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === holiday.countryCode);
          const key = holiday.countryCode;
          
          if (!acc[key]) {
            acc[key] = {
              countryCode: holiday.countryCode,
              countryName: countryInfo?.name || holiday.country,
              countryFlag: countryInfo?.flag || '🏳️',
              holidays: []
            };
          }
          acc[key].holidays.push(holiday);
          return acc;
        }, {} as Record<string, any>);

        Object.values(countryGroups).forEach((group: any) => {
          console.log(`      ${group.countryFlag} ${group.countryName}:`);
          group.holidays.forEach((holiday: any) => {
            console.log(`         • ${holiday.name} (${holiday.type})`);
          });
        });
      }
    } catch (error) {
      console.error(`   ❌ 에러 발생:`, error);
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log('🏁 테스트 완료');
}

// 스크립트 실행
testTodayHolidays().catch(console.error);