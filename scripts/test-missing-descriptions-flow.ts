#!/usr/bin/env tsx

/**
 * 설명 없는 공휴일 관리 플로우 테스트 스크립트
 * 
 * 테스트 시나리오:
 * 1. 설명 없는 공휴일 목록 조회
 * 2. 수동으로 설명 작성 및 저장
 * 3. 웹사이트에서 설명 표시 확인
 * 4. 어드민 설명 관리 탭에서 표시 확인
 */

import { config } from 'dotenv';
import path from 'path';

// 환경 변수 로드
config({ path: path.join(process.cwd(), '.env.local') });

async function testMissingDescriptionsFlow() {
  console.log('🚀 설명 없는 공휴일 관리 플로우 테스트 시작\n');

  try {
    // 1. 설명 없는 공휴일 목록 조회 테스트
    console.log('📋 1. 설명 없는 공휴일 목록 조회 테스트');
    const missingResponse = await fetch('http://localhost:3000/api/admin/descriptions/missing?limit=5', {
      headers: {
        'Authorization': 'Bearer test-admin-token', // 실제 환경에서는 유효한 토큰 사용
        'Content-Type': 'application/json'
      }
    });

    if (!missingResponse.ok) {
      throw new Error(`설명 없는 공휴일 조회 실패: ${missingResponse.status}`);
    }

    const missingData = await missingResponse.json();
    console.log(`✅ 설명 없는 공휴일 ${missingData.data?.length || 0}개 조회 성공`);
    
    if (missingData.data && missingData.data.length > 0) {
      const testHoliday = missingData.data[0];
      console.log(`📝 테스트 대상: ${testHoliday.holiday_name} (${testHoliday.country_name})`);

      // 2. 수동으로 설명 작성 및 저장 테스트
      console.log('\n💾 2. 수동 설명 작성 및 저장 테스트');
      const testDescription = `${testHoliday.holiday_name}는 ${testHoliday.country_name}의 중요한 공휴일입니다. 이 날은 특별한 의미를 가지며, 많은 사람들이 기념합니다. (테스트용 설명 - ${new Date().toISOString()})`;
      
      const createResponse = await fetch('http://localhost:3000/api/admin/descriptions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-admin-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          holiday_id: testHoliday.holiday_id,
          holiday_name: testHoliday.holiday_name,
          country_name: testHoliday.country_name,
          locale: 'ko',
          description: testDescription,
          is_manual: true,
          modified_by: 'test-script'
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`설명 저장 실패: ${createResponse.status} - ${errorData.error || '알 수 없는 오류'}`);
      }

      const createData = await createResponse.json();
      console.log('✅ 설명 저장 성공');

      // 3. 하이브리드 캐시에서 설명 조회 테스트
      console.log('\n🔍 3. 하이브리드 캐시에서 설명 조회 테스트');
      
      // 잠시 대기 (캐시 업데이트 시간)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const { getCachedDescription } = await import('../src/lib/hybrid-cache');
        const cachedDesc = await getCachedDescription(
          testHoliday.holiday_name,
          testHoliday.country_name,
          'ko'
        );
        
        if (cachedDesc && cachedDesc.description.includes('테스트용 설명')) {
          console.log('✅ 하이브리드 캐시에서 설명 조회 성공');
          console.log(`📖 설명 미리보기: ${cachedDesc.description.substring(0, 100)}...`);
        } else {
          console.log('⚠️ 하이브리드 캐시에서 설명을 찾을 수 없음');
        }
      } catch (error) {
        console.log('⚠️ 하이브리드 캐시 조회 실패:', error);
      }

      // 4. 어드민 설명 관리 목록에서 확인
      console.log('\n📊 4. 어드민 설명 관리 목록 확인');
      const descriptionsResponse = await fetch('http://localhost:3000/api/admin/descriptions?limit=10&isManual=true', {
        headers: {
          'Authorization': 'Bearer test-admin-token',
          'Content-Type': 'application/json'
        }
      });

      if (!descriptionsResponse.ok) {
        throw new Error(`설명 목록 조회 실패: ${descriptionsResponse.status}`);
      }

      const descriptionsData = await descriptionsResponse.json();
      const manualDescriptions = descriptionsData.descriptions?.filter((desc: any) => 
        desc.is_manual && desc.holiday_name === testHoliday.holiday_name
      ) || [];

      if (manualDescriptions.length > 0) {
        console.log('✅ 어드민 설명 관리 목록에서 수동 작성 설명 확인됨');
        console.log(`📝 작성자: ${manualDescriptions[0].modified_by}`);
      } else {
        console.log('⚠️ 어드민 설명 관리 목록에서 수동 작성 설명을 찾을 수 없음');
      }

      // 5. 데이터 로더를 통한 설명 조회 테스트
      console.log('\n🌐 5. 데이터 로더를 통한 설명 조회 테스트');
      try {
        const { loadHolidayData } = await import('../src/lib/data-loader');
        const holidays = await loadHolidayData(
          testHoliday.country_code.toLowerCase(),
          testHoliday.year,
          'ko'
        );
        
        const targetHoliday = holidays.find(h => h.name === testHoliday.holiday_name);
        if (targetHoliday && targetHoliday.description && targetHoliday.description.includes('테스트용 설명')) {
          console.log('✅ 데이터 로더를 통한 설명 조회 성공 - 웹사이트에 반영됨');
        } else {
          console.log('⚠️ 데이터 로더에서 설명을 찾을 수 없음 - 웹사이트 반영 실패');
        }
      } catch (error) {
        console.log('⚠️ 데이터 로더 테스트 실패:', error);
      }

    } else {
      console.log('ℹ️ 설명 없는 공휴일이 없어서 추가 테스트를 건너뜁니다.');
    }

    console.log('\n🎉 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  }
}

// 캐시 상태 확인 함수
async function checkCacheStatus() {
  console.log('\n📊 캐시 상태 확인');
  
  try {
    const { getCacheStatus } = await import('../src/lib/hybrid-cache');
    const status = await getCacheStatus();
    
    console.log('🔄 하이브리드 캐시 통계:');
    console.log(`  - Supabase 히트: ${status.hybrid.supabaseHits}`);
    console.log(`  - 로컬 캐시 히트: ${status.hybrid.localHits}`);
    console.log(`  - 미스: ${status.hybrid.misses}`);
    console.log(`  - 오류: ${status.hybrid.errors}`);
    console.log(`  - Supabase 사용 가능: ${status.hybrid.isSupabaseAvailable ? '✅' : '❌'}`);
    
    console.log('\n💾 로컬 캐시 통계:');
    console.log(`  - 총 항목 수: ${status.local.totalEntries}`);
    console.log(`  - 마지막 수정: ${status.local.lastModified || '없음'}`);
    
  } catch (error) {
    console.log('⚠️ 캐시 상태 확인 실패:', error);
  }
}

// 메인 실행
async function main() {
  await checkCacheStatus();
  await testMissingDescriptionsFlow();
  await checkCacheStatus();
}

if (require.main === module) {
  main().catch(console.error);
}

export { testMissingDescriptionsFlow, checkCacheStatus };