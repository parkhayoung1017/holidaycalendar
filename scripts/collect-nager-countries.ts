#!/usr/bin/env tsx

import { HolidayApiClient } from '../src/lib/holiday-api';
import { HolidayDataCollector } from '../src/lib/holiday-data-collector';
import fs from 'fs';
import path from 'path';

/**
 * Nager.Date API를 사용하여 누락된 국가들의 공휴일 데이터를 수집합니다.
 */

// Nager.Date API에서 지원하는 모든 국가 코드
const NAGER_SUPPORTED_COUNTRIES = [
  'AD', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ',
  'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GQ', 'GR', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IQ', 'IR', 'IS', 'IT',
  'JE', 'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
  'OM',
  'PA', 'PE', 'PG', 'PH', 'PK', 'PL', 'PR', 'PS', 'PT', 'PW', 'PY',
  'QA',
  'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ',
  'TC', 'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU',
  'WF', 'WS',
  'XK',
  'YE',
  'ZA', 'ZM', 'ZW'
];

async function getExistingCountries(): Promise<Set<string>> {
  const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
  const existingCountries = new Set<string>();
  
  try {
    const files = await fs.promises.readdir(holidaysDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        // 파일명에서 국가 코드 추출 (예: kr-2024.json -> kr)
        const countryCode = file.split('-')[0].toUpperCase();
        existingCountries.add(countryCode);
      }
    }
  } catch (error) {
    console.error('기존 데이터 파일 읽기 실패:', error);
  }
  
  return existingCountries;
}

async function getMissingCountries(): Promise<string[]> {
  const existingCountries = await getExistingCountries();
  const missingCountries = NAGER_SUPPORTED_COUNTRIES.filter(
    country => !existingCountries.has(country)
  );
  
  console.log(`\n=== 데이터 수집 현황 ===`);
  console.log(`Nager.Date 지원 국가: ${NAGER_SUPPORTED_COUNTRIES.length}개`);
  console.log(`기존 수집된 국가: ${existingCountries.size}개`);
  console.log(`누락된 국가: ${missingCountries.length}개`);
  
  if (missingCountries.length > 0) {
    console.log(`\n누락된 국가 목록:`);
    console.log(missingCountries.join(', '));
  }
  
  return missingCountries;
}

async function collectMissingCountriesData(
  missingCountries: string[], 
  years: number[] = [2024, 2025]
): Promise<void> {
  // Nager.Date API 클라이언트 생성 (API 키 불필요)
  const apiClient = new HolidayApiClient(undefined, 'nager');
  const collector = new HolidayDataCollector(apiClient);
  
  console.log(`\n=== 누락된 국가 데이터 수집 시작 ===`);
  console.log(`대상 국가: ${missingCountries.length}개`);
  console.log(`대상 연도: ${years.join(', ')}`);
  
  let totalCollected = 0;
  let totalErrors = 0;
  
  for (const year of years) {
    console.log(`\n--- ${year}년 데이터 수집 ---`);
    
    for (let i = 0; i < missingCountries.length; i++) {
      const countryCode = missingCountries[i];
      
      try {
        console.log(`[${i + 1}/${missingCountries.length}] ${countryCode} ${year} 수집 중...`);
        
        const holidays = await collector.collectHolidayData(countryCode, year, false);
        totalCollected += holidays.length;
        
        console.log(`✅ ${countryCode} ${year}: ${holidays.length}개 공휴일 수집 완료`);
        
        // API 레이트 리밋 방지를 위한 지연
        if (i < missingCountries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        totalErrors++;
        console.error(`❌ ${countryCode} ${year} 수집 실패:`, error);
        
        // 에러 발생 시에도 계속 진행
        continue;
      }
    }
  }
  
  console.log(`\n=== 수집 완료 ===`);
  console.log(`총 수집된 공휴일: ${totalCollected}개`);
  console.log(`에러 발생: ${totalErrors}건`);
}

async function testNagerApiConnection(): Promise<boolean> {
  console.log('Nager.Date API 연결 테스트 중...');
  
  try {
    const apiClient = new HolidayApiClient(undefined, 'nager');
    const testResult = await apiClient.testConnection();
    
    if (testResult) {
      console.log('✅ Nager.Date API 연결 성공');
      return true;
    } else {
      console.log('❌ Nager.Date API 연결 실패');
      return false;
    }
  } catch (error) {
    console.error('❌ API 연결 테스트 중 오류:', error);
    return false;
  }
}

async function main() {
  console.log('🌍 Nager.Date API를 사용한 누락 국가 데이터 수집기');
  console.log('================================================');
  
  try {
    // API 연결 테스트
    const isConnected = await testNagerApiConnection();
    if (!isConnected) {
      console.error('API 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
      process.exit(1);
    }
    
    // 누락된 국가 확인
    const missingCountries = await getMissingCountries();
    
    if (missingCountries.length === 0) {
      console.log('\n🎉 모든 지원 국가의 데이터가 이미 수집되었습니다!');
      return;
    }
    
    // 사용자 확인
    console.log(`\n${missingCountries.length}개 국가의 데이터를 수집하시겠습니까?`);
    console.log('계속하려면 Enter를 누르세요...');
    
    // 실제 환경에서는 readline을 사용하지만, 스크립트 실행을 위해 자동 진행
    console.log('자동으로 수집을 시작합니다...');
    
    // 데이터 수집 실행
    await collectMissingCountriesData(missingCountries);
    
    console.log('\n🎉 데이터 수집이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main().catch(console.error);
}

export { getMissingCountries, collectMissingCountriesData, NAGER_SUPPORTED_COUNTRIES };