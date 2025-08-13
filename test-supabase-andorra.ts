#!/usr/bin/env tsx

/**
 * Supabase 연결 테스트 및 어드민 설명 확인
 */

import { config } from 'dotenv';
import path from 'path';

// .env.local 파일 로드
config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('📋 환경 변수 확인:');
  console.log(`   URL: ${supabaseUrl ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`   ANON KEY: ${supabaseAnonKey ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`   SERVICE KEY: ${supabaseServiceKey ? '✅ 설정됨' : '❌ 미설정'}`);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ 필수 환경 변수가 없습니다.');
    return;
  }

  try {
    // 1. 기본 연결 테스트 (anon key)
    console.log('\n🔗 기본 연결 테스트 (anon key):');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: testData, error: testError } = await supabaseAnon
      .from('holiday_descriptions')
      .select('count')
      .limit(1);

    if (testError) {
      console.log(`   ❌ 연결 실패: ${testError.message}`);
    } else {
      console.log('   ✅ 기본 연결 성공');
    }

    // 2. 서비스 키 연결 테스트
    if (supabaseServiceKey) {
      console.log('\n🔗 서비스 키 연결 테스트:');
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: serviceData, error: serviceError } = await supabaseService
        .from('holiday_descriptions')
        .select('count')
        .limit(1);

      if (serviceError) {
        console.log(`   ❌ 서비스 키 연결 실패: ${serviceError.message}`);
      } else {
        console.log('   ✅ 서비스 키 연결 성공');
      }
    }

    // 3. 실제 데이터 조회 테스트
    console.log('\n📊 실제 데이터 조회 테스트:');
    const supabase = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : supabaseAnon;

    // 전체 데이터 개수 확인
    const { count, error: countError } = await supabase
      .from('holiday_descriptions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`   ❌ 데이터 개수 조회 실패: ${countError.message}`);
    } else {
      console.log(`   ✅ 총 설명 개수: ${count}개`);
    }

    // 최근 데이터 몇 개 조회
    const { data: recentData, error: recentError } = await supabase
      .from('holiday_descriptions')
      .select('holiday_name, country_name, locale, title, created_at, is_manual')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.log(`   ❌ 최근 데이터 조회 실패: ${recentError.message}`);
    } else {
      console.log(`   ✅ 최근 데이터 ${recentData?.length || 0}개 조회 성공:`);
      recentData?.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.holiday_name} (${item.country_name}) - ${item.is_manual ? '어드민' : 'AI'} 작성`);
      });
    }

    // 4. 특정 공휴일 검색 (어드민이 작성한 것)
    console.log('\n🔍 어드민 작성 설명 검색:');
    const { data: adminData, error: adminError } = await supabase
      .from('holiday_descriptions')
      .select('holiday_name, country_name, title, description, is_manual, created_at')
      .eq('is_manual', true)
      .limit(5);

    if (adminError) {
      console.log(`   ❌ 어드민 설명 조회 실패: ${adminError.message}`);
    } else if (adminData && adminData.length > 0) {
      console.log(`   ✅ 어드민 작성 설명 ${adminData.length}개 발견:`);
      adminData.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.holiday_name} (${item.country_name})`);
        console.log(`         제목: ${item.title || 'N/A'}`);
        console.log(`         설명: ${item.description?.substring(0, 100) || 'N/A'}...`);
        console.log(`         작성일: ${item.created_at}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  어드민 작성 설명이 없습니다.');
    }

    // 5. 크리스마스 설명 검색
    console.log('🎄 크리스마스 설명 검색:');
    const { data: christmasData, error: christmasError } = await supabase
      .from('holiday_descriptions')
      .select('*')
      .ilike('holiday_name', '%christmas%')
      .eq('country_name', 'South Korea')
      .eq('locale', 'ko');

    if (christmasError) {
      console.log(`   ❌ 크리스마스 설명 조회 실패: ${christmasError.message}`);
    } else if (christmasData && christmasData.length > 0) {
      console.log(`   ✅ 크리스마스 설명 ${christmasData.length}개 발견:`);
      christmasData.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.holiday_name}`);
        console.log(`         제목: ${item.title || 'N/A'}`);
        console.log(`         설명: ${item.description?.substring(0, 100) || 'N/A'}...`);
        console.log(`         소스: ${item.is_manual ? '어드민' : 'AI'}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  크리스마스 설명이 없습니다.');
    }

    console.log('✅ Supabase 연결 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  testSupabaseConnection();
}