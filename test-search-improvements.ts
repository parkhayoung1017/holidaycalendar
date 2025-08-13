#!/usr/bin/env tsx

/**
 * 개선된 검색 기능 테스트 스크립트
 */

import { generateSearchResults, parseSearchQuery, getPopularSearches } from './src/lib/search-utils';
import { getClientAvailableYears } from './src/lib/data-availability';

async function testSearchImprovements() {
  console.log('🔍 개선된 검색 기능 테스트 시작\n');

  // 1. 사용 가능한 연도 확인
  console.log('📅 사용 가능한 연도:');
  const availableYears = getClientAvailableYears();
  console.log(availableYears);
  console.log('');

  // 2. 연도 파싱 테스트
  console.log('🔢 연도 파싱 테스트:');
  const testQueries = ['미국 2024', '일본 2026', '한국 2022', '독일 2030', '프랑스 2031'];
  
  testQueries.forEach(query => {
    const parsed = parseSearchQuery(query);
    console.log(`"${query}" -> 국가: "${parsed.countryQuery}", 연도: ${parsed.year}, 유효: ${parsed.isValidYear}`);
  });
  console.log('');

  // 3. 검색 결과 테스트 (국가만)
  console.log('🌍 국가만 검색 테스트 ("미국"):');
  try {
    const usResults = await generateSearchResults('미국', 'ko');
    usResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title} - ${result.description}`);
      console.log(`   URL: ${result.url}`);
    });
  } catch (error) {
    console.error('검색 중 오류:', error);
  }
  console.log('');

  // 4. 검색 결과 테스트 (국가 + 연도)
  console.log('🎯 국가 + 연도 검색 테스트 ("일본 2026"):');
  try {
    const jpResults = await generateSearchResults('일본 2026', 'ko');
    jpResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title} - ${result.description}`);
      console.log(`   URL: ${result.url}`);
    });
  } catch (error) {
    console.error('검색 중 오류:', error);
  }
  console.log('');

  // 5. 인기 검색어 테스트
  console.log('⭐ 인기 검색어 테스트:');
  try {
    const popularSearches = await getPopularSearches('ko');
    popularSearches.forEach((search, index) => {
      console.log(`${index + 1}. ${search}`);
    });
  } catch (error) {
    console.error('인기 검색어 로드 중 오류:', error);
  }
  console.log('');

  // 6. 다양한 국가 검색 테스트
  console.log('🌏 다양한 국가 검색 테스트:');
  const countries = ['한국', '중국', '영국', '독일'];
  
  for (const country of countries) {
    try {
      console.log(`\n"${country}" 검색 결과:`);
      const results = await generateSearchResults(country, 'ko');
      results.slice(0, 5).forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.title}`);
      });
    } catch (error) {
      console.error(`${country} 검색 중 오류:`, error);
    }
  }

  console.log('\n✅ 검색 기능 테스트 완료!');
  console.log('\n주요 개선사항:');
  console.log('- 2022년부터 2030년까지 다양한 연도 지원');
  console.log('- 국가만 검색시 여러 연도 결과 제공');
  console.log('- 인기 검색어에 다양한 연도 포함');
  console.log('- 검색 결과 최대 12개로 확장');
}

// 스크립트 실행
if (require.main === module) {
  testSearchImprovements().catch(console.error);
}