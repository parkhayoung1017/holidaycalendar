// 우리가 구현한 Holiday API 클라이언트 테스트
import { HolidayApiClient } from './src/lib/holiday-api';
import { HolidayDataCollector } from './src/lib/holiday-data-collector';

async function testOurHolidayClient() {
  console.log('🚀 우리가 구현한 Holiday API 클라이언트 테스트 시작...\n');

  try {
    // Nager.Date API 클라이언트 생성 (무료, API 키 불필요)
    console.log('📅 HolidayApiClient 인스턴스 생성 (Nager.Date API)');
    const client = new HolidayApiClient(undefined, 'nager');
    
    // 연결 테스트
    console.log('🔗 API 연결 테스트 중...');
    const isConnected = await client.testConnection();
    console.log(`연결 상태: ${isConnected ? '✅ 성공' : '❌ 실패'}`);
    
    if (!isConnected) {
      console.log('API 연결에 실패했습니다. 테스트를 중단합니다.');
      return;
    }

    // 미국 2024년 공휴일 데이터 요청
    console.log('\n📅 미국 2024년 공휴일 데이터 요청 중...');
    const usHolidays = await client.fetchHolidaysByCountryYear('US', 2024);
    
    console.log(`✅ 성공! ${usHolidays.length}개의 공휴일 데이터를 받았습니다:`);
    usHolidays.slice(0, 5).forEach(holiday => {
      console.log(`  - ${holiday.date}: ${holiday.name} (${holiday.type}, global: ${holiday.global})`);
    });
    
    // 한국 2024년 공휴일 데이터 요청
    console.log('\n📅 한국 2024년 공휴일 데이터 요청 중...');
    const krHolidays = await client.fetchHolidaysByCountryYear('KR', 2024);
    
    console.log(`✅ 성공! ${krHolidays.length}개의 공휴일 데이터를 받았습니다:`);
    krHolidays.slice(0, 5).forEach(holiday => {
      console.log(`  - ${holiday.date}: ${holiday.name} (${holiday.type}, global: ${holiday.global})`);
    });

    // 데이터 수집기 테스트
    console.log('\n📦 HolidayDataCollector 테스트');
    const collector = new HolidayDataCollector(client, 'test-data');
    
    console.log('캐나다 2024년 공휴일 데이터 수집 및 저장 중...');
    const caHolidays = await collector.collectHolidayData('CA', 2024, false); // 캐시 사용 안함
    
    console.log(`✅ 수집 완료! ${caHolidays.length}개의 공휴일이 파일에 저장되었습니다:`);
    caHolidays.slice(0, 5).forEach(holiday => {
      console.log(`  - ${holiday.date}: ${holiday.name} (ID: ${holiday.id})`);
    });

    // 캐시 테스트
    console.log('\n🗄️ 캐시 기능 테스트');
    console.log('캐나다 2024년 데이터를 다시 요청 (캐시 사용)...');
    const cachedHolidays = await collector.collectHolidayData('CA', 2024, true);
    console.log(`✅ 캐시에서 로드: ${cachedHolidays.length}개의 공휴일`);

    // 여러 국가 일괄 수집 테스트
    console.log('\n🌍 여러 국가 일괄 수집 테스트');
    const countries = ['GB', 'FR', 'DE'];
    const result = await collector.collectMultipleCountries(countries, 2024);
    
    console.log(`✅ 일괄 수집 완료:`);
    console.log(`  - 성공: ${result.success}`);
    console.log(`  - 수집된 공휴일: ${result.holidaysCollected}개`);
    console.log(`  - 소요 시간: ${result.duration}ms`);
    console.log(`  - 에러: ${result.errors.length}개`);

    // 통계 확인
    console.log('\n📊 데이터 통계 확인');
    const stats = await collector.getDataStatistics();
    console.log(`총 파일: ${stats.totalFiles}개`);
    console.log(`총 공휴일: ${stats.totalHolidays}개`);
    console.log(`지원 국가: ${stats.countries.join(', ')}`);
    console.log(`지원 연도: ${stats.years.join(', ')}`);
    console.log(`마지막 업데이트: ${stats.lastUpdated}`);

    console.log('\n🎉 모든 테스트가 성공적으로 완료되었습니다!');
    console.log('\n✨ 구현된 기능들:');
    console.log('  ✅ Holiday API 클라이언트 (재시도 로직 포함)');
    console.log('  ✅ API 응답 데이터 정규화');
    console.log('  ✅ 파일 시스템 기반 데이터 저장');
    console.log('  ✅ 메모리 + 파일 캐싱 시스템');
    console.log('  ✅ 데이터 검증 및 중복 제거');
    console.log('  ✅ 일괄 데이터 수집');
    console.log('  ✅ 통계 및 상태 확인');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error('상세 에러:', error);
  }
}

// 테스트 실행
testOurHolidayClient();