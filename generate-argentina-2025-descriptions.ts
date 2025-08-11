#!/usr/bin/env tsx

/**
 * 아르헨티나 2025년 공휴일 AI 설명 생성 스크립트
 */

import fs from 'fs';
import path from 'path';

// 아르헨티나 2025년 공휴일 데이터
const argentina2025Holidays = [
  {
    "id": "AR-2025-01-01-0",
    "name": "New Year's Day",
    "date": "2025-01-01",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-03-03-1",
    "name": "Carnival",
    "date": "2025-03-03",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-03-04-2",
    "name": "Carnival",
    "date": "2025-03-04",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-03-24-3",
    "name": "Day of Remembrance for Truth and Justice",
    "date": "2025-03-24",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-04-02-4",
    "name": "Day of the Veterans and Fallen of the Malvinas War",
    "date": "2025-04-02",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-04-18-5",
    "name": "Good Friday",
    "date": "2025-04-18",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-05-01-6",
    "name": "Labour Day",
    "date": "2025-05-01",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-05-25-7",
    "name": "May Revolution",
    "date": "2025-05-25",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-06-16-8",
    "name": "Anniversary of the Passing of General Martín Miguel de Güemes",
    "date": "2025-06-16",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-06-20-9",
    "name": "General Manuel Belgrano Memorial Day",
    "date": "2025-06-20",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-07-09-10",
    "name": "Independence Day",
    "date": "2025-07-09",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-08-17-11",
    "name": "General José de San Martín Memorial Day",
    "date": "2025-08-17",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-10-12-12",
    "name": "Day of Respect for Cultural Diversity",
    "date": "2025-10-12",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-11-24-13",
    "name": "National Sovereignty Day",
    "date": "2025-11-24",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-12-08-14",
    "name": "Immaculate Conception Day",
    "date": "2025-12-08",
    "countryCode": "AR",
    "type": "public",
    "global": true
  },
  {
    "id": "AR-2025-12-25-15",
    "name": "Christmas Day",
    "date": "2025-12-25",
    "countryCode": "AR",
    "type": "public",
    "global": true
  }
];

// 2024년 기존 설명을 2025년으로 복사하는 함수
async function copyArgentina2024To2025() {
  try {
    // AI 캐시 파일 읽기
    const aiCachePath = path.join(process.cwd(), 'public', 'ai-cache.json');
    
    if (!fs.existsSync(aiCachePath)) {
      console.error('AI 캐시 파일이 존재하지 않습니다:', aiCachePath);
      return;
    }

    const aiCache = JSON.parse(fs.readFileSync(aiCachePath, 'utf-8'));
    let addedCount = 0;

    // 각 공휴일에 대해 2024년 설명을 2025년으로 복사
    for (const holiday of argentina2025Holidays) {
      const holidayName = holiday.name;
      
      // 한국어 설명 복사
      const koKey2024 = `${holidayName}-Argentina-ko`;
      const koKey2025 = `${holidayName}-Argentina-ko`;
      
      if (aiCache[koKey2024] && !aiCache[koKey2025]) {
        const koDescription = { ...aiCache[koKey2024] };
        koDescription.holidayId = holiday.id;
        koDescription.generatedAt = new Date().toISOString();
        koDescription.lastUsed = new Date().toISOString();
        
        aiCache[koKey2025] = koDescription;
        console.log(`✅ 한국어 설명 복사: ${holidayName}`);
        addedCount++;
      }
      
      // 영어 설명 복사
      const enKey2024 = `${holidayName}-Argentina-en`;
      const enKey2025 = `${holidayName}-Argentina-en`;
      
      if (aiCache[enKey2024] && !aiCache[enKey2025]) {
        const enDescription = { ...aiCache[enKey2024] };
        enDescription.holidayId = holiday.id;
        enDescription.generatedAt = new Date().toISOString();
        enDescription.lastUsed = new Date().toISOString();
        
        aiCache[enKey2025] = enDescription;
        console.log(`✅ 영어 설명 복사: ${holidayName}`);
        addedCount++;
      }
    }

    // AI 캐시 파일 업데이트
    if (addedCount > 0) {
      fs.writeFileSync(aiCachePath, JSON.stringify(aiCache, null, 2), 'utf-8');
      console.log(`\n🎉 총 ${addedCount}개의 설명을 추가했습니다.`);
      console.log('AI 캐시 파일이 업데이트되었습니다:', aiCachePath);
    } else {
      console.log('\n⚠️ 추가할 새로운 설명이 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  copyArgentina2024To2025();
}