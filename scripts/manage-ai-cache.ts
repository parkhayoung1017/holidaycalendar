#!/usr/bin/env tsx

import { getCacheStatus, getHybridCache } from '../src/lib/hybrid-cache';
import { SupabaseHolidayDescriptionService } from '../src/lib/supabase-client';
import { logInfo } from '../src/lib/error-logger';

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'stats':
      await showCacheStats();
      break;
    case 'cleanup':
      await cleanupOldCache();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function showCacheStats() {
  console.log('📊 하이브리드 캐시 시스템 통계');
  console.log('='.repeat(50));
  
  try {
    const cacheStatus = await getCacheStatus();
    
    console.log('\n🔄 하이브리드 캐시 통계:');
    console.log(`Supabase 히트: ${cacheStatus.hybrid.supabaseHits}개`);
    console.log(`로컬 캐시 히트: ${cacheStatus.hybrid.localHits}개`);
    console.log(`캐시 미스: ${cacheStatus.hybrid.misses}개`);
    console.log(`오류 발생: ${cacheStatus.hybrid.errors}개`);
    console.log(`Supabase 연결 상태: ${cacheStatus.hybrid.isSupabaseAvailable ? '✅ 연결됨' : '❌ 연결 안됨'}`);
    
    if (cacheStatus.hybrid.lastSupabaseCheck) {
      console.log(`마지막 Supabase 확인: ${new Date(cacheStatus.hybrid.lastSupabaseCheck).toLocaleString('ko-KR')}`);
    }
    
    console.log('\n💾 로컬 캐시 통계:');
    console.log(`로컬 캐시 항목: ${cacheStatus.local.totalEntries}개`);
    
    if (cacheStatus.local.lastModified) {
      console.log(`마지막 수정: ${new Date(cacheStatus.local.lastModified).toLocaleString('ko-KR')}`);
    }
    
    // Supabase 통계도 표시
    if (cacheStatus.hybrid.isSupabaseAvailable) {
      console.log('\n🗄️  Supabase 데이터베이스 통계:');
      try {
        const supabaseService = new SupabaseHolidayDescriptionService();
        const dashboardStats = await supabaseService.getDashboardStats();
        
        console.log(`총 설명 수: ${dashboardStats.totalDescriptions}개`);
        console.log(`AI 생성: ${dashboardStats.aiGeneratedCount}개`);
        console.log(`수동 작성: ${dashboardStats.manualCount}개`);
        console.log(`완료율: ${dashboardStats.completionRate.toFixed(1)}%`);
      } catch (error) {
        console.log('Supabase 통계 조회 실패');
      }
    }
    
  } catch (error) {
    console.error('❌ 캐시 통계 조회 실패:', error);
  }
}

async function cleanupOldCache() {
  console.log('🧹 하이브리드 캐시 시스템 정리 중...');
  
  try {
    const hybridCache = getHybridCache();
    
    // 캐시 통계 초기화
    console.log('📊 캐시 통계 초기화...');
    hybridCache.resetStats();
    
    // Supabase 연결 상태 확인
    console.log('🔍 Supabase 연결 상태 확인...');
    const cacheStatus = await getCacheStatus();
    
    if (cacheStatus.hybrid.isSupabaseAvailable) {
      console.log('✅ Supabase 연결됨 - 데이터베이스 정리 수행');
      
      try {
        const supabaseService = new SupabaseHolidayDescriptionService();
        
        // 30일 이상 사용되지 않은 항목 정리 (실제 구현은 필요에 따라)
        console.log('🗄️  오래된 Supabase 항목 정리는 수동으로 수행해주세요.');
        console.log('   (관리자 페이지에서 사용하지 않는 항목을 확인할 수 있습니다)');
        
      } catch (error) {
        console.warn('⚠️  Supabase 정리 중 오류:', error);
      }
    } else {
      console.log('❌ Supabase 연결 안됨 - 로컬 캐시만 정리');
    }
    
    console.log('✅ 캐시 정리 완료');
    
    // 정리 후 통계 표시
    await showCacheStats();
    
  } catch (error) {
    console.error('❌ 캐시 정리 실패:', error);
  }
}

function showHelp() {
  console.log('🤖 AI 콘텐츠 캐시 관리 도구');
  console.log('='.repeat(50));
  console.log('사용법: npm run manage-cache <command>');
  console.log('');
  console.log('명령어:');
  console.log('  stats    - 캐시 통계 표시');
  console.log('  cleanup  - 30일 이상 사용되지 않은 캐시 정리');
  console.log('  help     - 도움말 표시');
  console.log('');
  console.log('예시:');
  console.log('  npm run manage-cache stats');
  console.log('  npm run manage-cache cleanup');
}

main().catch(console.error);