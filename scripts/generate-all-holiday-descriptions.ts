#!/usr/bin/env tsx

import { loadHolidayData, getAllAvailableData } from '../src/lib/data-loader';
import { generateAIHolidayDescription } from '../src/lib/ai-content-generator-enhanced';
import { saveAIDescriptionToSupabase } from '../src/lib/ai-content-supabase-integration';
import { getCachedDescription, getCacheStatus } from '../src/lib/hybrid-cache';
import { logInfo, logWarning } from '../src/lib/error-logger';

interface GenerationStats {
  total: number;
  generated: number;
  cached: number;
  failed: number;
  startTime: Date;
}

async function main() {
  const args = process.argv.slice(2);
  const forceRegenerate = args.includes('--force');
  const locale = args.includes('--en') ? 'en' : 'ko';
  const maxItems = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) || 50 : undefined;
  
  console.log('🚀 공휴일 설명 일괄 생성 시작');
  console.log('='.repeat(60));
  console.log(`언어: ${locale}`);
  console.log(`강제 재생성: ${forceRegenerate ? '예' : '아니오'}`);
  if (maxItems) console.log(`최대 생성 개수: ${maxItems}개`);
  console.log('');

  const stats: GenerationStats = {
    total: 0,
    generated: 0,
    cached: 0,
    failed: 0,
    startTime: new Date()
  };

  try {
    // 사용 가능한 모든 데이터 조회
    const availableData = await getAllAvailableData();
    
    // 주요 국가들 우선 처리
    const priorityCountries = ['KR', 'US', 'JP', 'GB', 'FR', 'DE', 'CA', 'AU'];
    const currentYear = new Date().getFullYear();
    
    let processedCount = 0;
    
    for (const countryCode of priorityCountries) {
      if (maxItems && processedCount >= maxItems) break;
      
      if (!availableData[countryCode]?.includes(currentYear)) {
        console.log(`⚠️  ${countryCode}: ${currentYear}년 데이터 없음`);
        continue;
      }

      console.log(`\n🌍 ${countryCode} (${currentYear}) 처리 중...`);
      
      try {
        const holidays = await loadHolidayData(countryCode, currentYear);
        const countryName = getCountryName(countryCode);
        
        for (const holiday of holidays) {
          if (maxItems && processedCount >= maxItems) break;
          
          stats.total++;
          processedCount++;
          
          try {
            console.log(`  📅 ${holiday.name} 처리 중... (${processedCount}/${maxItems || '∞'})`);
            
            // 강제 재생성이 아닌 경우 기존 캐시 확인
            if (!forceRegenerate) {
              const cached = await getCachedDescription(holiday.name, countryName, locale);
              if (cached && cached.description.length > 100) {
                stats.cached++;
                console.log(`    📦 캐시 사용 (신뢰도: ${cached.confidence})`);
                continue;
              }
            }
            
            // AI로 새 설명 생성
            const description = await generateAIHolidayDescription(
              holiday.name,
              countryName,
              holiday.date,
              locale
            );
            
            if (description && description.length > 100) {
              // Supabase에 저장 (하이브리드 캐시도 자동으로 업데이트됨)
              await saveAIDescriptionToSupabase(
                holiday.id,
                holiday.name,
                countryName,
                locale,
                description,
                0.9,
                'claude-3.5-sonnet'
              );
              
              stats.generated++;
              console.log(`    ✅ AI 생성 완료 (${description.length}자)`);
            } else {
              stats.failed++;
              console.log(`    ⚠️  설명이 너무 짧음 (${description?.length || 0}자)`);
            }
            
            // API 호출 간격 조절 (과도한 요청 방지)
            await sleep(2000);
            
          } catch (error) {
            stats.failed++;
            console.log(`    ❌ 실패: ${holiday.name}`);
            logWarning(`공휴일 설명 생성 실패: ${holiday.name}`, error);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${countryCode} 데이터 로드 실패`);
        logWarning(`국가 데이터 로드 실패: ${countryCode}`, error);
      }
    }
    
    // 결과 요약
    await showFinalStats(stats);
    
  } catch (error) {
    console.error('❌ 일괄 생성 실패:', error);
    process.exit(1);
  }
}

function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'KR': 'South Korea',
    'US': 'United States',
    'JP': 'Japan',
    'GB': 'United Kingdom',
    'FR': 'France',
    'DE': 'Germany',
    'CA': 'Canada',
    'AU': 'Australia',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland'
  };
  
  return countryNames[countryCode] || countryCode;
}

async function showFinalStats(stats: GenerationStats) {
  const endTime = new Date();
  const duration = Math.round((endTime.getTime() - stats.startTime.getTime()) / 1000);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 생성 완료 통계');
  console.log('='.repeat(60));
  console.log(`총 처리 항목: ${stats.total}개`);
  console.log(`새로 생성: ${stats.generated}개`);
  console.log(`캐시 사용: ${stats.cached}개`);
  console.log(`실패: ${stats.failed}개`);
  console.log(`소요 시간: ${duration}초`);
  console.log(`평균 처리 시간: ${(duration / stats.total).toFixed(2)}초/항목`);
  
  // 캐시 통계 표시
  console.log('\n📦 캐시 현황:');
  try {
    const cacheStatus = await getCacheStatus();
    console.log(`Supabase 히트: ${cacheStatus.hybrid.supabaseHits}개`);
    console.log(`로컬 캐시 히트: ${cacheStatus.hybrid.localHits}개`);
    console.log(`로컬 캐시 항목: ${cacheStatus.local.totalEntries}개`);
    console.log(`Supabase 연결 상태: ${cacheStatus.hybrid.isSupabaseAvailable ? '✅ 연결됨' : '❌ 연결 안됨'}`);
  } catch (error) {
    console.log('캐시 통계 조회 실패');
  }
  
  console.log('\n✅ 일괄 생성 완료!');
  console.log('이제 공휴일 페이지 로딩이 훨씬 빨라집니다.');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showHelp() {
  console.log('🤖 공휴일 설명 일괄 생성 도구');
  console.log('='.repeat(50));
  console.log('사용법: npm run generate-descriptions [옵션]');
  console.log('');
  console.log('옵션:');
  console.log('  --force     기존 설명이 있어도 강제로 재생성');
  console.log('  --en        영어로 생성 (기본값: 한국어)');
  console.log('  --limit N   최대 N개 항목만 처리');
  console.log('  --help      도움말 표시');
  console.log('');
  console.log('예시:');
  console.log('  npm run generate-descriptions');
  console.log('  npm run generate-descriptions --force');
  console.log('  npm run generate-descriptions --en --limit 100');
}

// 도움말 요청 시
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

main().catch(console.error);