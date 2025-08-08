#!/usr/bin/env npx tsx

/**
 * 안도라 카니발 Supabase 데이터 직접 확인 스크립트
 */

// 환경 변수 직접 설정
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://wkajscrxfcmeksyxllft.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYWpzY3J4ZmNtZWtzeXhsbGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzU4NDUsImV4cCI6MjA2OTg1MTg0NX0.dZi1lmJYODf0JlGaiIVQEG0Txnp2EobW_8YBDoZ6oC4';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYWpzY3J4ZmNtZWtzeXhsbGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI3NTg0NSwiZXhwIjoyMDY5ODUxODQ1fQ.CQpI2Bsq1Oc8v4FqhbcqtmNY9fgS6njqxd-S2-ntSbQ';

import { SupabaseHolidayDescriptionService } from './src/lib/supabase-client';

async function checkAndorraCarnivalInSupabase() {
  console.log('🔍 Supabase에서 안도라 카니발 설명 확인 중...\n');

  try {
    const service = new SupabaseHolidayDescriptionService();

    // 1. 안도라 관련 모든 설명 조회
    console.log('1️⃣ 안도라 관련 모든 설명 조회...');
    const andorraDescriptions = await service.getDescriptions({
      countryName: 'Andorra',
      page: 1,
      limit: 100
    });

    console.log(`📊 안도라 설명 총 ${andorraDescriptions.data.length}개 발견:`);
    andorraDescriptions.data.forEach((desc, index) => {
      console.log(`${index + 1}. ${desc.holiday_name} (${desc.locale}) - ${desc.is_manual ? '수동' : '자동'} - ${desc.modified_by || 'N/A'}`);
    });

    // 2. 카니발 특별 확인
    console.log('\n2️⃣ 카니발 관련 설명 확인...');
    const carnivalDescriptions = andorraDescriptions.data.filter(desc => 
      desc.holiday_name.toLowerCase().includes('carnival')
    );

    if (carnivalDescriptions.length > 0) {
      console.log(`🎯 카니발 설명 ${carnivalDescriptions.length}개 발견:`);
      carnivalDescriptions.forEach((desc, index) => {
        console.log(`${index + 1}. ${desc.holiday_name} (${desc.country_name}, ${desc.locale})`);
        console.log(`   - 수동 작성: ${desc.is_manual ? '✅' : '❌'}`);
        console.log(`   - 작성자: ${desc.modified_by || 'N/A'}`);
        console.log(`   - 설명 미리보기: ${desc.description.substring(0, 100)}...`);
        console.log('');
      });
    } else {
      console.log('❌ 카니발 설명을 찾을 수 없습니다.');
    }

    // 3. 직접 검색으로 카니발 확인
    console.log('3️⃣ 직접 검색으로 카니발 확인...');
    try {
      const koResult = await service.getDescriptions({
        holidayName: 'Carnival',
        countryName: 'Andorra',
        locale: 'ko',
        limit: 5
      });
      
      const enResult = await service.getDescriptions({
        holidayName: 'Carnival',
        countryName: 'Andorra',
        locale: 'en',
        limit: 5
      });

      console.log(`   - 한국어 설명: ${koResult.data.length > 0 ? '있음' : '없음'}`);
      if (koResult.data.length > 0) {
        console.log(`     내용: ${koResult.data[0].description.substring(0, 100)}...`);
      }

      console.log(`   - 영어 설명: ${enResult.data.length > 0 ? '있음' : '없음'}`);
      if (enResult.data.length > 0) {
        console.log(`     내용: ${enResult.data[0].description.substring(0, 100)}...`);
      }

    } catch (error) {
      console.error('직접 검색 실패:', error);
    }

    // 4. 수동 작성된 설명만 확인
    console.log('\n4️⃣ 수동 작성된 설명만 확인...');
    const manualDescriptions = await service.getDescriptions({
      countryName: 'Andorra',
      isManual: true,
      page: 1,
      limit: 100
    });

    console.log(`📝 안도라 수동 작성 설명 ${manualDescriptions.data.length}개:`);
    manualDescriptions.data.forEach((desc, index) => {
      console.log(`${index + 1}. ${desc.holiday_name} (${desc.locale}) - ${desc.modified_by}`);
    });

  } catch (error) {
    console.error('❌ Supabase 조회 실패:', error);
  }
}

checkAndorraCarnivalInSupabase().catch(console.error);