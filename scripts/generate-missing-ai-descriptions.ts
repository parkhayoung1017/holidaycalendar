#!/usr/bin/env tsx

/**
 * 기존에 AI 설명이 생성되지 않은 국가들의 공휴일에 대해 AI 설명을 생성하는 스크립트
 */

import { promises as fs } from 'fs';
import path from 'path';
import { generateAIHolidayDescription } from '../src/lib/ai-content-generator-enhanced';
import { setCachedDescription } from '../src/lib/ai-content-cache';
import { getCachedDescription } from '../src/lib/ai-content-cache';
import { Holiday } from '../src/types';

// 이미 AI 설명이 생성된 국가들 (제외할 국가들)
const EXISTING_COUNTRIES = ['United States', 'South Korea'];

// 국가 코드를 국가 이름으로 매핑
const COUNTRY_NAMES: Record<string, string> = {
  'GB': 'United Kingdom',
  'FR': 'France',
  'DE': 'Germany',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'IE': 'Ireland',
  'PT': 'Portugal',
  'GR': 'Greece',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'HR': 'Croatia',
  'BG': 'Bulgaria',
  'RO': 'Romania',
  'EE': 'Estonia',
  'LV': 'Latvia',
  'LT': 'Lithuania',
  'JP': 'Japan',
  'CN': 'China',
  'IN': 'India',
  'SG': 'Singapore',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'CA': 'Canada',
  'MX': 'Mexico',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'TR': 'Turkey',
  'RU': 'Russia',
  'UA': 'Ukraine',
  'IL': 'Israel',
  'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'ID': 'Indonesia',
  'MY': 'Malaysia',
  'PH': 'Philippines',
  'TW': 'Taiwan'
};

// 우선순위가 높은 국가들 (먼저 처리)
const PRIORITY_COUNTRIES = [
  'MX', 'EG', 'BR', 'AR', 'TR', 'TH', 'VN', 'ID', 'MY', 'PH',
  'SA', 'AE', 'ZA', 'NG', 'KE', 'MA', 'DZ', 'TN', 'LY', 'SD',
  'GB', 'FR', 'DE', 'IT', 'ES', 'JP', 'CN', 'IN', 'AU', 'CA', 'SG'
];

/**
 * 공휴일 데이터 파일을 로드합니다
 */
async function loadHolidayFile(countryCode: string, year: number): Promise<Holiday[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'holidays', `${countryCode.toLowerCase()}-${year}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.holidays || [];
  } catch (error) {
    console.log(`⚠️  ${countryCode}-${year}.json 파일을 찾을 수 없습니다.`);
    return [];
  }
}

/**
 * 특정 국가의 공휴일들에 대해 AI 설명을 생성합니다
 */
async function generateCountryDescriptions(countryCode: string, year: number = 2024): Promise<void> {
  const countryName = COUNTRY_NAMES[countryCode];
  if (!countryName) {
    console.log(`❌ 알 수 없는 국가 코드: ${countryCode}`);
    return;
  }

  // 이미 처리된 국가는 건너뛰기
  if (EXISTING_COUNTRIES.includes(countryName)) {
    console.log(`⏭️  ${countryName}은 이미 처리된 국가입니다.`);
    return;
  }

  console.log(`\n🌍 ${countryName} (${countryCode}) 공휴일 처리 시작...`);

  const holidays = await loadHolidayFile(countryCode, year);
  if (holidays.length === 0) {
    console.log(`📭 ${countryName}의 공휴일 데이터가 없습니다.`);
    return;
  }

  console.log(`📅 총 ${holidays.length}개의 공휴일 발견`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const holiday of holidays) {
    try {
      console.log(`  🔄 ${holiday.name} 처리 중...`);

      // 한국어와 영어 둘 다 생성
      const locales = ['ko', 'en'];
      let holidayProcessed = false;

      for (const locale of locales) {
        // 이미 캐시에 있는지 확인
        const cached = await getCachedDescription(holiday.name, countryName, locale);
        if (cached && cached.description.length > 100) {
          console.log(`    ✅ ${holiday.name} (${locale}) - 이미 캐시됨`);
          continue;
        }

        // Claude API를 사용하여 AI 설명 생성
        const description = await generateAIHolidayDescription(
          holiday.name,
          countryName,
          holiday.date,
          locale
        );

        if (description && description.length > 100) {
          // 캐시에 저장
          await setCachedDescription(
            holiday.id,
            holiday.name,
            countryName,
            locale,
            description,
            0.9
          );

          console.log(`    ✅ ${holiday.name} (${locale}) - 생성 완료 (${description.length}자)`);
          holidayProcessed = true;
        } else {
          console.log(`    ⚠️  ${holiday.name} (${locale}) - 설명이 너무 짧음 (${description?.length || 0}자)`);
        }

        // 로케일 간 처리 지연 (API 제한 고려)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (holidayProcessed) {
        processedCount++;
      } else {
        errorCount++;
      }

      // API 호출 제한을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`  ❌ ${holiday.name} 처리 실패:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 ${countryName} 처리 완료:`);
  console.log(`  ✅ 생성: ${processedCount}개`);
  console.log(`  ⏭️  건너뜀: ${skippedCount}개`);
  console.log(`  ❌ 실패: ${errorCount}개`);
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 누락된 AI 공휴일 설명 생성 시작\n');

  const args = process.argv.slice(2);

  if (args.length > 0) {
    // 특정 국가만 처리
    const countryCode = args[0].toUpperCase();
    const year = args[1] ? parseInt(args[1]) : 2024;

    await generateCountryDescriptions(countryCode, year);
  } else {
    // 우선순위 국가들 처리
    console.log('🎯 우선순위 국가들 처리 시작...\n');

    for (const countryCode of PRIORITY_COUNTRIES) {
      try {
        await generateCountryDescriptions(countryCode, 2024);

        // 국가 간 처리 지연 (API 제한 고려)
        console.log('⏳ 다음 국가 처리를 위해 3초 대기...');
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`❌ ${countryCode} 처리 중 오류:`, error);
      }
    }
  }

  console.log('\n🎉 모든 처리가 완료되었습니다!');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}