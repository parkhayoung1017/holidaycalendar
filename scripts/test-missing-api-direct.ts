#!/usr/bin/env tsx

/**
 * Missing Descriptions API 직접 테스트
 */

import fs from 'fs';
import path from 'path';

// missing descriptions API의 핵심 로직을 직접 실행
async function testMissingDescriptionsLogic() {
  console.log('🔍 Missing Descriptions API 로직 테스트 시작...\n');

  const existingKeys = new Set<string>();

  // 1. data/descriptions 폴더에서 설명 파일들 확인
  try {
    const descriptionsDir = path.join(process.cwd(), 'data', 'descriptions');
    if (fs.existsSync(descriptionsDir)) {
      const files = fs.readdirSync(descriptionsDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(descriptionsDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (data.holiday_name && data.country_name && data.locale) {
              const locale = data.locale;
              existingKeys.add(`${data.holiday_name}|${data.country_name}|${locale}`);
              existingKeys.add(`${data.holiday_name}_${data.country_name}_${locale}`);
              existingKeys.add(`${data.holiday_name}-${data.country_name}-${locale}`);
              
              // 국가 코드 변형도 추가
              const countryCode = getCountryCodeFromName(data.country_name);
              if (countryCode) {
                existingKeys.add(`${data.holiday_name}|${countryCode}|${locale}`);
                existingKeys.add(`${data.holiday_name}_${countryCode}_${locale}`);
                existingKeys.add(`${data.holiday_name}-${countryCode}-${locale}`);
              }
            }
          } catch (error) {
            console.warn(`설명 파일 읽기 실패: ${file}`, error);
          }
        }
      });
    }
  } catch (error) {
    console.warn('설명 디렉토리 읽기 실패:', error);
  }

  // 2. AI 캐시 파일에서 수동 작성된 설명만 확인
  try {
    const aiCachePath = path.join(process.cwd(), 'public', 'ai-cache.json');
    if (fs.existsSync(aiCachePath)) {
      const aiCache = JSON.parse(fs.readFileSync(aiCachePath, 'utf-8'));
      Object.entries(aiCache).forEach(([key, value]: [string, any]) => {
        if (value && typeof value === 'object') {
          // 수동 작성된 설명만 확인 (confidence가 1.0이거나 isManual이 true인 경우)
          const isManual = value.isManual === true || value.confidence === 1.0;
          
          if (isManual && value.holidayName && value.countryName && value.locale) {
            // 다양한 키 형식으로 저장하여 매칭률 향상
            existingKeys.add(`${value.holidayName}|${value.countryName}|${value.locale}`);
            existingKeys.add(`${value.holidayName}_${value.countryName}_${value.locale}`);
            existingKeys.add(`${value.holidayName}-${value.countryName}-${value.locale}`);
          }
        }
      });
    }
  } catch (error) {
    console.warn('AI 캐시 파일 읽기 실패:', error);
  }

  console.log(`📊 총 기존 설명 키 개수: ${existingKeys.size}\n`);

  // 3. Andorra 2024 공휴일 데이터 처리
  const dataDir = path.join(process.cwd(), 'data', 'holidays');
  const file = 'ad-2024.json';
  const allMissingHolidays: any[] = [];

  if (fs.existsSync(path.join(dataDir, file))) {
    const filePath = path.join(dataDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const holidayData = JSON.parse(fileContent);

    if (holidayData.holidays && Array.isArray(holidayData.holidays)) {
      for (const holiday of holidayData.holidays) {
        const countryName = 'Andorra';
        const countryCode = 'ad';
        
        // 다양한 국가명 형식과 로케일 조합으로 확인
        const countryVariations = [
          countryName,
          countryCode.toUpperCase(),
          countryCode.toLowerCase(),
          getCountryName(countryCode)
        ].filter((v, i, arr) => arr.indexOf(v) === i);
        
        // 모든 지원 언어에 설명이 있는지 확인 (한국어와 영어 모두)
        const hasKoreanDescription = countryVariations.some(country => 
          existingKeys.has(`${holiday.name}|${country}|ko`) ||
          existingKeys.has(`${holiday.name}_${country}_ko`) ||
          existingKeys.has(`${holiday.name}-${country}-ko`)
        );
        
        const hasEnglishDescription = countryVariations.some(country => 
          existingKeys.has(`${holiday.name}|${country}|en`) ||
          existingKeys.has(`${holiday.name}_${country}_en`) ||
          existingKeys.has(`${holiday.name}-${country}-en`)
        );
        
        // 두 언어 모두 설명이 있어야만 완료된 것으로 간주
        const hasCompleteDescription = hasKoreanDescription && hasEnglishDescription;
        
        // Carnival 특별 로깅
        if (holiday.name === 'Carnival') {
          console.log(`🎭 Carnival 처리 결과:`);
          console.log(`   - 한국어 설명: ${hasKoreanDescription}`);
          console.log(`   - 영어 설명: ${hasEnglishDescription}`);
          console.log(`   - 완전한 설명: ${hasCompleteDescription}`);
          console.log(`   - 목록에 포함될 것: ${!hasCompleteDescription}\n`);
        }
        
        // 두 언어 모두 설명이 있는 경우에만 "설명 없는 공휴일" 목록에서 제외
        if (!hasCompleteDescription) {
          allMissingHolidays.push({
            holiday_id: `${countryCode}_2024_${holiday.date}_${holiday.name.replace(/\s+/g, '_')}`,
            holiday_name: holiday.name,
            country_name: countryName,
            country_code: countryCode.toUpperCase(),
            date: holiday.date,
            year: 2024,
            language_status: {
              ko: hasKoreanDescription,
              en: hasEnglishDescription
            }
          });
        }
      }
    }
  }

  console.log(`📋 총 "설명 없는 공휴일" 개수: ${allMissingHolidays.length}`);
  
  // Carnival이 목록에 있는지 확인
  const carnivalInList = allMissingHolidays.find(h => h.holiday_name === 'Carnival');
  if (carnivalInList) {
    console.log(`✅ Carnival이 "설명 없는 공휴일" 목록에 포함됨:`);
    console.log(carnivalInList);
  } else {
    console.log(`❌ Carnival이 "설명 없는 공휴일" 목록에 없음`);
  }
}

function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'ad': 'Andorra',
    'us': 'United States',
    'kr': 'South Korea'
  };
  
  return countryNames[countryCode.toLowerCase()] || countryCode.toUpperCase();
}

function getCountryCodeFromName(countryName: string): string | null {
  const countryCodeMap: Record<string, string> = {
    'Andorra': 'AD',
    'United States': 'US',
    'South Korea': 'KR'
  };
  
  return countryCodeMap[countryName] || null;
}

// 스크립트 실행
testMissingDescriptionsLogic().catch(console.error);