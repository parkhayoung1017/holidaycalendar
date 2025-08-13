#!/usr/bin/env tsx

/**
 * 2026-2030년 전세계 공휴일 데이터 수집 스크립트
 * 
 * 이 스크립트는 모든 지원 국가의 2026년부터 2030년까지의 공휴일 데이터를 수집합니다.
 * 
 * 사용법:
 * npx tsx collect-future-data-2026-2030.ts
 */

import { createHolidayApiClient } from './src/lib/holiday-api';
import { createHolidayDataCollector } from './src/lib/holiday-data-collector';
import { SUPPORTED_COUNTRIES } from './src/lib/constants';

interface CollectionStats {
  totalCountries: number;
  totalYears: number;
  successfulCollections: number;
  failedCollections: number;
  totalHolidays: number;
  errors: string[];
  startTime: number;
  endTime?: number;
}

/**
 * 수집 진행 상황을 표시합니다.
 */
function displayProgress(current: number, total: number, country: string, year: number): void {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
  
  process.stdout.write(`\r[${progressBar}] ${percentage}% - ${country} ${year} (${current}/${total})`);
}

/**
 * 수집 통계를 출력합니다.
 */
function displayStats(stats: CollectionStats): void {
  const duration = ((stats.endTime || Date.now()) - stats.startTime) / 1000;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  
  console.log('\n\n📊 수집 완료 통계:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌍 총 국가 수: ${stats.totalCountries}개`);
  console.log(`📅 총 연도 수: ${stats.totalYears}개`);
  console.log(`✅ 성공한 수집: ${stats.successfulCollections}개`);
  console.log(`❌ 실패한 수집: ${stats.failedCollections}개`);
  console.log(`🎉 총 수집된 공휴일: ${stats.totalHolidays}개`);
  console.log(`⏱️  총 소요 시간: ${minutes}분 ${seconds}초`);
  console.log(`📈 성공률: ${Math.round((stats.successfulCollections / (stats.successfulCollections + stats.failedCollections)) * 100)}%`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ 발생한 오류들:');
    stats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
}

/**
 * 환경 설정을 확인합니다.
 */
function checkEnvironment(): void {
  const provider = process.env.HOLIDAY_API_PROVIDER || 'nager';
  
  console.log('🔧 환경 설정 확인:');
  console.log(`   API 제공자: ${provider}`);
  
  if (provider === 'calendarific') {
    if (!process.env.CALENDARIFIC_API_KEY) {
      console.error('❌ Calendarific API를 사용하려면 CALENDARIFIC_API_KEY가 필요합니다.');
      console.error('   .env.local 파일에 CALENDARIFIC_API_KEY를 설정하거나');
      console.error('   HOLIDAY_API_PROVIDER=nager로 변경하세요.');
      process.exit(1);
    }
    console.log('   ✅ Calendarific API 키 확인됨');
  } else {
    console.log('   ✅ Nager.Date API 사용 (API 키 불필요)');
  }
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  console.log('🚀 2026-2030년 전세계 공휴일 데이터 수집 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 환경 설정 확인
  checkEnvironment();

  // 수집 대상 정의
  const targetYears = [2026, 2027, 2028, 2029, 2030];
  const countries = SUPPORTED_COUNTRIES.map(country => country.code);
  
  const stats: CollectionStats = {
    totalCountries: countries.length,
    totalYears: targetYears.length,
    successfulCollections: 0,
    failedCollections: 0,
    totalHolidays: 0,
    errors: [],
    startTime: Date.now()
  };

  console.log(`\n📋 수집 계획:`);
  console.log(`   🌍 대상 국가: ${countries.length}개`);
  console.log(`   📅 대상 연도: ${targetYears.join(', ')}`);
  console.log(`   📊 총 작업 수: ${countries.length * targetYears.length}개\n`);

  try {
    // API 클라이언트 및 데이터 수집기 초기화
    const apiClient = createHolidayApiClient();
    const collector = createHolidayDataCollector(apiClient);

    // API 연결 테스트
    console.log('🔗 API 연결 테스트 중...');
    const isConnected = await apiClient.testConnection();
    
    if (!isConnected) {
      console.error('❌ API 연결에 실패했습니다.');
      console.error('   네트워크 연결과 API 설정을 확인해주세요.');
      process.exit(1);
    }
    console.log('✅ API 연결 성공\n');

    // 데이터 수집 시작
    console.log('📥 데이터 수집 시작...\n');
    
    let currentTask = 0;
    const totalTasks = countries.length * targetYears.length;

    // 연도별로 수집 (API 레이트 리밋 고려)
    for (const year of targetYears) {
      console.log(`\n📅 ${year}년 데이터 수집 시작...`);
      
      // 국가별 수집
      for (const countryCode of countries) {
        currentTask++;
        
        try {
          displayProgress(currentTask, totalTasks, countryCode, year);
          
          // 기존 데이터 확인
          const hasExistingData = await collector.hasData(countryCode, year);
          if (hasExistingData) {
            // 기존 데이터가 있으면 스킵
            stats.successfulCollections++;
            continue;
          }

          // 데이터 수집
          const holidays = await collector.collectHolidayData(countryCode, year, false);
          
          stats.successfulCollections++;
          stats.totalHolidays += holidays.length;
          
          // API 레이트 리밋 방지를 위한 지연
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          stats.failedCollections++;
          const errorMsg = `${countryCode} ${year}: ${error instanceof Error ? error.message : String(error)}`;
          stats.errors.push(errorMsg);
          
          // 에러 발생 시 더 긴 지연
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`\n✅ ${year}년 수집 완료`);
      
      // 연도 간 지연 (API 안정성을 위해)
      if (year !== targetYears[targetYears.length - 1]) {
        console.log('⏳ 다음 연도 수집을 위해 잠시 대기 중...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    stats.endTime = Date.now();
    
    // 최종 통계 출력
    displayStats(stats);
    
    // 데이터 검증
    console.log('\n🔍 수집된 데이터 검증 중...');
    const dataStats = await collector.getDataStatistics();
    
    console.log('\n📈 전체 데이터베이스 현황:');
    console.log(`   📁 총 파일 수: ${dataStats.totalFiles}개`);
    console.log(`   🎉 총 공휴일 수: ${dataStats.totalHolidays}개`);
    console.log(`   🌍 지원 국가 수: ${dataStats.countries.length}개`);
    console.log(`   📅 지원 연도: ${dataStats.years.join(', ')}`);
    console.log(`   🕐 마지막 업데이트: ${dataStats.lastUpdated}`);

    if (stats.failedCollections === 0) {
      console.log('\n🎉 모든 데이터 수집이 성공적으로 완료되었습니다!');
    } else {
      console.log(`\n⚠️  ${stats.failedCollections}개의 수집 작업이 실패했습니다.`);
      console.log('   실패한 작업들은 나중에 다시 시도할 수 있습니다.');
    }

  } catch (error) {
    console.error('\n❌ 스크립트 실행 중 치명적인 오류가 발생했습니다:');
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 예상치 못한 오류:', error);
    process.exit(1);
  });
}

export { main };