// 실제 Holiday API 테스트 스크립트
const axios = require('axios');

// 간단한 Nager.Date API 테스트
async function testNagerAPI() {
  console.log('🚀 Nager.Date API 직접 테스트 시작...\n');

  try {
    console.log('📅 미국 2024년 공휴일 데이터 요청 중...');
    const response = await axios.get('https://date.nager.at/api/v3/PublicHolidays/2024/US');
    
    console.log(`✅ 성공! ${response.data.length}개의 공휴일 데이터를 받았습니다:`);
    response.data.slice(0, 5).forEach(holiday => {
      console.log(`  - ${holiday.date}: ${holiday.name} (${holiday.global ? 'public' : 'optional'})`);
    });
    
    console.log('\n📅 한국 2024년 공휴일 데이터 요청 중...');
    const krResponse = await axios.get('https://date.nager.at/api/v3/PublicHolidays/2024/KR');
    
    console.log(`✅ 성공! ${krResponse.data.length}개의 공휴일 데이터를 받았습니다:`);
    krResponse.data.slice(0, 5).forEach(holiday => {
      console.log(`  - ${holiday.date}: ${holiday.name} (${holiday.global ? 'public' : 'optional'})`);
    });

    console.log('\n📅 캐나다 2024년 공휴일 데이터 요청 중...');
    const caResponse = await axios.get('https://date.nager.at/api/v3/PublicHolidays/2024/CA');
    
    console.log(`✅ 성공! ${caResponse.data.length}개의 공휴일 데이터를 받았습니다:`);
    caResponse.data.slice(0, 5).forEach(holiday => {
      console.log(`  - ${holiday.date}: ${holiday.name} (${holiday.global ? 'public' : 'optional'})`);
    });

    console.log('\n🎉 모든 API 테스트가 성공적으로 완료되었습니다!');
    console.log('\n📊 요약:');
    console.log(`- 미국: ${response.data.length}개 공휴일`);
    console.log(`- 한국: ${krResponse.data.length}개 공휴일`);
    console.log(`- 캐나다: ${caResponse.data.length}개 공휴일`);
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
}

// 테스트 실행
testNagerAPI();