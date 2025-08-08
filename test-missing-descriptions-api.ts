#!/usr/bin/env npx tsx

/**
 * 설명 없는 공휴일 API 테스트 스크립트
 */

async function testMissingDescriptionsAPI() {
  console.log('🔍 설명 없는 공휴일 API 테스트 시작...\n');

  try {
    // 1. 설명 없는 공휴일 목록 조회
    console.log('1️⃣ 설명 없는 공휴일 목록 조회...');
    const response = await fetch('http://localhost:3000/api/admin/descriptions/missing?limit=10');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📊 API 응답:', {
      success: data.success,
      total: data.metadata?.total || 0,
      currentPage: data.metadata?.page || 1,
      totalPages: data.metadata?.totalPages || 0,
      itemsCount: data.data?.length || 0
    });

    // 2. 안도라 카니발 확인
    const andorraCarnival = data.data?.find((holiday: any) => 
      holiday.holiday_name === 'Carnival' && holiday.country_name === 'Andorra'
    );

    if (andorraCarnival) {
      console.log('\n🎯 안도라 카니발 발견:', {
        holiday_name: andorraCarnival.holiday_name,
        country_name: andorraCarnival.country_name,
        country_code: andorraCarnival.country_code,
        date: andorraCarnival.date,
        year: andorraCarnival.year,
        language_status: andorraCarnival.language_status
      });
    } else {
      console.log('\n❌ 안도라 카니발이 목록에 없습니다.');
    }

    // 3. 처음 5개 항목의 언어별 상태 확인
    console.log('\n📋 처음 5개 항목의 언어별 상태:');
    data.data?.slice(0, 5).forEach((holiday: any, index: number) => {
      console.log(`${index + 1}. ${holiday.holiday_name} (${holiday.country_name})`);
      console.log(`   한국어: ${holiday.language_status?.ko ? '✅ 작성됨' : '❌ 미작성'}`);
      console.log(`   영어: ${holiday.language_status?.en ? '✅ 작성됨' : '❌ 미작성'}`);
    });

  } catch (error) {
    console.error('❌ API 테스트 실패:', error);
  }
}

// 서버가 실행 중인지 확인
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/health', { 
      method: 'GET',
      timeout: 5000 
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const isServerRunning = await checkServerStatus();
  
  if (!isServerRunning) {
    console.log('⚠️ 서버가 실행되지 않았습니다. 다음 명령어로 서버를 시작하세요:');
    console.log('   npm run dev');
    console.log('\n서버 시작 후 다시 테스트해주세요.');
    return;
  }

  await testMissingDescriptionsAPI();
}

main().catch(console.error);