#!/usr/bin/env tsx

import { HolidayApiClient } from '../src/lib/holiday-api';
import { HolidayDataCollector } from '../src/lib/holiday-data-collector';

/**
 * 데이터 수집 통계를 확인하는 스크립트
 */

async function main() {
  console.log('📊 공휴일 데이터 수집 통계');
  console.log('=========================');
  
  try {
    const apiClient = new HolidayApiClient(undefined, 'nager');
    const collector = new HolidayDataCollector(apiClient);
    
    const stats = await collector.getDataStatistics();
    
    console.log(`\n📁 총 데이터 파일: ${stats.totalFiles}개`);
    console.log(`🎉 총 공휴일 수: ${stats.totalHolidays.toLocaleString()}개`);
    console.log(`🌍 수집된 국가: ${stats.countries.length}개`);
    console.log(`📅 수집된 연도: ${stats.years.length}개 (${Math.min(...stats.years)} - ${Math.max(...stats.years)})`);
    console.log(`🕐 마지막 업데이트: ${new Date(stats.lastUpdated).toLocaleString('ko-KR')}`);
    
    console.log(`\n🌍 수집된 국가 목록:`);
    const sortedCountries = stats.countries.sort();
    for (let i = 0; i < sortedCountries.length; i += 10) {
      const chunk = sortedCountries.slice(i, i + 10);
      console.log(`   ${chunk.join(', ')}`);
    }
    
    console.log(`\n📅 수집된 연도별 통계:`);
    for (const year of stats.years.sort()) {
      const yearFiles = stats.countries.filter(country => {
        // 해당 연도의 파일이 있는지 확인하는 로직이 필요하지만, 
        // 간단히 전체 통계만 표시
        return true;
      });
      console.log(`   ${year}년: 데이터 보유`);
    }
    
  } catch (error) {
    console.error('❌ 통계 확인 중 오류 발생:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}