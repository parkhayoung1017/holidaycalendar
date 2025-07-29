import { promises as fs } from 'fs';
import path from 'path';
import { logInfo, logWarning, logApiError } from './error-logger';

interface CachedContent {
  holidayId: string;
  holidayName: string;
  countryName: string;
  locale: string;
  description: string;
  confidence: number;
  generatedAt: string;
  lastUsed: string;
}

const CACHE_DIR = path.join(process.cwd(), 'data', 'ai-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'holiday-descriptions.json');
const PUBLIC_CACHE_FILE = path.join(process.cwd(), 'public', 'ai-cache.json');

/**
 * 캐시 디렉토리를 생성합니다
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    logApiError('캐시 디렉토리 생성 실패', error);
  }
}

/**
 * 캐시에서 공휴일 설명을 조회합니다
 */
export async function getCachedDescription(
  holidayName: string,
  countryName: string,
  locale: string
): Promise<CachedContent | null> {
  try {
    const cacheKey = `${holidayName}-${countryName}-${locale}`;
    
    // 먼저 개발 환경의 캐시 파일 시도
    try {
      await ensureCacheDir();
      const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
      const cache: Record<string, CachedContent> = JSON.parse(cacheData);
      
      const cached = cache[cacheKey];
      if (cached) {
        // 마지막 사용 시간 업데이트 (개발 환경에서만)
        cached.lastUsed = new Date().toISOString();
        cache[cacheKey] = cached;
        
        // 캐시 파일 업데이트 (개발 환경에서만)
        await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
        
        logInfo(`캐시에서 설명 조회 성공 (개발): ${holidayName}`);
        return cached;
      }
    } catch (error) {
      // 개발 환경 캐시 실패 시 배포 환경 캐시 시도
      try {
        const publicCacheData = await fs.readFile(PUBLIC_CACHE_FILE, 'utf-8');
        const publicCache: Record<string, CachedContent> = JSON.parse(publicCacheData);
        
        const cached = publicCache[cacheKey];
        if (cached) {
          logInfo(`캐시에서 설명 조회 성공 (배포): ${holidayName}`);
          return cached;
        }
      } catch (publicError) {
        // 마지막으로 HTTP를 통한 캐시 접근 시도 (배포 환경)
        try {
          if (typeof window !== 'undefined') {
            // 클라이언트 사이드에서는 fetch 사용
            const response = await fetch('/ai-cache.json');
            if (response.ok) {
              const httpCache: Record<string, CachedContent> = await response.json();
              const cached = httpCache[cacheKey];
              if (cached) {
                logInfo(`캐시에서 설명 조회 성공 (HTTP): ${holidayName}`);
                return cached;
              }
            }
          }
        } catch (httpError) {
          logWarning('HTTP 캐시 접근도 실패', httpError);
        }
        
        logWarning('모든 캐시 접근 방법 실패', publicError);
      }
    }
    
    return null;
  } catch (error) {
    logApiError('캐시 조회 실패', error);
    return null;
  }
}

/**
 * 캐시에 공휴일 설명을 저장합니다
 */
export async function setCachedDescription(
  holidayId: string,
  holidayName: string,
  countryName: string,
  locale: string,
  description: string,
  confidence: number
): Promise<void> {
  try {
    await ensureCacheDir();
    
    const cacheKey = `${holidayName}-${countryName}-${locale}`;
    const now = new Date().toISOString();
    
    const cachedContent: CachedContent = {
      holidayId,
      holidayName,
      countryName,
      locale,
      description,
      confidence,
      generatedAt: now,
      lastUsed: now
    };
    
    let cache: Record<string, CachedContent> = {};
    
    try {
      const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
      cache = JSON.parse(cacheData);
    } catch (error) {
      // 캐시 파일이 없는 경우 새로 생성
      logInfo('새 캐시 파일 생성');
    }
    
    cache[cacheKey] = cachedContent;
    
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    logInfo(`캐시에 설명 저장 완료: ${holidayName}`);
    
  } catch (error) {
    logApiError('캐시 저장 실패', error);
  }
}

/**
 * 오래된 캐시 항목을 정리합니다 (30일 이상 사용되지 않은 항목)
 */
export async function cleanupCache(): Promise<void> {
  try {
    await ensureCacheDir();
    
    const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
    const cache: Record<string, CachedContent> = JSON.parse(cacheData);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let cleanedCount = 0;
    const cleanedCache: Record<string, CachedContent> = {};
    
    for (const [key, content] of Object.entries(cache)) {
      const lastUsed = new Date(content.lastUsed);
      if (lastUsed > thirtyDaysAgo) {
        cleanedCache[key] = content;
      } else {
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      await fs.writeFile(CACHE_FILE, JSON.stringify(cleanedCache, null, 2));
      logInfo(`캐시 정리 완료: ${cleanedCount}개 항목 삭제`);
    }
    
  } catch (error) {
    logApiError('캐시 정리 실패', error);
  }
}

/**
 * 캐시 통계를 조회합니다
 */
export async function getCacheStats(): Promise<{
  totalItems: number;
  totalSize: string;
  oldestItem: string;
  newestItem: string;
}> {
  try {
    await ensureCacheDir();
    
    const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
    const cache: Record<string, CachedContent> = JSON.parse(cacheData);
    
    const items = Object.values(cache);
    const totalItems = items.length;
    
    // 파일 크기 계산
    const stats = await fs.stat(CACHE_FILE);
    const totalSize = `${(stats.size / 1024).toFixed(2)} KB`;
    
    // 가장 오래된/최신 항목 찾기
    let oldestDate = new Date();
    let newestDate = new Date(0);
    
    items.forEach(item => {
      const generated = new Date(item.generatedAt);
      if (generated < oldestDate) oldestDate = generated;
      if (generated > newestDate) newestDate = generated;
    });
    
    return {
      totalItems,
      totalSize,
      oldestItem: oldestDate.toISOString(),
      newestItem: newestDate.toISOString()
    };
    
  } catch (error) {
    logApiError('캐시 통계 조회 실패', error);
    return {
      totalItems: 0,
      totalSize: '0 KB',
      oldestItem: '',
      newestItem: ''
    };
  }
}