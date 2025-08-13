#!/usr/bin/env tsx

/**
 * 특정 공휴일 페이지 문제 진단 (푸에르토리코 Labour Day)
 */

import { config } from 'dotenv';
import path from 'path';

// .env.local 파일 로드
config({ path: path.join(process.cwd(), '.env.local') });

import { loadHolidayData } from './src/lib/data-loader';
import { getCountryCodeFromSlug, createHolidaySlug } from './src/lib/country-utils';
import { HybridCacheService } from './src/lib/hybrid-cache';

async function testSpecificHoliday() {
  console.log('🔍 특정 공휴일 페이지 문제 진단\n');

  try {
    // URL 분석: /ko/holiday/pr/labour-day
    const locale = 'ko';
    const countrySlug = 'pr'; // 푸에르토리코
    const holidaySlug = 'labour-day';

    console.log('📋 URL 분석:');
    console.log(`   언어: ${locale}`);
    console.log(`   국가 슬러그: ${countrySlug}`);
    console.log(`   공휴일 슬러그: ${holidaySlug}`);

    // 1. 국가 코드 변환 확인
    console.log('\n🌍 국가 코드 변환:');
    const countryCode = getCountryCodeFromSlug(countrySlug);
    console.log(`   슬러그 '${countrySlug}' → 국가코드: ${countryCode || '❌ 변환 실패'}`);

    if (!countryCode) {
      console.log('   ⚠️  국가 코드 변환 실패가 문제의 원인일 수 있습니다.');
      return;
    }

    // 2. 해당 국가의 공휴일 데이터 확인
    console.log('\n📅 공휴일 데이터 확인:');
    const currentYear = new Date().getFullYear();
    
    try {
      const holidays = await loadHolidayData(countryCode, currentYear, locale);
      console.log(`   ${countryCode} ${currentYear}년 공휴일: ${holidays.length}개`);

      if (holidays.length > 0) {
        console.log('   📋 사용 가능한 공휴일들:');
        holidays.slice(0, 10).forEach((holiday, index) => {
          const slug = createHolidaySlug(holiday.name);
          console.log(`      ${index + 1}. ${holiday.name} → ${slug}`);
        });

        // 3. 특정 공휴일 찾기
        console.log(`\n🎯 '${holidaySlug}' 공휴일 검색:`);
        const targetHoliday = holidays.find(holiday => {
          const slug = createHolidaySlug(holiday.name);
          return slug === holidaySlug;
        });

        if (targetHoliday) {
          console.log('   ✅ 공휴일 발견:');
          console.log(`      이름: ${targetHoliday.name}`);
          console.log(`      날짜: ${targetHoliday.date}`);
          console.log(`      설명 길이: ${targetHoliday.description?.length || 0}자`);
          console.log(`      설명 미리보기: ${targetHoliday.description?.substring(0, 100) || 'N/A'}...`);

          // 4. 하이브리드 캐시에서 설명 확인
          console.log('\n🔄 하이브리드 캐시 설명 확인:');
          const hybridCache = new HybridCacheService();
          
          const cachedDescription = await hybridCache.getDescription(
            targetHoliday.name,
            countryCode === 'PR' ? 'Puerto Rico' : 'Puerto Rico', // 국가명 변환
            locale
          );

          if (cachedDescription) {
            console.log('   ✅ 캐시된 설명 발견:');
            console.log(`      설명 길이: ${cachedDescription.description?.length || 0}자`);
            console.log(`      소스: ${cachedDescription.source || 'N/A'}`);
            console.log(`      미리보기: ${cachedDescription.description?.substring(0, 100) || 'N/A'}...`);
          } else {
            console.log('   ❌ 캐시된 설명 없음');
          }

        } else {
          console.log('   ❌ 해당 슬러그의 공휴일을 찾을 수 없음');
          console.log('   💡 가능한 원인:');
          console.log('      - 슬러그 생성 로직 불일치');
          console.log('      - 공휴일 이름 변경');
          console.log('      - 해당 연도에 공휴일 없음');
        }
      } else {
        console.log('   ❌ 해당 국가/연도의 공휴일 데이터 없음');
      }

    } catch (error) {
      console.log(`   ❌ 공휴일 데이터 로드 실패: ${error}`);
    }

    // 5. 다른 연도 확인
    console.log('\n📆 다른 연도 확인:');
    const years = [2023, 2024, 2025];
    
    for (const year of years) {
      try {
        const holidays = await loadHolidayData(countryCode, year, locale);
        const targetHoliday = holidays.find(holiday => {
          const slug = createHolidaySlug(holiday.name);
          return slug === holidaySlug;
        });
        
        console.log(`   ${year}년: ${holidays.length}개 공휴일, ${targetHoliday ? '✅ 타겟 공휴일 있음' : '❌ 타겟 공휴일 없음'}`);
      } catch (error) {
        console.log(`   ${year}년: ❌ 데이터 로드 실패`);
      }
    }

    console.log('\n✅ 진단 완료!');

  } catch (error) {
    console.error('❌ 진단 실패:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  testSpecificHoliday();
}