#!/usr/bin/env tsx

/**
 * 월별 공휴일 API 엔드포인트 테스트
 */

async function testAPIEndpoint() {
  console.log('🌐 API 엔드포인트 테스트 시작...\n');

  const baseUrl = 'http://localhost:3000';
  
  try {
    // 현재 월 테스트
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12 형식

    console.log(`📅 테스트: ${year}년 ${month}월`);
    
    const response = await fetch(`${baseUrl}/api/holidays/monthly?year=${year}&month=${month}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`\n📊 API 응답:`);
    console.log(`   성공: ${data.success}`);
    console.log(`   총 공휴일: ${data.total}개`);
    console.log(`   메시지: ${data.message}`);
    
    if (data.data && data.data.length > 0) {
      // 국가별 통계
      const countries = new Set(data.data.map((h: any) => h.countryCode));
      console.log(`   참여 국가: ${countries.size}개국`);
      
      // 샘플 공휴일
      console.log(`\n📋 샘플 공휴일 (처음 5개):`);
      data.data.slice(0, 5).forEach((holiday: any, index: number) => {
        console.log(`   ${index + 1}. ${holiday.date} - ${holiday.name} (${holiday.countryCode})`);
      });
    }
    
    // 2026년 테스트
    console.log(`\n🔮 2026년 ${month}월 테스트:`);
    const futureResponse = await fetch(`${baseUrl}/api/holidays/monthly?year=2026&month=${month}`);
    
    if (futureResponse.ok) {
      const futureData = await futureResponse.json();
      console.log(`   2026년 공휴일: ${futureData.total}개`);
      
      if (futureData.data && futureData.data.length > 0) {
        const futureCountries = new Set(futureData.data.map((h: any) => h.countryCode));
        console.log(`   2026년 참여 국가: ${futureCountries.size}개국`);
        
        console.log(`\n📋 2026년 샘플 (처음 3개):`);
        futureData.data.slice(0, 3).forEach((holiday: any, index: number) => {
          console.log(`   ${index + 1}. ${holiday.date} - ${holiday.name} (${holiday.countryCode})`);
        });
      }
    } else {
      console.log(`   2026년 테스트 실패: ${futureResponse.status}`);
    }
    
    console.log('\n✅ API 엔드포인트 테스트 완료!');
    
  } catch (error) {
    console.error('❌ API 테스트 실패:', error);
    
    // 서버가 실행 중인지 확인
    try {
      const healthCheck = await fetch(`${baseUrl}/api/holidays/monthly?year=2025&month=1`);
      console.log(`서버 상태: ${healthCheck.status}`);
    } catch (serverError) {
      console.error('서버 연결 실패. 개발 서버가 실행 중인지 확인하세요.');
    }
  }
}

// 잠시 대기 후 테스트 (서버 시작 시간 고려)
setTimeout(() => {
  testAPIEndpoint();
}, 3000);