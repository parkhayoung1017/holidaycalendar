#!/usr/bin/env tsx

/**
 * 로케일별 설명 작성 기능 테스트 스크립트
 * 
 * 이 스크립트는 다음을 테스트합니다:
 * 1. 한국어/영어 설명 작성
 * 2. Supabase 저장 확인
 * 3. 웹사이트에서 로케일별 표시 확인
 */

import { SupabaseHolidayDescriptionService } from '../src/lib/supabase-client';
import { getCachedDescription, setCachedDescription } from '../src/lib/hybrid-cache';

interface TestHoliday {
  holiday_id: string;
  holiday_name: string;
  country_name: string;
  descriptions: {
    ko: string;
    en: string;
  };
}

// 테스트용 공휴일 데이터
const TEST_HOLIDAYS: TestHoliday[] = [
  {
    holiday_id: 'test_christmas_us_2024',
    holiday_name: 'Christmas Day',
    country_name: 'United States',
    descriptions: {
      ko: '크리스마스는 예수 그리스도의 탄생을 기념하는 기독교의 가장 중요한 축일 중 하나입니다. 미국에서는 12월 25일을 연방 공휴일로 지정하여 전국적으로 기념합니다. 이날에는 가족들이 모여 선물을 주고받으며, 크리스마스 트리를 장식하고, 특별한 음식을 함께 나누는 전통이 있습니다.',
      en: 'Christmas Day is one of the most important Christian holidays commemorating the birth of Jesus Christ. In the United States, December 25th is designated as a federal holiday and is celebrated nationwide. On this day, families gather to exchange gifts, decorate Christmas trees, and share special meals together.'
    }
  },
  {
    holiday_id: 'test_chuseok_kr_2024',
    holiday_name: '추석',
    country_name: 'South Korea',
    descriptions: {
      ko: '추석은 한국의 대표적인 전통 명절로, 음력 8월 15일에 기념합니다. 가을 수확을 감사하고 조상에게 차례를 지내는 의미 깊은 날입니다. 온 가족이 고향에 모여 성묘를 하고, 송편과 같은 전통 음식을 만들어 나누어 먹으며, 강강술래와 같은 전통 놀이를 즐깁니다.',
      en: 'Chuseok is Korea\'s most representative traditional holiday, celebrated on the 15th day of the 8th lunar month. It is a meaningful day to give thanks for the autumn harvest and perform ancestral rites. Families gather in their hometowns to visit ancestral graves, make traditional foods like songpyeon, and enjoy traditional games such as ganggangsullae.'
    }
  }
];

async function testLocaleDescriptions() {
  console.log('🧪 로케일별 설명 작성 기능 테스트 시작\n');

  const service = new SupabaseHolidayDescriptionService();
  let successCount = 0;
  let errorCount = 0;

  for (const holiday of TEST_HOLIDAYS) {
    console.log(`📝 테스트 중: ${holiday.holiday_name} (${holiday.country_name})`);

    try {
      // 1. 한국어 설명 저장
      console.log('  🇰🇷 한국어 설명 저장 중...');
      await service.createDescription({
        holiday_id: holiday.holiday_id,
        holiday_name: holiday.holiday_name,
        country_name: holiday.country_name,
        locale: 'ko',
        description: holiday.descriptions.ko,
        is_manual: true,
        modified_by: 'test_script',
        confidence: 1.0
      });

      // 2. 영어 설명 저장
      console.log('  🇺🇸 영어 설명 저장 중...');
      await service.createDescription({
        holiday_id: holiday.holiday_id,
        holiday_name: holiday.holiday_name,
        country_name: holiday.country_name,
        locale: 'en',
        description: holiday.descriptions.en,
        is_manual: true,
        modified_by: 'test_script',
        confidence: 1.0
      });

      // 3. 하이브리드 캐시에도 저장 (웹사이트 반영용)
      console.log('  💾 하이브리드 캐시 업데이트 중...');
      await setCachedDescription(
        holiday.holiday_id,
        holiday.holiday_name,
        holiday.country_name,
        'ko',
        holiday.descriptions.ko,
        1.0
      );

      await setCachedDescription(
        holiday.holiday_id,
        holiday.holiday_name,
        holiday.country_name,
        'en',
        holiday.descriptions.en,
        1.0
      );

      // 4. 저장된 데이터 확인
      console.log('  🔍 저장된 데이터 확인 중...');
      
      const koDescription = await service.getDescription(
        holiday.holiday_name,
        holiday.country_name,
        'ko'
      );
      
      const enDescription = await service.getDescription(
        holiday.holiday_name,
        holiday.country_name,
        'en'
      );

      if (koDescription && enDescription) {
        console.log('  ✅ 성공: 한국어/영어 설명 모두 저장됨');
        console.log(`     - 한국어: ${koDescription.description.substring(0, 50)}...`);
        console.log(`     - 영어: ${enDescription.description.substring(0, 50)}...`);
        successCount++;
      } else {
        console.log('  ❌ 실패: 설명 조회 불가');
        errorCount++;
      }

      // 5. 하이브리드 캐시에서도 확인
      console.log('  🔍 하이브리드 캐시 확인 중...');
      
      const cachedKo = await getCachedDescription(
        holiday.holiday_name,
        holiday.country_name,
        'ko'
      );
      
      const cachedEn = await getCachedDescription(
        holiday.holiday_name,
        holiday.country_name,
        'en'
      );

      if (cachedKo && cachedEn) {
        console.log('  ✅ 하이브리드 캐시 확인 완료');
      } else {
        console.log('  ⚠️ 하이브리드 캐시 일부 누락');
      }

    } catch (error) {
      console.log(`  ❌ 오류 발생: ${error instanceof Error ? error.message : error}`);
      errorCount++;
    }

    console.log(''); // 빈 줄 추가
  }

  // 결과 요약
  console.log('📊 테스트 결과 요약');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${errorCount}개`);
  console.log(`📝 총 테스트: ${TEST_HOLIDAYS.length}개`);

  if (successCount === TEST_HOLIDAYS.length) {
    console.log('\n🎉 모든 테스트가 성공했습니다!');
    console.log('\n다음 단계:');
    console.log('1. 어드민 대시보드에서 로케일별 설명 확인');
    console.log('2. 웹사이트에서 한국어/영어 페이지 확인');
    console.log('3. 실제 공휴일 데이터로 테스트');
  } else {
    console.log('\n⚠️ 일부 테스트가 실패했습니다. 로그를 확인해주세요.');
  }
}

async function cleanupTestData() {
  console.log('🧹 테스트 데이터 정리 중...');
  
  const service = new SupabaseHolidayDescriptionService();
  
  for (const holiday of TEST_HOLIDAYS) {
    try {
      // Supabase에서 테스트 데이터 삭제
      const koDesc = await service.getDescription(holiday.holiday_name, holiday.country_name, 'ko');
      const enDesc = await service.getDescription(holiday.holiday_name, holiday.country_name, 'en');
      
      if (koDesc) {
        await service.deleteDescription(koDesc.id);
        console.log(`  🗑️ 삭제됨: ${holiday.holiday_name} (한국어)`);
      }
      
      if (enDesc) {
        await service.deleteDescription(enDesc.id);
        console.log(`  🗑️ 삭제됨: ${holiday.holiday_name} (영어)`);
      }
    } catch (error) {
      console.log(`  ⚠️ 정리 실패: ${holiday.holiday_name} - ${error}`);
    }
  }
  
  console.log('✅ 테스트 데이터 정리 완료');
}

// 메인 실행
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    await cleanupTestData();
    return;
  }
  
  try {
    await testLocaleDescriptions();
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}