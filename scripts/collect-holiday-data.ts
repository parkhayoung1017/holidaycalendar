#!/usr/bin/env tsx

/**
 * 공휴일 데이터 수집 스크립트
 * 
 * 사용법:
 * npm run collect-data -- --country US --year 2024
 * npm run collect-data -- --all --year 2024
 * npm run collect-data -- --country US,CA,GB --year 2024
 */

import { createHolidayApiClient } from '../src/lib/holiday-api';
import { createHolidayDataCollector } from '../src/lib/holiday-data-collector';
import { SUPPORTED_COUNTRIES } from '../src/lib/constants';

interface ScriptOptions {
  country?: string;
  year: number;
  all?: boolean;
  force?: boolean;
  verbose?: boolean;
}

/**
 * 명령행 인수를 파싱합니다.
 */
function parseArguments(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    year: new Date().getFullYear()
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--country':
        if (nextArg && !nextArg.startsWith('--')) {
          options.country = nextArg;
          i++;
        }
        break;
      case '--year':
        if (nextArg && !nextArg.startsWith('--')) {
          options.year = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--all':
        options.all = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * 도움말을 출력합니다.
 */
function printHelp(): void {
  console.log(`
공휴일 데이터 수집 스크립트

사용법:
  npm run collect-data -- [옵션]

옵션:
  --country <code>    특정 국가의 데이터 수집 (예: US, CA, GB)
                      여러 국가는 쉼표로 구분 (예: US,CA,GB)
  --year <year>       수집할 연도 (기본값: 현재 연도)
  --all               지원하는 모든 국가의 데이터 수집
  --force             기존 데이터가 있어도 강제로 다시 수집
  --verbose           상세한 로그 출력
  --help, -h          이 도움말 출력

예시:
  npm run collect-data -- --country US --year 2024
  npm run collect-data -- --country US,CA,GB --year 2024
  npm run collect-data -- --all --year 2024
  npm run collect-data -- --all --year 2025 --force
`);
}

/**
 * 환경변수를 확인합니다.
 */
function checkEnvironment(): void {
  const provider = process.env.HOLIDAY_API_PROVIDER || 'nager';
  
  if (provider === 'calendarific' && !process.env.CALENDARIFIC_API_KEY) {
    console.error('❌ Calendarific API를 사용하려면 CALENDARIFIC_API_KEY가 필요합니다.');
    console.error('Nager.Date API를 사용하려면 HOLIDAY_API_PROVIDER=nager로 설정하세요.');
    process.exit(1);
  }
  
  console.log(`🔧 API 제공자: ${provider}`);
}

/**
 * 수집할 국가 목록을 결정합니다.
 */
function getCountriesToCollect(options: ScriptOptions): string[] {
  if (options.all) {
    return SUPPORTED_COUNTRIES.map(country => country.code);
  }

  if (options.country) {
    const countries = options.country.split(',').map(c => c.trim().toUpperCase());
    
    // 지원하는 국가인지 확인
    const supportedCodes = SUPPORTED_COUNTRIES.map(c => c.code);
    const unsupportedCountries = countries.filter(code => !supportedCodes.includes(code));
    
    if (unsupportedCountries.length > 0) {
      console.error('❌ 지원하지 않는 국가 코드:', unsupportedCountries.join(', '));
      console.error('지원하는 국가:', supportedCodes.join(', '));
      process.exit(1);
    }
    
    return countries;
  }

  console.error('❌ --country 또는 --all 옵션을 지정해주세요.');
  printHelp();
  process.exit(1);
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  console.log('🎉 공휴일 데이터 수집 스크립트 시작\n');

  try {
    // 명령행 인수 파싱
    const options = parseArguments();
    
    if (options.verbose) {
      console.log('📋 실행 옵션:', options);
    }

    // 환경변수 확인
    checkEnvironment();

    // 수집할 국가 목록 결정
    const countries = getCountriesToCollect(options);
    
    console.log(`📅 수집 대상: ${countries.length}개 국가, ${options.year}년`);
    console.log(`🌍 국가 목록: ${countries.join(', ')}\n`);

    // API 클라이언트 및 데이터 수집기 초기화
    const apiClient = createHolidayApiClient();
    const collector = createHolidayDataCollector(apiClient);

    // API 연결 테스트
    console.log('🔗 API 연결 테스트 중...');
    const isConnected = await apiClient.testConnection();
    
    if (!isConnected) {
      console.error('❌ API 연결에 실패했습니다. API 키와 네트워크 연결을 확인해주세요.');
      process.exit(1);
    }
    console.log('✅ API 연결 성공\n');

    // 기존 데이터 확인 (force 옵션이 없는 경우)
    if (!options.force) {
      console.log('📂 기존 데이터 확인 중...');
      const existingData: string[] = [];
      
      for (const countryCode of countries) {
        const hasData = await collector.hasData(countryCode, options.year);
        if (hasData) {
          existingData.push(countryCode);
        }
      }

      if (existingData.length > 0) {
        console.log(`⚠️  기존 데이터가 있는 국가: ${existingData.join(', ')}`);
        console.log('기존 데이터를 덮어쓰려면 --force 옵션을 사용하세요.\n');
        
        // 기존 데이터가 없는 국가만 수집
        const newCountries = countries.filter(code => !existingData.includes(code));
        if (newCountries.length === 0) {
          console.log('✅ 모든 국가의 데이터가 이미 존재합니다.');
          return;
        }
        
        console.log(`📝 새로 수집할 국가: ${newCountries.join(', ')}\n`);
        countries.splice(0, countries.length, ...newCountries);
      }
    }

    // 데이터 수집 실행
    console.log('🚀 데이터 수집 시작...\n');
    const startTime = Date.now();
    
    const result = await collector.collectMultipleCountries(countries, options.year);
    
    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(1);

    // 결과 출력
    console.log('\n📊 수집 결과:');
    console.log(`   ✅ 성공: ${result.success ? 'YES' : 'NO'}`);
    console.log(`   📈 수집된 공휴일: ${result.holidaysCollected}개`);
    console.log(`   ⏱️  소요 시간: ${durationSeconds}초`);
    
    if (result.errors.length > 0) {
      console.log(`   ❌ 에러: ${result.errors.length}개`);
      result.errors.forEach(error => {
        console.log(`      - ${error}`);
      });
    }

    // 통계 정보 출력
    if (options.verbose) {
      console.log('\n📈 전체 데이터 통계:');
      const stats = await collector.getDataStatistics();
      console.log(`   📁 총 파일 수: ${stats.totalFiles}개`);
      console.log(`   🎉 총 공휴일 수: ${stats.totalHolidays}개`);
      console.log(`   🌍 국가 수: ${stats.countries.length}개`);
      console.log(`   📅 연도 범위: ${stats.years.join(', ')}`);
      console.log(`   🕐 마지막 업데이트: ${stats.lastUpdated}`);
    }

    console.log('\n🎉 데이터 수집 완료!');

  } catch (error) {
    console.error('\n❌ 스크립트 실행 중 오류가 발생했습니다:');
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

export { main, parseArguments, getCountriesToCollect };