#!/usr/bin/env node

/**
 * Supabase에 저장된 설명 데이터 디버깅 스크립트
 * 어드민에서 작성한 설명이 어떤 국가명으로 저장되었는지 확인
 */

async function debugSupabaseDescriptions() {
  console.log('🔍 Supabase 설명 데이터 디버깅 시작...\n');

  try {
    // fetch polyfill for older Node.js versions
    if (typeof fetch === 'undefined') {
      try {
        const { default: fetch } = await import('node-fetch');
        global.fetch = fetch;
      } catch (error) {
        console.error('❌ fetch를 사용할 수 없습니다. Node.js 18+ 또는 node-fetch 패키지가 필요합니다.');
        process.exit(1);
      }
    }

    // 어드민 설명 관리 API 호출
    const response = await fetch('http://localhost:3000/api/admin/descriptions?limit=50', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.descriptions && result.descriptions.length > 0) {
      console.log(`📊 총 ${result.descriptions.length}개의 설명이 Supabase에 저장되어 있습니다.\n`);
      
      console.log('📋 저장된 설명 목록:');
      console.log('='.repeat(80));
      
      result.descriptions.forEach((desc, index) => {
        console.log(`${index + 1}. 공휴일: "${desc.holiday_name}"`);
        console.log(`   국가명: "${desc.country_name}"`);
        console.log(`   언어: ${desc.locale}`);
        console.log(`   수동작성: ${desc.is_manual ? '✅' : '❌'}`);
        console.log(`   작성자: ${desc.modified_by || 'N/A'}`);
        console.log(`   설명 길이: ${desc.description.length}자`);
        console.log(`   설명 미리보기: ${desc.description.substring(0, 100)}...`);
        console.log(`   생성일: ${desc.created_at}`);
        console.log(`   수정일: ${desc.modified_at || desc.created_at}`);
        console.log('-'.repeat(80));
      });
      
      // 국가명별 통계
      const countryStats = {};
      result.descriptions.forEach(desc => {
        if (!countryStats[desc.country_name]) {
          countryStats[desc.country_name] = { total: 0, manual: 0, ai: 0 };
        }
        countryStats[desc.country_name].total++;
        if (desc.is_manual) {
          countryStats[desc.country_name].manual++;
        } else {
          countryStats[desc.country_name].ai++;
        }
      });
      
      console.log('\n📈 국가별 설명 통계:');
      console.log('='.repeat(50));
      Object.entries(countryStats).forEach(([country, stats]) => {
        console.log(`${country}: 총 ${stats.total}개 (수동 ${stats.manual}개, AI ${stats.ai}개)`);
      });
      
      // Epiphany 관련 설명 찾기
      const epiphanyDescriptions = result.descriptions.filter(desc => 
        desc.holiday_name.toLowerCase().includes('epiphany') ||
        desc.holiday_name.toLowerCase().includes('주현절')
      );
      
      if (epiphanyDescriptions.length > 0) {
        console.log('\n🎯 Epiphany 관련 설명:');
        console.log('='.repeat(50));
        epiphanyDescriptions.forEach(desc => {
          console.log(`공휴일: "${desc.holiday_name}"`);
          console.log(`국가명: "${desc.country_name}"`);
          console.log(`언어: ${desc.locale}`);
          console.log(`수동작성: ${desc.is_manual ? '✅' : '❌'}`);
          console.log(`설명: ${desc.description.substring(0, 200)}...`);
          console.log('-'.repeat(30));
        });
      } else {
        console.log('\n⚠️ Epiphany 관련 설명을 찾을 수 없습니다.');
      }
      
      // Andorra 관련 설명 찾기
      const andorraDescriptions = result.descriptions.filter(desc => 
        desc.country_name.toLowerCase().includes('andorra') ||
        desc.country_name.toLowerCase().includes('ad')
      );
      
      if (andorraDescriptions.length > 0) {
        console.log('\n🇦🇩 Andorra 관련 설명:');
        console.log('='.repeat(50));
        andorraDescriptions.forEach(desc => {
          console.log(`공휴일: "${desc.holiday_name}"`);
          console.log(`국가명: "${desc.country_name}"`);
          console.log(`언어: ${desc.locale}`);
          console.log(`수동작성: ${desc.is_manual ? '✅' : '❌'}`);
          console.log(`설명: ${desc.description.substring(0, 200)}...`);
          console.log('-'.repeat(30));
        });
      } else {
        console.log('\n⚠️ Andorra 관련 설명을 찾을 수 없습니다.');
      }
      
    } else {
      console.log('📭 Supabase에 저장된 설명이 없습니다.');
    }

  } catch (error) {
    console.error('❌ 디버깅 실패:', error.message);
    
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 해결 방법:');
      console.log('1. 개발 서버가 실행 중인지 확인: npm run dev');
      console.log('2. 포트 3000이 사용 중인지 확인');
      console.log('3. Supabase 연결 설정 확인');
    }
  }
}

if (require.main === module) {
  debugSupabaseDescriptions();
}

module.exports = { debugSupabaseDescriptions };