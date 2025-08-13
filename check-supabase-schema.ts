#!/usr/bin/env tsx

/**
 * Supabase 테이블 스키마 확인
 */

import { config } from 'dotenv';
import path from 'path';

// .env.local 파일 로드
config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function checkSchema() {
  console.log('🔍 Supabase 테이블 스키마 확인...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ 환경 변수가 설정되지 않았습니다.');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 테이블 구조 확인 (샘플 데이터로)
    console.log('📊 holiday_descriptions 테이블 구조 확인:');
    const { data: sampleData, error: sampleError } = await supabase
      .from('holiday_descriptions')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log(`   ❌ 샘플 데이터 조회 실패: ${sampleError.message}`);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('   ✅ 테이블 컬럼들:');
      const columns = Object.keys(sampleData[0]);
      columns.forEach((col, index) => {
        console.log(`      ${index + 1}. ${col}: ${typeof sampleData[0][col]}`);
      });
      
      console.log('\n   📋 샘플 데이터:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    }

    // 2. 어드민이 작성한 데이터 찾기
    console.log('\n🔍 어드민 작성 데이터 검색:');
    
    // is_manual 컬럼이 있는지 확인
    const { data: manualData, error: manualError } = await supabase
      .from('holiday_descriptions')
      .select('*')
      .eq('is_manual', true)
      .limit(3);

    if (manualError) {
      console.log(`   ❌ is_manual 컬럼 조회 실패: ${manualError.message}`);
      
      // created_by 컬럼으로 시도
      console.log('   🔄 created_by 컬럼으로 재시도...');
      const { data: createdByData, error: createdByError } = await supabase
        .from('holiday_descriptions')
        .select('*')
        .not('created_by', 'is', null)
        .limit(3);

      if (createdByError) {
        console.log(`   ❌ created_by 컬럼 조회 실패: ${createdByError.message}`);
      } else if (createdByData && createdByData.length > 0) {
        console.log(`   ✅ created_by로 ${createdByData.length}개 발견:`);
        createdByData.forEach((item, index) => {
          console.log(`      ${index + 1}. ${item.holiday_name} (${item.country_name})`);
          console.log(`         작성자: ${item.created_by}`);
          console.log(`         설명: ${item.description?.substring(0, 100)}...`);
        });
      }
    } else if (manualData && manualData.length > 0) {
      console.log(`   ✅ 어드민 작성 데이터 ${manualData.length}개 발견:`);
      manualData.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.holiday_name} (${item.country_name})`);
        console.log(`         설명: ${item.description?.substring(0, 100)}...`);
      });
    } else {
      console.log('   ⚠️  어드민 작성 데이터가 없습니다.');
    }

    // 3. 최근 업데이트된 데이터 확인
    console.log('\n📅 최근 업데이트된 데이터:');
    const { data: recentData, error: recentError } = await supabase
      .from('holiday_descriptions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.log(`   ❌ 최근 데이터 조회 실패: ${recentError.message}`);
    } else if (recentData && recentData.length > 0) {
      console.log(`   ✅ 최근 업데이트 ${recentData.length}개:`);
      recentData.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.holiday_name} (${item.country_name})`);
        console.log(`         업데이트: ${item.updated_at}`);
        console.log(`         설명: ${item.description?.substring(0, 80)}...`);
        console.log('');
      });
    }

    console.log('✅ 스키마 확인 완료!');

  } catch (error) {
    console.error('❌ 스키마 확인 실패:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  checkSchema();
}