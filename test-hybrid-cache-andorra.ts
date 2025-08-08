#!/usr/bin/env npx tsx

/**
 * 하이브리드 캐시에서 안도라 카니발 확인 스크립트
 */

// 환경 변수 직접 설정
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://wkajscrxfcmeksyxllft.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYWpzY3J4ZmNtZWtzeXhsbGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzU4NDUsImV4cCI6MjA2OTg1MTg0NX0.dZi1lmJYODf0JlGaiIVQEG0Txnp2EobW_8YBDoZ6oC4';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYWpzY3J4ZmNtZWtzeXhsbGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI3NTg0NSwiZXhwIjoyMDY5ODUxODQ1fQ.CQpI2Bsq1Oc8v4FqhbcqtmNY9fgS6njqxd-S2-ntSbQ';

import { getCachedDescription } from './src/lib/hybrid-cache';

async function testHybridCacheAndorra() {
  console.log('🔍 하이브리드 캐시에서 안도라 카니발 확인...\n');

  try {
    // 1. 한국어 설명 확인
    console.log('1️⃣ 한국어 설명 확인...');
    const koDescription = await getCachedDescription(
      'ad_2024_2024-02-12_Carnival',
      'Carnival',
      'Andorra',
      'ko'
    );

    if (koDescription) {
      console.log('✅ 한국어 설명 발견:');
      console.log(`   - 신뢰도: ${koDescription.confidence}`);
      console.log(`   - 생성 시간: ${koDescription.generatedAt}`);
      console.log(`   - 내용 미리보기: ${koDescription.description.substring(0, 100)}...`);
    } else {
      console.log('❌ 한국어 설명 없음');
    }

    // 2. 영어 설명 확인
    console.log('\n2️⃣ 영어 설명 확인...');
    const enDescription = await getCachedDescription(
      'ad_2024_2024-02-12_Carnival',
      'Carnival',
      'Andorra',
      'en'
    );

    if (enDescription) {
      console.log('✅ 영어 설명 발견:');
      console.log(`   - 신뢰도: ${enDescription.confidence}`);
      console.log(`   - 생성 시간: ${enDescription.generatedAt}`);
      console.log(`   - 내용 미리보기: ${enDescription.description.substring(0, 100)}...`);
    } else {
      console.log('❌ 영어 설명 없음');
    }

    // 3. 상태 요약
    console.log('\n📊 상태 요약:');
    console.log(`한국어: ${koDescription ? '✅ 있음' : '❌ 없음'}`);
    console.log(`영어: ${enDescription ? '✅ 있음' : '❌ 없음'}`);
    console.log(`완료 상태: ${koDescription && enDescription ? '✅ 완료' : '❌ 미완료'}`);

  } catch (error) {
    console.error('❌ 하이브리드 캐시 확인 실패:', error);
  }
}

testHybridCacheAndorra().catch(console.error);