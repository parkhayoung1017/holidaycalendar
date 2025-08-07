#!/usr/bin/env tsx

/**
 * Andorra Carnival 디버깅 스크립트
 * missing descriptions API 로직을 테스트합니다.
 */

import fs from 'fs';
import path from 'path';

// 국가 코드에서 국가명을 가져오는 함수
function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'ad': 'Andorra',
    'us': 'United States',
    'kr': 'South Korea',
    // ... 기타 국가들
  };
  
  return countryNames[countryCode.toLowerCase()] || countryCode.toUpperCase();
}

// 국가명에서 국가 코드를 가져오는 함수
function getCountryCodeFromName(countryName: string): string | null {
  const countryCodeMap: Record<string, string> = {
    'Andorra': 'AD',
    'United States': 'US',
    'South Korea': 'KR',
    // ... 기타 국가들
  };
  
  return countryCodeMap[countryName] || null;
}

async function testAndorraCarnival() {
  console.log('🔍 Andorra Carnival 디버깅 시작...\n');

  // 1. 기존 설명 키 수집
  const existingKeys = new Set<string>();

  // data/descriptions 폴더에서 설명 파일들 확인
  try {
    const descriptionsDir = path.join(process.cwd(), 'data', 'descriptions');
    if (fs.existsSync(descriptionsDir)) {
      const files = fs.readdirSync(descriptionsDir);
      console.log(`📁 설명 파일 개수: ${files.length}`);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(descriptionsDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (data.holiday_name && data.country_name && data.locale) {
              const locale = data.locale;
              const keys = [
                `${data.holiday_name}|${data.country_name}|${locale}`,
                `${data.holiday_name}_${data.country_name}_${locale}`,
                `${data.holiday_name}-${data.country_name}-${locale}`
              ];
              
              keys.forEach(key => existingKeys.add(key));
              
              // 국가 코드 변형도 추가
              const countryCode = getCountryCodeFromName(data.country_name);
              if (countryCode) {
                const codeKeys = [
                  `${data.holiday_name}|${countryCode}|${locale}`,
                  `${data.holiday_name}_${countryCode}_${locale}`,
                  `${data.holiday_name}-${countryCode}-${locale}`
                ];
                codeKeys.forEach(key => existingKeys.add(key));
              }
              
              if (data.holiday_name === 'Carnival' && data.country_name === 'Andorra') {
                console.log(`✅ Andorra Carnival 설명 파일 발견: ${file}`);
                console.log(`   - 언어: ${locale}`);
                console.log(`   - 생성된 키들:`, keys);
                if (countryCode) {
                  console.log(`   - 국가코드 키들:`, [
                    `${data.holiday_name}|${countryCode}|${locale}`,
                    `${data.holiday_name}_${countryCode}_${locale}`,
                    `${data.holiday_name}-${countryCode}-${locale}`
                  ]);
                }
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

  console.log(`\n📊 총 기존 설명 키 개수: ${existingKeys.size}`);

  // 2. Andorra 2024 공휴일 데이터 확인
  const dataDir = path.join(process.cwd(), 'data', 'holidays');
  const file = 'ad-2024.json';
  
  if (fs.existsSync(path.join(dataDir, file))) {
    console.log(`\n📅 ${file} 파일 확인 중...`);
    
    const filePath = path.join(dataDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const holidayData = JSON.parse(fileContent);
    
    if (holidayData.holidays && Array.isArray(holidayData.holidays)) {
      const carnival = holidayData.holidays.find((h: any) => h.name === 'Carnival');
      
      if (carnival) {
        console.log(`🎭 Carnival 공휴일 발견:`, {
          name: carnival.name,
          date: carnival.date,
          countryCode: 'AD'
        });
        
        const countryName = 'Andorra';
        const countryVariations = [
          countryName,
          'AD',
          'ad',
          getCountryName('ad')
        ].filter((v, i, arr) => arr.indexOf(v) === i);
        
        console.log(`🌍 국가명 변형들:`, countryVariations);
        
        // 가능한 키들 생성
        const locales = ['ko', 'en'];
        const possibleKeys: string[] = [];
        
        for (const country of countryVariations) {
          for (const locale of locales) {
            possibleKeys.push(`${carnival.name}|${country}|${locale}`);
            possibleKeys.push(`${carnival.name}_${country}_${locale}`);
            possibleKeys.push(`${carnival.name}-${country}-${locale}`);
          }
        }
        
        console.log(`🔑 생성된 가능한 키들 (${possibleKeys.length}개):`);
        possibleKeys.forEach(key => console.log(`   - ${key}`));
        
        // 매칭 확인
        const hasKoreanDescription = countryVariations.some(country => 
          existingKeys.has(`${carnival.name}|${country}|ko`) ||
          existingKeys.has(`${carnival.name}_${country}_ko`) ||
          existingKeys.has(`${carnival.name}-${country}-ko`)
        );
        
        const hasEnglishDescription = countryVariations.some(country => 
          existingKeys.has(`${carnival.name}|${country}|en`) ||
          existingKeys.has(`${carnival.name}_${country}_en`) ||
          existingKeys.has(`${carnival.name}-${country}-en`)
        );
        
        console.log(`\n🔍 매칭 결과:`);
        console.log(`   - 한국어 설명 있음: ${hasKoreanDescription}`);
        console.log(`   - 영어 설명 있음: ${hasEnglishDescription}`);
        console.log(`   - 완전한 설명: ${hasKoreanDescription && hasEnglishDescription}`);
        
        // 실제로 매칭된 키들 찾기
        console.log(`\n✅ 실제 매칭된 키들:`);
        possibleKeys.forEach(key => {
          if (existingKeys.has(key)) {
            console.log(`   - ${key} ✅`);
          }
        });
        
        // 결론
        const shouldBeInMissingList = !(hasKoreanDescription && hasEnglishDescription);
        console.log(`\n📋 결론:`);
        console.log(`   - "설명 없는 공휴일" 목록에 포함되어야 함: ${shouldBeInMissingList}`);
        console.log(`   - 현재 상태: 한국어만 있고 영어 없음`);
        
      } else {
        console.log(`❌ Carnival 공휴일을 찾을 수 없습니다.`);
      }
    }
  } else {
    console.log(`❌ ${file} 파일을 찾을 수 없습니다.`);
  }

  // 3. 기존 키 샘플 출력
  console.log(`\n📝 기존 키 샘플 (처음 20개):`);
  Array.from(existingKeys).slice(0, 20).forEach((key, index) => {
    console.log(`   ${index + 1}. ${key}`);
  });
}

// 스크립트 실행
testAndorraCarnival().catch(console.error);