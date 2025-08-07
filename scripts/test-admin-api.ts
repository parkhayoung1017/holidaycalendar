#!/usr/bin/env tsx

/**
 * 어드민 API 테스트 스크립트
 */

import { config } from 'dotenv';
import path from 'path';

// 환경 변수 로드
config({ path: path.join(process.cwd(), '.env.local') });

async function testCreateDescription() {
  console.log('🧪 어드민 API 테스트 - 설명 생성');

  const testData = {
    holiday_id: "BA-2025-04-18-5",
    holiday_name: "Good Friday",
    country_name: "Bosnia and Herzegovina",
    locale: "ko",
    description: "성 금요일(Good Friday)은 예수 그리스도의 십자가 처형을 기념하는 기독교의 중요한 날입니다. 보스니아 헤르체고비나에서는 주로 세르비아계 정교회 지역(Republika Srpska)에서 기념됩니다. 이 날은 경건한 기도와 묵상의 시간으로, 많은 신자들이 교회에서 특별 예배에 참석합니다. 전통적으로 금식을 하며, 예수의 고난을 기억하고 부활절을 준비하는 의미 깊은 날입니다.",
    is_manual: true,
    modified_by: "test-script"
  };

  try {
    const response = await fetch('http://localhost:3000/api/admin/descriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 실제 환경에서는 유효한 인증 토큰 필요
      },
      body: JSON.stringify(testData)
    });

    console.log('응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('오류 응답:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ 설명 생성 성공:', result);

    // 생성된 설명 조회 테스트
    await testGetDescription();

  } catch (error) {
    console.error('❌ API 호출 실패:', error);
  }
}

async function testGetDescription() {
  console.log('\n🔍 하이브리드 캐시 조회 테스트');

  try {
    const { getCachedDescription } = await import('../src/lib/hybrid-cache');
    
    const result = await getCachedDescription(
      "Good Friday",
      "Bosnia and Herzegovina", 
      "ko"
    );

    if (result) {
      console.log('✅ 설명 조회 성공:', {
        holidayName: result.holidayName,
        countryName: result.countryName,
        descriptionLength: result.description.length,
        confidence: result.confidence,
        preview: result.description.substring(0, 100) + '...'
      });
    } else {
      console.log('❌ 설명을 찾을 수 없음');
    }

  } catch (error) {
    console.error('❌ 하이브리드 캐시 조회 실패:', error);
  }
}

// 메인 실행
if (require.main === module) {
  testCreateDescription().catch(console.error);
}

export { testCreateDescription, testGetDescription };