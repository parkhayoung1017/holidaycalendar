#!/usr/bin/env npx tsx

/**
 * 안도라 중복 공휴일 디버깅 스크립트
 */

import fs from 'fs';
import path from 'path';

function debugAndorraDuplicates() {
  console.log('🔍 안도라 중복 공휴일 디버깅...\n');

  const dataDir = path.join(process.cwd(), 'data', 'holidays');
  const andorraFiles = fs.readdirSync(dataDir).filter(file => file.startsWith('ad-'));

  console.log(`📁 안도라 공휴일 파일: ${andorraFiles.length}개`);
  andorraFiles.forEach(file => console.log(`  - ${file}`));

  const allHolidays: Array<{
    name: string;
    date: string;
    year: number;
    file: string;
    id: string;
  }> = [];

  // 모든 안도라 공휴일 수집
  andorraFiles.forEach(file => {
    try {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      if (data.holidays && Array.isArray(data.holidays)) {
        data.holidays.forEach((holiday: any) => {
          allHolidays.push({
            name: holiday.name,
            date: holiday.date,
            year: data.year,
            file: file,
            id: holiday.id
          });
        });
      }
    } catch (error) {
      console.error(`파일 읽기 실패: ${file}`, error);
    }
  });

  console.log(`\n📊 총 안도라 공휴일: ${allHolidays.length}개\n`);

  // 공휴일명별로 그룹화
  const holidayGroups: Record<string, Array<typeof allHolidays[0]>> = {};
  allHolidays.forEach(holiday => {
    if (!holidayGroups[holiday.name]) {
      holidayGroups[holiday.name] = [];
    }
    holidayGroups[holiday.name].push(holiday);
  });

  // 중복 확인
  console.log('🔍 공휴일명별 분석:');
  Object.entries(holidayGroups).forEach(([name, holidays]) => {
    if (holidays.length > 1) {
      console.log(`\n⚠️ 중복: ${name} (${holidays.length}개)`);
      holidays.forEach((holiday, index) => {
        console.log(`  ${index + 1}. ${holiday.date} (${holiday.year}) - ${holiday.file} - ${holiday.id}`);
      });
    } else {
      console.log(`✅ 단일: ${name} (${holidays[0].year})`);
    }
  });

  // 카니발 특별 확인
  const carnivalHolidays = holidayGroups['Carnival'] || [];
  if (carnivalHolidays.length > 0) {
    console.log(`\n🎭 카니발 상세 분석:`);
    carnivalHolidays.forEach((carnival, index) => {
      console.log(`${index + 1}. ${carnival.name}`);
      console.log(`   - 날짜: ${carnival.date}`);
      console.log(`   - 연도: ${carnival.year}`);
      console.log(`   - 파일: ${carnival.file}`);
      console.log(`   - ID: ${carnival.id}`);
      console.log('');
    });
  }

  // 연도별 통계
  console.log('\n📈 연도별 통계:');
  const yearStats: Record<number, number> = {};
  allHolidays.forEach(holiday => {
    yearStats[holiday.year] = (yearStats[holiday.year] || 0) + 1;
  });

  Object.entries(yearStats).forEach(([year, count]) => {
    console.log(`  ${year}: ${count}개`);
  });

  // 어드민 대시보드에서 표시될 항목들 시뮬레이션
  console.log('\n🖥️ 어드민 대시보드 표시 시뮬레이션:');
  console.log('(연도 필터 없이 모든 공휴일 표시)');
  
  allHolidays.forEach((holiday, index) => {
    const holidayId = `ad_${holiday.year}_${holiday.date}_${holiday.name.replace(/\s+/g, '_')}`;
    console.log(`${index + 1}. ${holiday.name} (${holiday.date}, ${holiday.year})`);
    console.log(`   - ID: ${holidayId}`);
  });
}

debugAndorraDuplicates();