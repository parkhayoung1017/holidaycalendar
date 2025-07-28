#!/usr/bin/env tsx

import { cleanupCache, getCacheStats } from '../src/lib/ai-content-cache';
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
  console.log('📊 AI 콘텐츠 캐시 통계');
  console.log('='.repeat(50));
  
  try {
    const stats = await getCacheStats();
    
    console.log(`총 캐시 항목: ${stats.totalItems}개`);
    console.log(`캐시 파일 크기: ${stats.totalSize}`);
    
    if (stats.oldestItem) {
      console.log(`가장 오래된 항목: ${new Date(stats.oldestItem).toLocaleDateString('ko-KR')}`);
    }
    
    if (stats.newestItem) {
      console.log(`가장 최신 항목: ${new Date(stats.newestItem).toLocaleDateString('ko-KR')}`);
    }
    
  } catch (error) {
    console.error('❌ 캐시 통계 조회 실패:', error);
  }
}

async function cleanupOldCache() {
  console.log('🧹 오래된 캐시 정리 중...');
  
  try {
    await cleanupCache();
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