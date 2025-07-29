#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import path from 'path';

/**
 * AI 캐시 파일을 public 디렉토리로 복사하는 스크립트
 * 배포 환경에서 캐시 파일에 접근할 수 있도록 함
 */

const CACHE_SOURCE = path.join(process.cwd(), 'data', 'ai-cache', 'holiday-descriptions.json');
const CACHE_DEST = path.join(process.cwd(), 'public', 'ai-cache.json');

async function copyCache() {
  try {
    console.log('🔄 AI 캐시 파일을 public 디렉토리로 복사 중...');
    
    // 소스 파일 존재 확인
    try {
      await fs.access(CACHE_SOURCE);
    } catch (error) {
      console.log('⚠️  캐시 파일이 존재하지 않습니다. 빈 캐시로 시작합니다.');
      await fs.writeFile(CACHE_DEST, '{}');
      return;
    }
    
    // 캐시 파일 복사
    const cacheData = await fs.readFile(CACHE_SOURCE, 'utf-8');
    await fs.writeFile(CACHE_DEST, cacheData);
    
    // 통계 출력
    const cache = JSON.parse(cacheData);
    const itemCount = Object.keys(cache).length;
    const fileSize = (Buffer.byteLength(cacheData, 'utf8') / 1024).toFixed(2);
    
    console.log('✅ 캐시 파일 복사 완료');
    console.log(`   - 항목 수: ${itemCount}개`);
    console.log(`   - 파일 크기: ${fileSize} KB`);
    console.log(`   - 대상: ${CACHE_DEST}`);
    
  } catch (error) {
    console.error('❌ 캐시 파일 복사 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  copyCache();
}

export { copyCache };