#!/usr/bin/env npx tsx

/**
 * 안도라 카니발의 언어별 작성 상태를 확인하는 테스트 스크립트
 */

import fs from 'fs';
import path from 'path';

async function testAndorraCarnivalStatus() {
  console.log('🔍 안도라 카니발 언어별 작성 상태 확인...\n');

  // 1. 기존 설명 키 수집
  const existingKeys = new Set<string>();

  // AI 캐시 확인
  try {
    const aiCachePath = path.join(process.cwd(), 'public', 'ai-cache.json');
    if (fs.existsSync(aiCachePath)) {
      const aiCache = JSON.parse(fs.readFileSync(aiCachePath, 'utf-8'));
      Object.entries(aiCache).forEach(([key, value]: [string, any]) => {
        if (value && typeof value === 'object' && value.isManual === true && value.confidence === 1.0) {
          if (value.holidayName && value.countryName && value.locale) {
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

  // 설명 파일들 확인
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
              
              console.log(`📁 파일에서 설명 발견: ${data.holiday_name} (${data.country_name}, ${locale}) - ${file}`);
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

  console.log(`\n📊 총 기존 설명 개수: ${existingKeys.size}\n`);

  // 2. 안도라 카니발 상태 확인
  const holidayName = 'Carnival';
  const countryName = 'Andorra';

  const koKeys = [
    `${holidayName}|${countryName}|ko`,
    `${holidayName}_${countryName}_ko`,
    `${holidayName}-${countryName}-ko`
  ];

  const enKeys = [
    `${holidayName}|${countryName}|en`,
    `${holidayName}_${countryName}_en`,
    `${holidayName}-${countryName}-en`
  ];

  console.log('🔍 안도라 카니발 키 확인:');
  console.log('한국어 키들:');
  koKeys.forEach(key => {
    const exists = existingKeys.has(key);
    console.log(`  ${exists ? '✅' : '❌'} ${key}`);
  });

  console.log('영어 키들:');
  enKeys.forEach(key => {
    const exists = existingKeys.has(key);
    console.log(`  ${exists ? '✅' : '❌'} ${key}`);
  });

  const hasKoreanDescription = koKeys.some(key => existingKeys.has(key));
  const hasEnglishDescription = enKeys.some(key => existingKeys.has(key));
  const hasCompleteDescription = hasKoreanDescription && hasEnglishDescription;

  console.log('\n📊 최종 상태:');
  console.log(`한국어 설명: ${hasKoreanDescription ? '✅ 있음' : '❌ 없음'}`);
  console.log(`영어 설명: ${hasEnglishDescription ? '✅ 있음' : '❌ 없음'}`);
  console.log(`완료 상태: ${hasCompleteDescription ? '✅ 완료' : '❌ 미완료'}`);
  console.log(`목록 표시: ${hasCompleteDescription ? '❌ 표시 안됨' : '✅ 표시됨'}`);

  // 3. 기존 키 샘플 출력
  console.log('\n📝 기존 키 샘플 (처음 10개):');
  Array.from(existingKeys).slice(0, 10).forEach(key => {
    console.log(`  - ${key}`);
  });
}

testAndorraCarnivalStatus().catch(console.error);