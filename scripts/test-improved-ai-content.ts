#!/usr/bin/env tsx

/**
 * 개선된 AI 콘텐츠 생성 시스템 테스트 스크립트
 */

import { generateImprovedHolidayDescription, validateHolidayDescription } from '../src/lib/ai-content-generator-improved';
import { AIContentRequest } from '../src/types';

// 테스트할 공휴일 목록
const testHolidays: AIContentRequest[] = [
  // 한국 공휴일
  {
    holidayId: 'KR-2025-01-01-0',
    holidayName: 'New Year\'s Day',
    countryName: 'South Korea',
    date: '2025-01-01'
  },
  {
    holidayId: 'KR-2025-01-30-1',
    holidayName: 'Lunar New Year',
    countryName: 'South Korea',
    date: '2025-01-30'
  },
  {
    holidayId: 'KR-2025-03-01-2',
    holidayName: 'Independence Movement Day',
    countryName: 'South Korea',
    date: '2025-03-01'
  },
  {
    holidayId: 'KR-2025-05-05-3',
    holidayName: 'Children\'s Day',
    countryName: 'South Korea',
    date: '2025-05-05'
  },
  {
    holidayId: 'KR-2025-10-09-4',
    holidayName: 'Hangeul Day',
    countryName: 'South Korea',
    date: '2025-10-09'
  },
  
  // 미국 공휴일
  {
    holidayId: 'US-2025-01-01-0',
    holidayName: 'New Year\'s Day',
    countryName: 'United States',
    date: '2025-01-01'
  },
  {
    holidayId: 'US-2025-07-04-1',
    holidayName: 'Independence Day',
    countryName: 'United States',
    date: '2025-07-04'
  },
  {
    holidayId: 'US-2025-11-27-2',
    holidayName: 'Thanksgiving',
    countryName: 'United States',
    date: '2025-11-27'
  },
  {
    holidayId: 'US-2025-12-25-3',
    holidayName: 'Christmas',
    countryName: 'United States',
    date: '2025-12-25'
  },
  
  // 매칭 테스트용 (데이터베이스에 없는 공휴일)
  {
    holidayId: 'FR-2025-07-14-0',
    holidayName: 'Bastille Day',
    countryName: 'France',
    date: '2025-07-14'
  }
];

async function testImprovedAIContent() {
  console.log('🚀 개선된 AI 콘텐츠 생성 시스템 테스트 시작\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const holiday of testHolidays) {
    console.log(`📅 테스트 중: ${holiday.holidayName} (${holiday.countryName})`);
    
    try {
      // 한국어 설명 생성 테스트
      const koResponse = await generateImprovedHolidayDescription(holiday, 'ko');
      const koValid = validateHolidayDescription(koResponse.description);
      
      console.log(`  ✅ 한국어 설명 생성 성공 (신뢰도: ${koResponse.confidence})`);
      console.log(`  📝 설명 길이: ${koResponse.description.length}자`);
      console.log(`  🔍 품질 검증: ${koValid ? '통과' : '실패'}`);
      
      if (koResponse.description.length > 50) {
        console.log(`  📖 설명 미리보기: ${koResponse.description.substring(0, 100)}...`);
      }
      
      // 영어 설명 생성 테스트 (선택적)
      if (holiday.countryName === 'United States') {
        const enResponse = await generateImprovedHolidayDescription(holiday, 'en');
        console.log(`  ✅ 영어 설명 생성 성공 (신뢰도: ${enResponse.confidence})`);
        console.log(`  📝 영어 설명 길이: ${enResponse.description.length}자`);
      }
      
      successCount++;
      console.log(`  ✅ 테스트 성공\n`);
      
    } catch (error) {
      console.error(`  ❌ 테스트 실패: ${error}`);
      failCount++;
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('📊 테스트 결과 요약');
  console.log(`  ✅ 성공: ${successCount}/${testHolidays.length}`);
  console.log(`  ❌ 실패: ${failCount}/${testHolidays.length}`);
  console.log(`  📈 성공률: ${((successCount / testHolidays.length) * 100).toFixed(1)}%`);
  
  if (successCount === testHolidays.length) {
    console.log('\n🎉 모든 테스트가 성공적으로 완료되었습니다!');
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다. 로그를 확인해주세요.');
  }
}

// 특정 공휴일에 대한 상세 테스트
async function detailedTest(holidayName: string, countryName: string) {
  console.log(`🔍 상세 테스트: ${holidayName} (${countryName})\n`);
  
  const testRequest: AIContentRequest = {
    holidayId: `TEST-${Date.now()}`,
    holidayName,
    countryName,
    date: '2025-01-01'
  };
  
  try {
    const response = await generateImprovedHolidayDescription(testRequest, 'ko');
    
    console.log('📋 생성된 설명:');
    console.log('─'.repeat(50));
    console.log(response.description);
    console.log('─'.repeat(50));
    console.log(`\n📊 메타데이터:`);
    console.log(`  - 신뢰도: ${response.confidence}`);
    console.log(`  - 생성 시간: ${response.generatedAt}`);
    console.log(`  - 설명 길이: ${response.description.length}자`);
    console.log(`  - 품질 검증: ${validateHolidayDescription(response.description) ? '통과' : '실패'}`);
    
  } catch (error) {
    console.error(`❌ 상세 테스트 실패: ${error}`);
  }
}

// 명령행 인수 처리
const args = process.argv.slice(2);

if (args.length === 0) {
  // 전체 테스트 실행
  testImprovedAIContent().catch(console.error);
} else if (args.length === 2) {
  // 특정 공휴일 상세 테스트
  const [holidayName, countryName] = args;
  detailedTest(holidayName, countryName).catch(console.error);
} else {
  console.log('사용법:');
  console.log('  npm run test-improved-ai              # 전체 테스트');
  console.log('  npm run test-improved-ai "설날" "South Korea"  # 특정 공휴일 테스트');
}