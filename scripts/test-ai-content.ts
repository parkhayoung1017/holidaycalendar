#!/usr/bin/env tsx

/**
 * AI 콘텐츠 생성 시스템 테스트 스크립트
 * 
 * 사용법:
 * npx tsx scripts/test-ai-content.ts
 */

import { 
  generateHolidayDescription, 
  generateCountryOverview,
  generateBulkDescriptions,
  validateContent,
  getSupportedCountries,
  getCountryStats
} from '../src/lib/ai-content-generator';
import { AIContentRequest, Holiday } from '../src/types';

async function testAIContentGeneration() {
  console.log('🎉 AI 콘텐츠 생성 시스템 테스트 시작\n');

  // 1. 지원 국가 목록 확인
  console.log('📍 지원 국가 목록:');
  const supportedCountries = getSupportedCountries();
  console.log(supportedCountries.join(', '));
  console.log();

  // 2. 개별 공휴일 설명 생성 테스트
  console.log('🏮 개별 공휴일 설명 생성 테스트:');
  
  const testRequests: AIContentRequest[] = [
    {
      holidayId: 'us-independence-2024',
      holidayName: 'Independence Day',
      countryName: 'United States',
      date: '2024-07-04'
    },
    {
      holidayId: 'kr-chuseok-2024',
      holidayName: '추석',
      countryName: 'South Korea',
      date: '2024-09-17'
    },
    {
      holidayId: 'jp-golden-week-2024',
      holidayName: 'Golden Week',
      countryName: 'Japan',
      date: '2024-04-29'
    },
    {
      holidayId: 'unknown-holiday-2024',
      holidayName: 'Unknown Festival',
      countryName: 'Unknown Country',
      date: '2024-01-01'
    }
  ];

  for (const request of testRequests) {
    try {
      const result = await generateHolidayDescription(request);
      console.log(`\n${request.holidayName} (${request.countryName}):`);
      console.log(`신뢰도: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`설명: ${result.description.substring(0, 100)}...`);
      console.log(`유효성: ${validateContent(result.description) ? '✅ 유효' : '❌ 무효'}`);
    } catch (error) {
      console.error(`❌ ${request.holidayName} 생성 실패:`, error);
    }
  }

  // 3. 국가별 개요 생성 테스트
  console.log('\n\n🌍 국가별 개요 생성 테스트:');
  
  const testCountries = [
    { code: 'US', name: 'United States' },
    { code: 'KR', name: 'South Korea' },
    { code: 'JP', name: 'Japan' },
    { code: 'XX', name: 'Unknown Country' }
  ];

  for (const country of testCountries) {
    try {
      const overview = await generateCountryOverview(country.code, country.name);
      console.log(`\n${country.name}:`);
      console.log(`${overview.substring(0, 150)}...`);
    } catch (error) {
      console.error(`❌ ${country.name} 개요 생성 실패:`, error);
    }
  }

  // 4. 일괄 생성 테스트
  console.log('\n\n📦 일괄 생성 테스트:');
  
  const testHolidays: Holiday[] = [
    {
      id: 'us-christmas-2024',
      name: 'Christmas',
      date: '2024-12-25',
      country: 'United States',
      countryCode: 'US',
      type: 'public',
      global: true
    },
    {
      id: 'kr-newyear-2024',
      name: '설날',
      date: '2024-02-10',
      country: 'South Korea',
      countryCode: 'KR',
      type: 'public',
      global: true
    }
  ];

  try {
    const bulkResults = await generateBulkDescriptions(testHolidays);
    console.log(`✅ ${bulkResults.length}개 공휴일 설명 일괄 생성 완료`);
    
    bulkResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${testHolidays[index].name}:`);
      console.log(`   신뢰도: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   길이: ${result.description.length}자`);
    });
  } catch (error) {
    console.error('❌ 일괄 생성 실패:', error);
  }

  // 5. 통계 정보 확인
  console.log('\n\n📊 국가별 통계 정보:');
  
  for (const countryCode of supportedCountries) {
    const stats = getCountryStats(countryCode);
    console.log(`${countryCode}: ${stats.totalDescriptions}개 설명, 평균 ${stats.averageLength}자`);
  }

  // 6. 콘텐츠 검증 테스트
  console.log('\n\n🔍 콘텐츠 검증 테스트:');
  
  const validationTests = [
    { content: '적절한 길이의 유효한 설명입니다. 충분한 정보를 포함하고 있습니다.', expected: true },
    { content: '짧음', expected: false },
    { content: '매우 '.repeat(200) + '긴 설명', expected: false },
    { content: '하나의 문장으로만 구성된 매우 긴 설명이지만 문장이 하나뿐', expected: false }
  ];

  validationTests.forEach((test, index) => {
    const isValid = validateContent(test.content);
    const status = isValid === test.expected ? '✅' : '❌';
    console.log(`${status} 테스트 ${index + 1}: ${isValid ? '유효' : '무효'} (예상: ${test.expected ? '유효' : '무효'})`);
  });

  console.log('\n🎊 AI 콘텐츠 생성 시스템 테스트 완료!');
}

// 스크립트 실행
if (require.main === module) {
  testAIContentGeneration().catch(console.error);
}

export { testAIContentGeneration };