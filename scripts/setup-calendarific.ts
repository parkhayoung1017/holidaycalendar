#!/usr/bin/env tsx

/**
 * Calendarific API 설정 및 테스트 스크립트
 * 
 * 사용법:
 * npm run setup-calendarific
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const CALENDARIFIC_API_URL = 'https://calendarific.com/api/v2';

/**
 * 무료 API 키 안내
 */
function showApiKeyInstructions(): void {
  console.log(`
🔑 Calendarific API 키 설정 안내

1. https://calendarific.com/api 방문
2. 무료 계정 생성 (월 1,000회 요청 무료)
3. API 키 복사
4. .env.local 파일에 다음 라인 추가:
   CALENDARIFIC_API_KEY=your_api_key_here
   HOLIDAY_API_PROVIDER=calendarific

5. 이 스크립트를 다시 실행하세요.
`);
}

/**
 * API 키 확인
 */
function checkApiKey(): string | null {
  const apiKey = process.env.CALENDARIFIC_API_KEY;
  if (!apiKey) {
    console.error('❌ CALENDARIFIC_API_KEY가 설정되지 않았습니다.');
    showApiKeyInstructions();
    return null;
  }
  return apiKey;
}

/**
 * API 연결 테스트
 */
async function testApiConnection(apiKey: string): Promise<boolean> {
  try {
    console.log('🔗 Calendarific API 연결 테스트 중...');
    
    const response = await axios.get(`${CALENDARIFIC_API_URL}/holidays`, {
      params: {
        api_key: apiKey,
        country: 'US',
        year: 2024,
        type: 'national'
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data.response) {
      console.log('✅ API 연결 성공!');
      console.log(`📊 테스트 결과: ${response.data.response.holidays.length}개 공휴일 수신`);
      return true;
    } else {
      console.error('❌ API 응답 형식이 올바르지 않습니다.');
      return false;
    }
  } catch (error: any) {
    console.error('❌ API 연결 실패:', error.message);
    if (error.response?.status === 401) {
      console.error('API 키가 유효하지 않습니다. 키를 확인해주세요.');
    } else if (error.response?.status === 429) {
      console.error('API 요청 한도를 초과했습니다.');
    }
    return false;
  }
}

/**
 * 지원 국가 목록 조회
 */
async function getSupportedCountries(apiKey: string): Promise<void> {
  try {
    console.log('🌍 지원 국가 목록 조회 중...');
    
    const response = await axios.get(`${CALENDARIFIC_API_URL}/countries`, {
      params: {
        api_key: apiKey
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data.response) {
      const countries = response.data.response.countries;
      console.log(`📋 총 ${countries.length}개 국가 지원`);
      
      // 아시아 국가들 확인
      const asianCountries = countries.filter((country: any) => 
        ['IN', 'TH', 'MY', 'PH', 'ID', 'VN', 'BD', 'PK', 'LK'].includes(country.iso)
      );
      
      console.log('\n🌏 아시아 주요 국가 지원 현황:');
      asianCountries.forEach((country: any) => {
        console.log(`   ${country.flag || '🏳️'} ${country.iso}: ${country.country_name}`);
      });
      
      // 인도 확인
      const india = countries.find((country: any) => country.iso === 'IN');
      if (india) {
        console.log(`\n🇮🇳 인도 지원: ${india.country_name} (${india.iso})`);
      }
    }
  } catch (error: any) {
    console.error('❌ 국가 목록 조회 실패:', error.message);
  }
}

/**
 * 인도 공휴일 테스트 수집
 */
async function testIndiaHolidays(apiKey: string): Promise<void> {
  try {
    console.log('\n🇮🇳 인도 2024년 공휴일 테스트 수집...');
    
    const response = await axios.get(`${CALENDARIFIC_API_URL}/holidays`, {
      params: {
        api_key: apiKey,
        country: 'IN',
        year: 2024,
        type: 'national'
      },
      timeout: 15000
    });

    if (response.status === 200 && response.data.response) {
      const holidays = response.data.response.holidays;
      console.log(`✅ 인도 공휴일 ${holidays.length}개 수집 성공!`);
      
      // 처음 5개 공휴일 표시
      console.log('\n📅 주요 공휴일 (처음 5개):');
      holidays.slice(0, 5).forEach((holiday: any, index: number) => {
        console.log(`   ${index + 1}. ${holiday.name} (${holiday.date.iso})`);
      });
      
      if (holidays.length > 5) {
        console.log(`   ... 외 ${holidays.length - 5}개 더`);
      }
    } else {
      console.error('❌ 인도 공휴일 데이터를 가져올 수 없습니다.');
    }
  } catch (error: any) {
    console.error('❌ 인도 공휴일 수집 실패:', error.message);
  }
}

/**
 * .env.local 파일 업데이트
 */
function updateEnvFile(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  // 기존 .env.local 파일 읽기
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // HOLIDAY_API_PROVIDER 설정 추가/업데이트
  if (envContent.includes('HOLIDAY_API_PROVIDER=')) {
    envContent = envContent.replace(/HOLIDAY_API_PROVIDER=.*/g, 'HOLIDAY_API_PROVIDER=calendarific');
  } else {
    envContent += '\nHOLIDAY_API_PROVIDER=calendarific';
  }
  
  // 파일 저장
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local 파일이 업데이트되었습니다.');
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  console.log('🚀 Calendarific API 설정 및 테스트 시작\n');

  try {
    // API 키 확인
    const apiKey = checkApiKey();
    if (!apiKey) {
      process.exit(1);
    }

    // API 연결 테스트
    const isConnected = await testApiConnection(apiKey);
    if (!isConnected) {
      process.exit(1);
    }

    // 지원 국가 목록 조회
    await getSupportedCountries(apiKey);

    // 인도 공휴일 테스트
    await testIndiaHolidays(apiKey);

    // 환경 설정 업데이트
    updateEnvFile();

    console.log('\n🎉 Calendarific API 설정 완료!');
    console.log('\n다음 명령어로 인도 데이터를 수집할 수 있습니다:');
    console.log('npm run collect-data -- --country IN --year 2024 --force');

  } catch (error) {
    console.error('\n❌ 설정 중 오류가 발생했습니다:', error);
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