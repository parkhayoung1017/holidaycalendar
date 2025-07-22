import { getHolidaysByDate } from './src/lib/data-loader';

async function testTodayHolidays() {
  console.log('=== 오늘의 공휴일 테스트 ===');
  
  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0];
  console.log('오늘 날짜:', today);
  
  try {
    const todayHolidays = await getHolidaysByDate(today);
    console.log('오늘의 공휴일 개수:', todayHolidays.length);
    console.log('오늘의 공휴일:', todayHolidays);
  } catch (error) {
    console.error('오늘의 공휴일 로드 오류:', error);
  }
  
  // 실제 공휴일이 있는 날짜로 테스트 (미국 신정)
  console.log('\n=== 2024-01-01 테스트 ===');
  try {
    const newYearHolidays = await getHolidaysByDate('2024-01-01');
    console.log('2024-01-01 공휴일 개수:', newYearHolidays.length);
    console.log('2024-01-01 공휴일:', newYearHolidays);
  } catch (error) {
    console.error('2024-01-01 공휴일 로드 오류:', error);
  }
  
  // 7월 4일 미국 독립기념일 테스트
  console.log('\n=== 2024-07-04 테스트 ===');
  try {
    const independenceDay = await getHolidaysByDate('2024-07-04');
    console.log('2024-07-04 공휴일 개수:', independenceDay.length);
    console.log('2024-07-04 공휴일:', independenceDay);
  } catch (error) {
    console.error('2024-07-04 공휴일 로드 오류:', error);
  }
}

testTodayHolidays().catch(console.error);