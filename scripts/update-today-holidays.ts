#!/usr/bin/env tsx

/**
 * 오늘의 공휴일 데이터를 업데이트하는 스크립트
 * 매일 자동으로 실행되어 오늘의 공휴일 정보를 갱신합니다.
 */

import { todayHolidaysUpdater } from '../src/lib/today-holidays-updater';
import { promises as fs } from 'fs';
import path from 'path';

interface UpdateResult {
  date: string;
  totalHolidays: number;
  countriesCount: number;
  countries: string[];
  timestamp: string;
  success: boolean;
  error?: string;
}

/**
 * 오늘의 공휴일 업데이트 실행
 */
async function updateTodayHolidays(): Promise<UpdateResult> {
  const today = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`🔄 오늘의 공휴일 업데이트 시작: ${today}`);
    
    // 캐시 무효화
    todayHolidaysUpdater.invalidateCache(today);
    
    // 오늘의 공휴일 데이터 로드
    const holidays = await todayHolidaysUpdater.getTodayHolidays();
    const stats = await todayHolidaysUpdater.getTodayHolidayStats();
    
    console.log(`📊 업데이트 결과:`);
    console.log(`   - 총 공휴일: ${stats.totalHolidays}개`);
    console.log(`   - 해당 국가: ${stats.countriesCount}개`);
    
    if (stats.countries.length > 0) {
      console.log(`   - 국가 목록:`);
      stats.countries.forEach(country => {
        console.log(`     • ${country.flag} ${country.name}: ${country.holidayCount}개`);
      });
    } else {
      console.log(`   - 오늘은 공휴일인 국가가 없습니다.`);
    }
    
    const result: UpdateResult = {
      date: today,
      totalHolidays: stats.totalHolidays,
      countriesCount: stats.countriesCount,
      countries: stats.countries.map(c => `${c.flag} ${c.name}`),
      timestamp,
      success: true
    };
    
    // 결과를 로그 파일에 저장
    await saveUpdateLog(result);
    
    console.log(`✅ 오늘의 공휴일 업데이트 완료`);
    return result;
    
  } catch (error) {
    console.error(`❌ 오늘의 공휴일 업데이트 실패:`, error);
    
    const result: UpdateResult = {
      date: today,
      totalHolidays: 0,
      countriesCount: 0,
      countries: [],
      timestamp,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    await saveUpdateLog(result);
    return result;
  }
}

/**
 * 업데이트 로그를 파일에 저장
 */
async function saveUpdateLog(result: UpdateResult): Promise<void> {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    
    // logs 디렉토리가 없으면 생성
    try {
      await fs.access(logsDir);
    } catch {
      await fs.mkdir(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, 'today-holidays-update.log');
    const logEntry = `${result.timestamp} - ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.date} - ${result.totalHolidays} holidays in ${result.countriesCount} countries${result.error ? ` - ERROR: ${result.error}` : ''}\n`;
    
    await fs.appendFile(logFile, logEntry);
    
    // JSON 형태로도 저장 (최근 30일분만 유지)
    const jsonLogFile = path.join(logsDir, 'today-holidays-update.json');
    let logs: UpdateResult[] = [];
    
    try {
      const existingLogs = await fs.readFile(jsonLogFile, 'utf-8');
      logs = JSON.parse(existingLogs);
    } catch {
      // 파일이 없거나 파싱 실패 시 빈 배열로 시작
    }
    
    logs.push(result);
    
    // 최근 30일분만 유지
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    logs = logs.filter(log => new Date(log.timestamp) > thirtyDaysAgo);
    
    await fs.writeFile(jsonLogFile, JSON.stringify(logs, null, 2));
    
  } catch (error) {
    console.error('로그 저장 실패:', error);
  }
}

/**
 * 캐시 상태 확인
 */
async function checkCacheStatus(): Promise<void> {
  const status = todayHolidaysUpdater.getCacheStatus();
  console.log(`📋 캐시 상태:`);
  console.log(`   - 캐시 항목 수: ${status.size}`);
  console.log(`   - 캐시 키: ${status.keys.join(', ')}`);
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  console.log(`🚀 Today Holidays Updater 시작`);
  console.log(`⏰ 실행 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`─────────────────────────────────────`);
  
  // 캐시 상태 확인
  await checkCacheStatus();
  console.log(`─────────────────────────────────────`);
  
  // 업데이트 실행
  const result = await updateTodayHolidays();
  
  console.log(`─────────────────────────────────────`);
  console.log(`🏁 Today Holidays Updater 완료`);
  
  // 실패 시 exit code 1로 종료
  if (!result.success) {
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main().catch(error => {
    console.error('스크립트 실행 중 오류 발생:', error);
    process.exit(1);
  });
}

export { updateTodayHolidays, checkCacheStatus };