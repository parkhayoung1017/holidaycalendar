#!/usr/bin/env node

/**
 * 정적 페이지 생성 스크립트
 * 
 * 이 스크립트는 모든 국가/연도 조합에 대한 정적 페이지를 생성합니다.
 * Next.js의 SSG 기능을 활용하여 빌드 시점에 모든 페이지를 사전 생성합니다.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { validateBuildData, logValidationResult } from '../src/lib/build-validator';
import { getAllAvailableData } from '../src/lib/data-loader';
import { SUPPORTED_COUNTRIES, REGIONS } from '../src/lib/constants';

const execAsync = promisify(exec);

interface BuildStats {
  totalPages: number;
  countryYearPages: number;
  regionalPages: number;
  staticPages: number;
  buildTime: number;
}

/**
 * 빌드 통계를 계산합니다.
 */
async function calculateBuildStats(): Promise<BuildStats> {
  const startTime = Date.now();
  
  try {
    // 사용 가능한 데이터 확인
    const availableData = await getAllAvailableData();
    
    // 국가/연도 페이지 수 계산
    let countryYearPages = 0;
    for (const [countryCode, years] of Object.entries(availableData)) {
      const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
      if (countryInfo) {
        countryYearPages += years.length;
      }
    }
    
    // 지역별 페이지 수 계산 (각 지역당 5년치)
    const regionalPages = REGIONS.length * 5;
    
    // 정적 페이지 수 (홈, 오늘의 공휴일, 지역 목록 등)
    const staticPages = 3;
    
    const totalPages = countryYearPages + regionalPages + staticPages;
    const buildTime = Date.now() - startTime;
    
    return {
      totalPages,
      countryYearPages,
      regionalPages,
      staticPages,
      buildTime
    };
    
  } catch (error) {
    console.error('빌드 통계 계산 중 오류:', error);
    return {
      totalPages: 0,
      countryYearPages: 0,
      regionalPages: 0,
      staticPages: 0,
      buildTime: Date.now() - startTime
    };
  }
}

/**
 * Next.js 빌드를 실행합니다.
 */
async function runNextBuild(mode: 'static' | 'isr' = 'isr'): Promise<void> {
  console.log(`🏗️  Next.js ${mode === 'static' ? '정적' : 'ISR'} 빌드를 시작합니다...`);
  
  try {
    const env = mode === 'static' ? { ...process.env, BUILD_MODE: 'export' } : process.env;
    
    const { stdout, stderr } = await execAsync('npm run build', { 
      env,
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    if (stdout) {
      console.log('빌드 출력:', stdout);
    }
    
    if (stderr) {
      console.warn('빌드 경고:', stderr);
    }
    
    console.log('✅ Next.js 빌드가 완료되었습니다.');
    
  } catch (error: any) {
    console.error('❌ Next.js 빌드 실패:', error.message);
    if (error.stdout) console.log('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
    throw error;
  }
}

/**
 * 빌드 결과를 검증합니다.
 */
async function validateBuildOutput(mode: 'static' | 'isr'): Promise<void> {
  console.log('🔍 빌드 결과를 검증합니다...');
  
  try {
    const outputDir = mode === 'static' ? 'out' : '.next';
    const { stdout } = await execAsync(`find ${outputDir} -name "*.html" | wc -l`);
    const htmlFileCount = parseInt(stdout.trim());
    
    console.log(`📄 생성된 HTML 파일 수: ${htmlFileCount}개`);
    
    if (htmlFileCount === 0) {
      throw new Error('HTML 파일이 생성되지 않았습니다.');
    }
    
    console.log('✅ 빌드 결과 검증 완료');
    
  } catch (error) {
    console.error('❌ 빌드 결과 검증 실패:', error);
    throw error;
  }
}

/**
 * 빌드 통계를 출력합니다.
 */
function logBuildStats(stats: BuildStats): void {
  console.log('\n📊 빌드 통계:');
  console.log(`- 총 페이지 수: ${stats.totalPages}개`);
  console.log(`- 국가/연도 페이지: ${stats.countryYearPages}개`);
  console.log(`- 지역별 페이지: ${stats.regionalPages}개`);
  console.log(`- 정적 페이지: ${stats.staticPages}개`);
  console.log(`- 빌드 시간: ${(stats.buildTime / 1000).toFixed(2)}초`);
  console.log('');
}

/**
 * 메인 빌드 함수
 */
async function main() {
  const startTime = Date.now();
  const buildMode = process.argv.includes('--static') ? 'static' : 'isr';
  
  console.log('🚀 정적 페이지 생성을 시작합니다...');
  console.log(`📋 빌드 모드: ${buildMode === 'static' ? '정적 Export' : 'ISR (Incremental Static Regeneration)'}\n`);
  
  try {
    // 1. 데이터 검증
    console.log('1️⃣ 데이터 검증 단계');
    const validationResult = await validateBuildData();
    logValidationResult(validationResult);
    
    if (!validationResult.isValid) {
      console.error('❌ 데이터 검증 실패로 인해 빌드를 중단합니다.');
      process.exit(1);
    }
    
    // 2. 빌드 통계 계산
    console.log('2️⃣ 빌드 통계 계산');
    const stats = await calculateBuildStats();
    logBuildStats(stats);
    
    // 3. Next.js 빌드 실행
    console.log('3️⃣ Next.js 빌드 실행');
    await runNextBuild(buildMode);
    
    // 4. 빌드 결과 검증
    console.log('4️⃣ 빌드 결과 검증');
    await validateBuildOutput(buildMode);
    
    // 5. 완료 메시지
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n🎉 정적 페이지 생성이 완료되었습니다!`);
    console.log(`⏱️  총 소요 시간: ${totalTime.toFixed(2)}초`);
    console.log(`📦 빌드 모드: ${buildMode === 'static' ? '정적 Export' : 'ISR'}`);
    console.log(`📄 생성된 페이지: ${stats.totalPages}개`);
    
    if (buildMode === 'isr') {
      console.log(`🔄 ISR 재생성 주기: 국가 페이지 1시간, 지역 페이지 6시간, 오늘의 공휴일 1시간`);
    }
    
  } catch (error) {
    console.error('\n💥 빌드 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

export { main as buildStaticPages };