#!/usr/bin/env tsx

/**
 * Supabase에서 Andorra Carnival 설명 확인
 */

import { SupabaseHolidayDescriptionService } from '../src/lib/supabase-client';

async function checkAndorraCarnivalInSupabase() {
  console.log('🔍 Supabase에서 Andorra Carnival 설명 확인 중...\n');

  try {
    const service = new SupabaseHolidayDescriptionService();

    // 1. Andorra 관련 모든 설명 조회
    console.log('1️⃣ Andorra 관련 모든 설명 조회...');
    const andorraDescriptions = await service.getDescriptions({
      page: 1,
      limit: 100,
      countryName: 'Andorra'
    });

    console.log(`📊 Andorra 관련 설명 총 ${andorraDescriptions.data.length}개 발견:`);
    andorraDescriptions.data.forEach((desc, index) => {
      console.log(`   ${index + 1}. ${desc.holiday_name} (${desc.locale}) - ${desc.is_manual ? '수동' : 'AI'} 작성`);
    });

    // 2. Carnival 특별 확인
    const carnivalDescriptions = andorraDescriptions.data.filter(desc => 
      desc.holiday_name.toLowerCase().includes('carnival')
    );

    if (carnivalDescriptions.length > 0) {
      console.log(`\n🎭 Carnival 설명 발견 (${carnivalDescriptions.length}개):`);
      carnivalDescriptions.forEach(desc => {
        console.log(`   - 언어: ${desc.locale}`);
        console.log(`   - 작성 방식: ${desc.is_manual ? '수동' : 'AI'}`);
        console.log(`   - 작성자: ${desc.modified_by}`);
        console.log(`   - 설명: ${desc.description.substring(0, 100)}...`);
        console.log(`   - 생성일: ${desc.created_at}`);
        console.log('');
      });
    } else {
      console.log('\n❌ Supabase에서 Andorra Carnival 설명을 찾을 수 없습니다.');
    }

    // 3. 직접 검색으로도 확인
    console.log('2️⃣ 직접 검색으로 Carnival 확인...');
    try {
      const koResult = await service.getDescription('Carnival', 'Andorra', 'ko');
      const enResult = await service.getDescription('Carnival', 'Andorra', 'en');

      console.log(`   - 한국어 설명: ${koResult ? '있음' : '없음'}`);
      if (koResult) {
        console.log(`     * 작성 방식: ${koResult.is_manual ? '수동' : 'AI'}`);
        console.log(`     * 작성자: ${koResult.modified_by}`);
      }

      console.log(`   - 영어 설명: ${enResult ? '있음' : '없음'}`);
      if (enResult) {
        console.log(`     * 작성 방식: ${enResult.is_manual ? '수동' : 'AI'}`);
        console.log(`     * 작성자: ${enResult.modified_by}`);
      }

      // 결론
      const hasKorean = !!koResult;
      const hasEnglish = !!enResult;
      const shouldBeInMissingList = !(hasKorean && hasEnglish);

      console.log(`\n📋 결론:`);
      console.log(`   - 한국어 설명: ${hasKorean ? '있음' : '없음'}`);
      console.log(`   - 영어 설명: ${hasEnglish ? '있음' : '없음'}`);
      console.log(`   - "설명 없는 공휴일" 목록에 포함되어야 함: ${shouldBeInMissingList}`);

    } catch (error) {
      console.error('직접 검색 실패:', error);
    }

  } catch (error) {
    console.error('Supabase 조회 실패:', error);
  }
}

// 스크립트 실행
checkAndorraCarnivalInSupabase().catch(console.error);