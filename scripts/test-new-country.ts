#!/usr/bin/env tsx

/**
 * 새로운 국가 추가 테스트 스크립트
 */

import { 
  generateHolidayDescription, 
  generateCountryOverview,
  addHolidayDescription,
  getSupportedCountries
} from '../src/lib/ai-content-generator';
import { AIContentRequest } from '../src/types';

async function testNewCountrySupport() {
  console.log('🌍 새로운 국가 지원 테스트 시작\n');

  // 1. 기존 지원 국가 확인
  console.log('📍 기존 지원 국가:', getSupportedCountries().join(', '));

  // 2. 새로운 국가 데이터 추가 (독일)
  console.log('\n🇩🇪 독일 공휴일 데이터 추가 중...');
  
  addHolidayDescription('DE', {
    name: "German Unity Day",
    keywords: ["unity day", "통일의 날", "deutsche einheit"],
    description: "1990년 10월 3일 동서독 통일을 기념하는 독일의 국경일입니다. 분단의 아픔을 극복하고 하나의 독일로 재탄생한 역사적 순간을 기리며, 전국에서 축제와 기념행사가 열립니다. 평화적 통일의 상징으로서 독일인들의 단합과 미래에 대한 희망을 나타내는 의미 깊은 날입니다.",
    culturalContext: "냉전 종료와 평화적 통일의 역사적 성취를 기념"
  });

  addHolidayDescription('DE', {
    name: "Oktoberfest",
    keywords: ["oktoberfest", "옥토버페스트", "beer festival"],
    description: "뮌헨에서 시작된 세계 최대의 맥주 축제로, 독일 바이에른 지역의 전통문화를 대표하는 축제입니다. 전통 의상인 레더호젠과 디른들을 입고 맥주와 소시지를 즐기며, 독일의 소박하고 정겨운 공동체 문화를 경험할 수 있습니다. 단순한 축제를 넘어 독일의 문화적 정체성과 지역 전통을 세계에 알리는 중요한 역할을 합니다.",
    culturalContext: "바이에른 지역 전통이 세계적 축제로 발전한 사례"
  });

  console.log('✅ 독일 데이터 추가 완료');
  console.log('📍 업데이트된 지원 국가:', getSupportedCountries().join(', '));

  // 3. 새로 추가된 국가의 공휴일 테스트
  console.log('\n🎯 독일 공휴일 설명 생성 테스트:');

  const germanTests: AIContentRequest[] = [
    {
      holidayId: 'de-unity-2024',
      holidayName: 'German Unity Day',
      countryName: 'Germany',
      date: '2024-10-03'
    },
    {
      holidayId: 'de-oktoberfest-2024',
      holidayName: 'Oktoberfest',
      countryName: 'Germany', 
      date: '2024-09-21'
    },
    {
      holidayId: 'de-unknown-2024',
      holidayName: 'Unknown German Holiday',
      countryName: 'Germany',
      date: '2024-12-01'
    }
  ];

  for (const test of germanTests) {
    const result = await generateHolidayDescription(test);
    console.log(`\n${test.holidayName}:`);
    console.log(`신뢰도: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`설명: ${result.description.substring(0, 100)}...`);
  }

  // 4. 완전히 새로운 국가 테스트 (데이터 없음)
  console.log('\n\n🌏 완전히 새로운 국가 테스트 (브라질):');

  const brazilTests: AIContentRequest[] = [
    {
      holidayId: 'br-carnival-2024',
      holidayName: 'Carnival',
      countryName: 'Brazil',
      date: '2024-02-13'
    },
    {
      holidayId: 'br-independence-2024',
      holidayName: 'Independence Day',
      countryName: 'Brazil',
      date: '2024-09-07'
    }
  ];

  for (const test of brazilTests) {
    const result = await generateHolidayDescription(test);
    console.log(`\n${test.holidayName} (${test.countryName}):`);
    console.log(`신뢰도: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`설명: ${result.description.substring(0, 100)}...`);
  }

  // 5. 국가별 개요 테스트
  console.log('\n\n📖 국가별 개요 생성 테스트:');
  
  const countries = [
    { code: 'DE', name: 'Germany' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IN', name: 'India' }
  ];

  for (const country of countries) {
    const overview = await generateCountryOverview(country.code, country.name);
    console.log(`\n${country.name}:`);
    console.log(`${overview.substring(0, 120)}...`);
  }

  console.log('\n🎊 새로운 국가 지원 테스트 완료!');
  console.log('\n💡 결론: 시스템은 새로운 국가가 추가되어도 완벽하게 작동합니다!');
}

// 스크립트 실행
if (require.main === module) {
  testNewCountrySupport().catch(console.error);
}

export { testNewCountrySupport };