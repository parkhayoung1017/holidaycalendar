/**
 * 하이브리드 캐시 시스템
 * 
 * Supabase를 우선으로 하되, 실패 시 로컬 캐시로 폴백하는 시스템
 * 기존 AI 콘텐츠 생성 시스템과 통합되며 레거시 형식 호환성을 유지
 * 
 * 주요 기능:
 * - Supabase 우선 조회 및 저장
 * - 로컬 캐시 폴백 메커니즘
 * - 기존 AI 콘텐츠 생성 시스템과의 완전한 호환성
 * - 레거시 형식 자동 변환
 * - 연결 상태 모니터링 및 자동 복구
 */

import fs from 'fs/promises';
import path from 'path';
import { SupabaseHolidayDescriptionService } from './supabase-client';
import { checkSupabaseConnection } from './supabase';
import { logInfo, logWarning, logApiError } from './error-logger';
import type { HolidayDescription } from '../types/admin';

// 레거시 캐시 콘텐츠 타입 (기존 시스템과 호환성 유지)
export interface CachedContent {
  holidayId: string;
  holidayName: string;
  countryName: string;
  locale: string;
  description: string;
  confidence: number;
  generatedAt: string;
  lastUsed: string;
}

// 하이브리드 캐시 옵션
export interface HybridCacheOptions {
  enableSupabase?: boolean;
  fallbackToLocal?: boolean;
  cacheTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// 캐시 통계
export interface CacheStats {
  supabaseHits: number;
  localHits: number;
  misses: number;
  errors: number;
  lastSupabaseCheck: string | null;
  isSupabaseAvailable: boolean;
}

/**
 * 로컬 캐시 서비스
 */
class LocalCacheService {
  private cacheFilePath = path.join(process.cwd(), 'public/ai-cache.json');
  private cache: Record<string, CachedContent> | null = null;
  private lastLoadTime = 0;
  private readonly CACHE_TTL: number;

