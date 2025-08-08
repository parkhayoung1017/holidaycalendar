#!/usr/bin/env npx tsx

/**
 * 안도라 관련 설명 없는 공휴일 API 테스트
 */

// 환경 변수 직접 설정
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://wkajscrxfcmeksyxllft.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYWpzY3J4ZmNtZWtzeXhsbGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzU4NDUsImV4cCI6MjA2OTg1MTg0NX0.dZi1lmJYODf0JlGaiIVQEG0Txnp2EobW_8YBDoZ6oC4';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYWpzY3J4ZmNtZWtzeXhsbGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI3NTg0NSwiZXhwIjoyMDY5ODUxODQ1fQ.CQpI2Bsq1Oc8v4FqhbcqtmNY9fgS6njqxd-S2-ntSbQ';

import { NextRequest } from 'next/server';

// missing descriptions API 함수를 직접 import
async function testAndorraMissingAPI() {
  console.log('🔍 안도라 관련 설명 없는 공휴일 API 테스트...\n');

  try {
    // API 함수를 직접 호출하는 대신 로직을 복사해서 테스트
    const { findMissingDescriptions } = await import('./src/app/api/admin/descriptions/missing/route');
    
    // 안도라만 필터링해서 테스트
    console.log('1️⃣ 안도라 공휴일 필터링 테스트...');
    const result = await findMissingDescriptions('ad', undefined, 1, 50);
    
    console.log(`📊 안도라 설명 없는 공휴일: ${result.total}개`);
    
    // 카니발 관련 항목들 확인
    const carnivalItems = result.data.filter(item => 
      item.holiday_name.toLowerCase().includes('carnival')
    );
    
    console.log(`🎭 카니발 관련 항목: ${carnivalItems.length}개`);
    carnivalItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.holiday_name} (${item.date}, ${item.year})`);
      console.log(`   - ID: ${item.holiday_id}`);
      console.log(`   - 국가: ${item.country_name} (${item.country_code})`);
      console.log(`   - 언어 상태: 한국어=${item.language_status?.ko ? '✅' : '❌'}, 영어=${item.language_status?.en ? '✅' : '❌'}`);
      console.log('');
    });
    
    // 중복 확인
    const holidayNames = result.data.map(item => item.holiday_name);
    const duplicates = holidayNames.filter((name, index) => holidayNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      console.log('⚠️ 중복된 공휴일명 발견:');
      [...new Set(duplicates)].forEach(name => {
        const items = result.data.filter(item => item.holiday_name === name);
        console.log(`   - ${name}: ${items.length}개`);
        items.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.date} (${item.year}) - ${item.holiday_id}`);
        });
      });
    } else {
      console.log('✅ 중복된 공휴일명 없음');
    }
    
    // 전체 목록 (처음 10개)
    console.log('\n📋 안도라 설명 없는 공휴일 목록 (처음 10개):');
    result.data.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.holiday_name} (${item.date}, ${item.year})`);
      console.log(`   - 한국어: ${item.language_status?.ko ? '✅' : '❌'}, 영어: ${item.language_status?.en ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ API 테스트 실패:', error);
  }
}

testAndorraMissingAPI().catch(console.error);