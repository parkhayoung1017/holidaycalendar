import { generateHolidayDescription } from './src/lib/ai-content-generator-enhanced';

async function testEnhancedContent() {
  console.log('=== 한국 설날 테스트 ===');
  const seollal = await generateHolidayDescription({
    holidayId: 'KR-2024-02-10-1',
    holidayName: 'Lunar New Year',
    countryName: 'South Korea',
    date: '2024-02-10',
    existingDescription: ''
  }, 'ko');
  
  console.log('설날 설명:');
  console.log(seollal.description);
  console.log('\n' + '='.repeat(80) + '\n');
  
  console.log('=== 한국 부처님오신날 테스트 ===');
  const buddha = await generateHolidayDescription({
    holidayId: 'KR-2024-05-15-1',
    holidayName: "Buddha's Birthday",
    countryName: 'South Korea',
    date: '2024-05-15',
    existingDescription: ''
  }, 'ko');
  
  console.log('부처님오신날 설명:');
  console.log(buddha.description);
  console.log('\n' + '='.repeat(80) + '\n');
  
  console.log('=== 미국 독립기념일 테스트 ===');
  const independence = await generateHolidayDescription({
    holidayId: 'US-2024-07-04-1',
    holidayName: 'Independence Day',
    countryName: 'United States',
    date: '2024-07-04',
    existingDescription: ''
  }, 'ko');
  
  console.log('독립기념일 설명:');
  console.log(independence.description);
  console.log('\n' + '='.repeat(80) + '\n');
  
  console.log('=== 매칭되지 않는 공휴일 테스트 ===');
  const unknown = await generateHolidayDescription({
    holidayId: 'TEST-2024-01-01-1',
    holidayName: 'Unknown Holiday',
    countryName: 'Test Country',
    date: '2024-01-01',
    existingDescription: ''
  }, 'ko');
  
  console.log('알 수 없는 공휴일 설명:');
  console.log(unknown.description);
}

testEnhancedContent().catch(console.error);