  constructor(cacheTTL: number = 5 * 60 * 1000) {
    this.CACHE_TTL = cacheTTL;
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(holidayName: string, countryName: string, locale: string): string {
    return `${holidayName}-${countryName}-${locale}`;
  }

  /**
   * 로컬 캐시 로드
   */
  private async loadCache(): Promise<Record<string, CachedContent>> {
    const now = Date.now();
    
    // 캐시가 유효한 경우 재사용
    if (this.cache && (now - this.lastLoadTime) < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      const fileContent = await fs.readFile(this.cacheFilePath, 'utf-8');
      this.cache = JSON.parse(fileContent);
      this.lastLoadTime = now;
      
      return this.cache || {};
    } catch (error) {
      console.warn('로컬 캐시 로드 실패:', error);
      this.cache = {};
      this.lastLoadTime = now;
      return {};
    }
  }

  /**
   * 로컬 캐시에서 설명 조회
   */
  async getCachedDescription(
    holidayName: string, 
    countryName: string, 
    locale: string
  ): Promise<CachedContent | null> {
    try {
      const cache = await this.loadCache();
      const key = this.getCacheKey(holidayName, countryName, locale);
      const content = cache[key];
      
      if (content) {
        // lastUsed 업데이트 (비동기로 처리하여 성능 영향 최소화)
        this.updateLastUsed(key).catch(error => 
          console.warn('lastUsed 업데이트 실패:', error)
        );
      }
      
      return content || null;
    } catch (error) {
      console.error('로컬 캐시 조회 실패:', error);
      return null;
    }
  }

  /**
   * 로컬 캐시에 설명 저장
   */
  async setCachedDescription(
    holidayId: string,
    holidayName: string,
    countryName: string,
    locale: string,
    description: string,
    confidence: number
  ): Promise<void> {
    try {
      const cache = await this.loadCache();
      const key = this.getCacheKey(holidayName, countryName, locale);
      const now = new Date().toISOString();
      
      cache[key] = {
        holidayId,
        holidayName,
        countryName,
        locale,
        description,
        confidence,
        generatedAt: now,
        lastUsed: now
      };
      
      // 캐시 파일 저장
      await this.saveCache(cache);
      
      // 메모리 캐시 업데이트
      this.cache = cache;
      this.lastLoadTime = Date.now();
      
    } catch (error) {
      console.error('로컬 캐시 저장 실패:', error);
      throw error;
    }
  }

  /**
   * lastUsed 필드 업데이트
   */
  private async updateLastUsed(key: string): Promise<void> {
    try {
      const cache = await this.loadCache();
      if (cache[key]) {
        cache[key].lastUsed = new Date().toISOString();
        await this.saveCache(cache);
        this.cache = cache;
      }
    } catch (error) {
      // lastUsed 업데이트 실패는 치명적이지 않음
      console.warn('lastUsed 업데이트 실패:', error);
    }
  }

  /**
   * 캐시 파일 저장
   */
  private async saveCache(cache: Record<string, CachedContent>): Promise<void> {
    try {
      // 디렉토리 생성
      await fs.mkdir(path.dirname(this.cacheFilePath), { recursive: true });
      
      // 파일 저장
      await fs.writeFile(this.cacheFilePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      console.error('캐시 파일 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시 통계 조회
   */
  async getCacheStats(): Promise<{ totalEntries: number; lastModified: string | null }> {
    try {
      const cache = await this.loadCache();
      const entries = Object.values(cache);
      
      const lastModified = entries.length > 0 
        ? entries.reduce((latest, entry) => 
            entry.lastUsed > latest ? entry.lastUsed : latest, entries[0].lastUsed)
        : null;
      
      return {
        totalEntries: entries.length,
        lastModified
      };
    } catch (error) {
      return { totalEntries: 0, lastModified: null };
    }
  }
}

/**
 * 하이브리드 캐시 서비스
 */
export class HybridCacheService {
  private supabaseService: SupabaseHolidayDescriptionService;
  private localCacheService: LocalCacheService;
  private stats: CacheStats;
  private options: Required<HybridCacheOptions>;

  constructor(options: HybridCacheOptions = {}) {
    this.options = {
      enableSupabase: true,
      fallbackToLocal: true,
      cacheTimeout: 5 * 60 * 1000, // 5분
      retryAttempts: 2,
      retryDelay: 1000, // 1초
      ...options
    };

    this.supabaseService = new SupabaseHolidayDescriptionService();
    this.localCacheService = new LocalCacheService(this.options.cacheTimeout);

    this.stats = {
      supabaseHits: 0,
      localHits: 0,
      misses: 0,
      errors: 0,
      lastSupabaseCheck: null,
      isSupabaseAvailable: false
    };

    // 주기적으로 Supabase 연결 상태 확인
    this.checkSupabaseAvailability();
    setInterval(() => this.checkSupabaseAvailability(), 60000); // 1분마다
  }

  /**
   * 공휴일 설명 조회 (하이브리드 방식)
   */
  async getDescription(
    holidayName: string, 
    countryName: string, 
    locale: string = 'ko'
  ): Promise<CachedContent | null> {
    try {
      // 1. Supabase에서 조회 시도 (국가명과 국가코드 모두 시도)
      if (this.options.enableSupabase) {
        // Supabase 연결 상태가 불확실한 경우 연결 확인
        if (!this.stats.isSupabaseAvailable) {
          await this.checkSupabaseAvailability();
        }
        
        if (this.stats.isSupabaseAvailable) {
          try {
            // 먼저 국가명으로 조회
            let supabaseResult = await this.getFromSupabase(holidayName, countryName, locale);
            
            // 국가명으로 찾지 못한 경우 국가코드로도 시도
            if (!supabaseResult && countryName.length > 2) {
              // 국가명을 국가코드로 변환해서 시도
              const countryCode = await this.getCountryCodeFromName(countryName);
              if (countryCode) {
                supabaseResult = await this.getFromSupabase(holidayName, countryCode, locale);
                console.log(`국가코드로 재시도: ${countryName} -> ${countryCode}`, !!supabaseResult);
              }
            }
            
            if (supabaseResult) {
              this.stats.supabaseHits++;
              return this.convertToLegacyFormat(supabaseResult);
            }
          } catch (error) {
            logWarning('Supabase 조회 실패, 로컬 캐시로 폴백:', error);
            this.stats.errors++;
            this.stats.isSupabaseAvailable = false;
          }
        }
      }

      // 2. 로컬 캐시로 폴백 (국가명과 국가코드 모두 시도)
      if (this.options.fallbackToLocal) {
        // 먼저 국가명으로 조회
        let localResult = await this.localCacheService.getCachedDescription(
          holidayName, countryName, locale
        );
        
        // 국가명으로 찾지 못한 경우 국가코드로도 시도
        if (!localResult && countryName.length > 2) {
          const countryCode = await this.getCountryCodeFromName(countryName);
          if (countryCode) {
            localResult = await this.localCacheService.getCachedDescription(
              holidayName, countryCode, locale
            );
            console.log(`로컬 캐시 국가코드로 재시도: ${countryName} -> ${countryCode}`, !!localResult);
          }
        }
        
        // 국가코드로 찾지 못한 경우 국가명으로도 시도
        if (!localResult && countryName.length === 2) {
          const countryName_full = await this.getCountryNameFromCode(countryName);
          if (countryName_full) {
            localResult = await this.localCacheService.getCachedDescription(
              holidayName, countryName_full, locale
            );
            console.log(`로컬 캐시 국가명으로 재시도: ${countryName} -> ${countryName_full}`, !!localResult);
          }
        }
        
        if (localResult) {
          this.stats.localHits++;
          return localResult;
        }
      }

      // 3. 데이터를 찾을 수 없음
      this.stats.misses++;
      return null;

    } catch (error) {
      logApiError('하이브리드 캐시 조회 실패', error as Error, { holidayName, countryName, locale });
      this.stats.errors++;
      return null;
    }
  }

  /**
   * 공휴일 설명 저장 (하이브리드 방식)
   */
  async setDescription(data: CachedContent): Promise<void> {
    const errors: Error[] = [];

    try {
      // 1. Supabase에 저장 시도
      if (this.options.enableSupabase && this.stats.isSupabaseAvailable) {
        try {
          await this.saveToSupabase(data);
        } catch (error) {
          console.warn('Supabase 저장 실패:', error);
          errors.push(error instanceof Error ? error : new Error('Supabase 저장 실패'));
          this.stats.errors++;
          this.stats.isSupabaseAvailable = false;
        }
      }

      // 2. 로컬 캐시에 저장 (항상 시도)
      try {
        await this.localCacheService.setCachedDescription(
          data.holidayId,
          data.holidayName,
          data.countryName,
          data.locale,
          data.description,
          data.confidence
        );
      } catch (error) {
        console.error('로컬 캐시 저장 실패:', error);
        errors.push(error instanceof Error ? error : new Error('로컬 캐시 저장 실패'));
        this.stats.errors++;
      }

      // 모든 저장이 실패한 경우 오류 발생
      if (errors.length === 2) {
        throw new Error(`모든 캐시 저장 실패: ${errors.map(e => e.message).join(', ')}`);
      }

    } catch (error) {
      console.error('하이브리드 캐시 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 설명 일괄 조회
   */
  async getDescriptions(requests: Array<{
    holidayName: string;
    countryName: string;
    locale?: string;
  }>): Promise<Array<CachedContent | null>> {
    const results: Array<CachedContent | null> = [];
    
    for (const request of requests) {
      const result = await this.getDescription(
        request.holidayName,
        request.countryName,
        request.locale || 'ko'
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 캐시 통계 초기화
   */
  resetStats(): void {
    this.stats = {
      supabaseHits: 0,
      localHits: 0,
      misses: 0,
      errors: 0,
      lastSupabaseCheck: this.stats.lastSupabaseCheck,
      isSupabaseAvailable: this.stats.isSupabaseAvailable
    };
  }

  /**
   * 로컬 캐시 통계 조회
   */
  async getLocalCacheStats(): Promise<{ totalEntries: number; lastModified: string | null }> {
    return await this.localCacheService.getCacheStats();
  }

  /**
   * Supabase에서 데이터 조회 (재시도 로직 포함)
   */
  private async getFromSupabase(
    holidayName: string, 
    countryName: string, 
    locale: string
  ): Promise<HolidayDescription | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.options.retryAttempts; attempt++) {
      try {
        return await this.supabaseService.getDescription(holidayName, countryName, locale);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('알 수 없는 오류');
        
        if (attempt < this.options.retryAttempts - 1) {
          await this.sleep(this.options.retryDelay * (attempt + 1));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Supabase에 데이터 저장
   */
  private async saveToSupabase(data: CachedContent): Promise<void> {
    const supabaseData = this.convertFromLegacyFormat(data);
    
    // 기존 데이터 확인
    const existing = await this.supabaseService.getDescription(
      data.holidayName, data.countryName, data.locale
    );
    
    if (existing) {
      // 업데이트
      await this.supabaseService.updateDescription(existing.id, {
        description: supabaseData.description,
        confidence: supabaseData.confidence,
        modified_by: 'hybrid_cache',
        is_manual: false
      });
    } else {
      // 새로 생성
      await this.supabaseService.createDescription(supabaseData);
    }
  }

  /**
   * Supabase 형식을 레거시 형식으로 변환
   */
  private convertToLegacyFormat(supabaseData: HolidayDescription): CachedContent {
    return {
      holidayId: supabaseData.holiday_id,
      holidayName: supabaseData.holiday_name,
      countryName: supabaseData.country_name,
      locale: supabaseData.locale,
      description: supabaseData.description,
      confidence: supabaseData.confidence,
      generatedAt: supabaseData.generated_at,
      lastUsed: supabaseData.last_used
    };
  }

  /**
   * 레거시 형식을 Supabase 형식으로 변환
   */
  private convertFromLegacyFormat(legacyData: CachedContent): any {
    // confidence가 1.0이면 수동 작성으로 간주
    const isManual = legacyData.confidence === 1.0;
    
    return {
      holiday_id: legacyData.holidayId,
      holiday_name: legacyData.holidayName,
      country_name: legacyData.countryName,
      locale: legacyData.locale,
      description: legacyData.description,
      confidence: legacyData.confidence,
      generated_at: legacyData.generatedAt,
      last_used: legacyData.lastUsed,
      modified_by: isManual ? 'admin_manual' : 'hybrid_cache',
      is_manual: isManual,
      ai_model: isManual ? null : 'openai-gpt'
    };
  }

  /**
   * Supabase 연결 상태 확인
   */
  private async checkSupabaseAvailability(): Promise<void> {
    try {
      const isAvailable = await checkSupabaseConnection();
      this.stats.isSupabaseAvailable = isAvailable;
      this.stats.lastSupabaseCheck = new Date().toISOString();
      
      if (!isAvailable) {
        console.warn('Supabase 연결 불가, 로컬 캐시 모드로 동작');
      }
    } catch (error) {
      this.stats.isSupabaseAvailable = false;
      this.stats.lastSupabaseCheck = new Date().toISOString();
      console.warn('Supabase 연결 상태 확인 실패:', error);
    }
  }

  /**
   * 국가명을 국가코드로 변환
   */
  private async getCountryCodeFromName(countryName: string): Promise<string | null> {
    try {
      const { SUPPORTED_COUNTRIES } = await import('./constants');
      const country = SUPPORTED_COUNTRIES.find(c => 
        c.name.toLowerCase() === countryName.toLowerCase()
      );
      return country ? country.code : null;
    } catch (error) {
      console.warn('국가명을 국가코드로 변환 실패:', error);
      return null;
    }
  }

  /**
   * 국가코드를 국가명으로 변환
   */
  private async getCountryNameFromCode(countryCode: string): Promise<string | null> {
    try {
      const { SUPPORTED_COUNTRIES } = await import('./constants');
      const country = SUPPORTED_COUNTRIES.find(c => 
        c.code.toLowerCase() === countryCode.toLowerCase()
      );
      return country ? country.name : null;
    } catch (error) {
      console.warn('국가코드를 국가명으로 변환 실패:', error);
      return null;
    }
  }

  /**
   * 지연 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 싱글톤 인스턴스 (기존 시스템과의 호환성을 위해)
let hybridCacheInstance: HybridCacheService | null = null;

/**
 * 하이브리드 캐시 인스턴스 가져오기
 */
export function getHybridCache(options?: HybridCacheOptions): HybridCacheService {
  if (!hybridCacheInstance) {
    hybridCacheInstance = new HybridCacheService(options);
  }
  return hybridCacheInstance;
}

/**
 * 기존 AI 콘텐츠 생성 시스템과의 호환성을 위한 래퍼 함수들
 */

/**
 * 캐시된 설명 조회 (기존 함수명 유지)
 */
export async function getCachedDescription(
  holidayName: string,
  countryName: string,
  locale: string = 'ko'
): Promise<CachedContent | null> {
  const cache = getHybridCache();
  return await cache.getDescription(holidayName, countryName, locale);
}

/**
 * 캐시에 설명 저장 (기존 함수명 유지)
 */
export async function setCachedDescription(
  holidayId: string,
  holidayName: string,
  countryName: string,
  locale: string,
  description: string,
  confidence: number
): Promise<void> {
  const cache = getHybridCache();
  const data: CachedContent = {
    holidayId,
    holidayName,
    countryName,
    locale,
    description,
    confidence,
    generatedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  };
  
  await cache.setDescription(data);
  
  // 저장 후 캐시 통계 초기화하여 다음 조회 시 최신 데이터 반영
  cache.resetStats();
}

/**
 * 특정 항목의 캐시를 무효화하는 함수
 */
export async function invalidateCachedDescription(
  holidayName: string,
  countryName: string,
  locale: string = 'ko'
): Promise<void> {
  const cache = getHybridCache();
  
  try {
    // 로컬 캐시에서 해당 항목 제거
    const localCacheService = (cache as any).localCacheService;
    
    if (localCacheService && typeof localCacheService.loadCache === 'function') {
      const cacheKey = `${holidayName}-${countryName}-${locale}`;
      const cacheData = await localCacheService.loadCache();
      
      if (cacheData && cacheData[cacheKey]) {
        delete cacheData[cacheKey];
        
        if (typeof localCacheService.saveCache === 'function') {
          await localCacheService.saveCache(cacheData);
          console.log(`✅ 로컬 캐시 무효화: ${cacheKey}`);
        }
      }
    }
    
    // 캐시 통계 초기화 (다음 조회 시 Supabase에서 최신 데이터 가져오도록)
    if (typeof cache.resetStats === 'function') {
      cache.resetStats();
    }
    
  } catch (error) {
    console.warn('⚠️ 캐시 무효화 실패:', error);
    // 캐시 무효화 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * 캐시 상태 확인
 */
export async function getCacheStatus(): Promise<{
  hybrid: CacheStats;
  local: { totalEntries: number; lastModified: string | null };
}> {
  const cache = getHybridCache();
  const hybridStats = cache.getStats();
  const localStats = await cache.getLocalCacheStats();
  
  return {
    hybrid: hybridStats,
    local: localStats
  };
}