import { getSupabaseAdmin } from './supabase';
import type { 
  HolidayDescription, 
  AdminDashboardStats, 
  HolidayDescriptionCreate, 
  HolidayDescriptionUpdate 
} from '../types/admin';

// 페이지네이션 옵션 타입
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

// 필터링 옵션 타입
export interface FilterOptions {
  country?: string;
  countryName?: string;
  holidayName?: string;
  locale?: string;
  isManual?: boolean;
  search?: string;
}

// 페이지네이션된 응답 타입
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Supabase 서비스 인스턴스 생성 함수
 */
export function createSupabaseService(): SupabaseHolidayDescriptionService {
  return new SupabaseHolidayDescriptionService();
}

/**
 * Supabase를 통한 공휴일 설명 데이터 관리 서비스 (성능 최적화 버전)
 */
export class SupabaseHolidayDescriptionService {
  private supabase = getSupabaseAdmin();
  private connectionCache = new Map<string, boolean>();
  private lastConnectionCheck = 0;
  private readonly CONNECTION_CHECK_INTERVAL = 60000; // 1분

  /**
   * 특정 공휴일 설명 조회 (성능 최적화)
   */
  async getDescription(
    holidayName: string, 
    countryName: string, 
    locale: string = 'ko'
  ): Promise<HolidayDescription | null> {
    try {
      // 연결 상태 확인 (캐시된 결과 사용)
      if (!(await this.isConnectionHealthy())) {
        console.warn('Supabase 연결 불가, null 반환');
        return null;
      }

      console.log('🔍 Supabase 조회 시작:', { holidayName, countryName, locale });

      const { data, error } = await this.supabase
        .from('holiday_descriptions')
        .select('*')
        .eq('holiday_name', holidayName)
        .eq('country_name', countryName)
        .eq('locale', locale)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 데이터가 없는 경우
          console.log('📭 Supabase에서 데이터 없음:', { holidayName, countryName, locale });
          return null;
        }
        console.error('Supabase 조회 오류:', error);
        throw error;
      }

      console.log('✅ Supabase에서 데이터 발견:', {
        holidayName: data.holiday_name,
        isManual: data.is_manual,
        descriptionLength: data.description?.length || 0,
        confidence: data.confidence
      });

      // last_used 업데이트 (비동기로 처리하여 성능 영향 최소화)
      this.updateLastUsed(data.id).catch(error => 
        console.warn('last_used 업데이트 실패:', error)
      );

      return data;
    } catch (error) {
      console.error('공휴일 설명 조회 실패:', error);
      // 연결 오류 시 null 반환하여 로컬 캐시로 폴백 가능하게 함
      return null;
    }
  }

  /**
   * 여러 공휴일 설명 배치 조회 (성능 개선, 안전한 쿼리 방식)
   */
  async getDescriptionsBatch(requests: Array<{
    holidayName: string;
    countryName: string;
    locale?: string;
  }>): Promise<Array<HolidayDescription | null>> {
    if (requests.length === 0) {
      return [];
    }

    try {
      // 연결 상태 확인
      if (!(await this.isConnectionHealthy())) {
        throw new Error('Supabase 연결 불가');
      }

      // 배치 크기가 클 경우 개별 조회로 폴백
      if (requests.length > 20) {
        console.warn(`배치 크기가 큼 (${requests.length}개), 개별 조회로 폴백`);
        return await this.getDescriptionsBatchFallback(requests);
      }

      // 안전한 배치 쿼리: IN 조건 사용
      const results: Array<HolidayDescription | null> = [];
      
      // 고유한 국가별로 그룹화하여 쿼리 최적화
      const countryGroups = new Map<string, Array<{
        holidayName: string;
        countryName: string;
        locale: string;
        index: number;
      }>>();

      requests.forEach((req, index) => {
        const locale = req.locale || 'ko';
        const key = `${req.countryName}-${locale}`;
        if (!countryGroups.has(key)) {
          countryGroups.set(key, []);
        }
        countryGroups.get(key)!.push({
          holidayName: req.holidayName,
          countryName: req.countryName,
          locale,
          index
        });
      });

      // 결과 배열 초기화
      for (let i = 0; i < requests.length; i++) {
        results[i] = null;
      }

      // 국가별로 배치 쿼리 실행
      for (const [, group] of countryGroups) {
        if (group.length === 0) continue;

        const countryName = group[0].countryName;
        const locale = group[0].locale;
        const holidayNames = group.map(item => item.holidayName);

        try {
          const { data, error } = await this.supabase
            .from('holiday_descriptions')
            .select('*')
            .eq('country_name', countryName)
            .eq('locale', locale)
            .in('holiday_name', holidayNames);

          if (error) {
            console.warn(`국가별 배치 쿼리 실패 (${countryName}):`, error);
            // 이 국가의 항목들을 개별 조회로 처리
            await this.handleCountryGroupFallback(group, results);
            continue;
          }

          // 결과 매핑
          group.forEach(item => {
            const found = data?.find(dbItem => 
              dbItem.holiday_name === item.holidayName &&
              dbItem.country_name === item.countryName &&
              dbItem.locale === item.locale
            );
            results[item.index] = found || null;
          });

        } catch (error) {
          console.warn(`국가별 배치 쿼리 예외 (${countryName}):`, error);
          await this.handleCountryGroupFallback(group, results);
        }
      }

      // 찾은 항목들의 last_used 업데이트 (비동기)
      const foundItems = results.filter(item => item !== null) as HolidayDescription[];
      if (foundItems.length > 0) {
        this.updateLastUsedBatch(foundItems.map(item => item.id)).catch(error =>
          console.warn('배치 last_used 업데이트 실패:', error)
        );
      }

      return results;
    } catch (error) {
      console.error('배치 공휴일 설명 조회 실패:', error);
      // 전체 실패 시 개별 조회로 폴백
      return await this.getDescriptionsBatchFallback(requests);
    }
  }

  /**
   * 국가 그룹 폴백 처리
   */
  private async handleCountryGroupFallback(
    group: Array<{
      holidayName: string;
      countryName: string;
      locale: string;
      index: number;
    }>,
    results: Array<HolidayDescription | null>
  ): Promise<void> {
    for (const item of group) {
      try {
        const result = await this.getDescription(
          item.holidayName,
          item.countryName,
          item.locale
        );
        results[item.index] = result;
      } catch (error) {
        console.warn(`개별 조회 실패: ${item.holidayName} (${item.countryName})`, error);
        results[item.index] = null;
      }
    }
  }

  /**
   * 배치 조회 폴백 (개별 조회)
   */
  private async getDescriptionsBatchFallback(requests: Array<{
    holidayName: string;
    countryName: string;
    locale?: string;
  }>): Promise<Array<HolidayDescription | null>> {
    const results: Array<HolidayDescription | null> = [];
    
    for (const request of requests) {
      try {
        const result = await this.getDescription(
          request.holidayName,
          request.countryName,
          request.locale || 'ko'
        );
        results.push(result);
      } catch (error) {
        console.warn(`개별 조회 폴백 실패: ${request.holidayName}`, error);
        results.push(null);
      }
    }
    
    return results;
  }

  /**
   * 새로운 공휴일 설명 생성
   */
  async createDescription(data: HolidayDescriptionCreate): Promise<HolidayDescription> {
    try {
      const { data: result, error } = await this.supabase
        .from('holiday_descriptions')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
          last_used: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    } catch (error) {
      console.error('공휴일 설명 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 공휴일 설명 수정
   */
  async updateDescription(id: string, data: Partial<HolidayDescription>): Promise<HolidayDescription> {
    try {
      const { data: result, error } = await this.supabase
        .from('holiday_descriptions')
        .update({
          ...data,
          modified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    } catch (error) {
      console.error('공휴일 설명 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 공휴일 설명 삭제
   */
  async deleteDescription(id: string): Promise<boolean> {
    try {
      const { error, count } = await this.supabase
        .from('holiday_descriptions')
        .delete()
        .eq('id', id)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('공휴일 설명 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 공휴일 설명 목록 조회 (페이지네이션 및 필터링 지원)
   */
  async getDescriptions(
    options: PaginationOptions & FilterOptions = {}
  ): Promise<PaginatedResponse<HolidayDescription>> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        country, 
        countryName,
        holidayName,
        locale, 
        isManual, 
        search 
      } = options;

      let query = this.supabase
        .from('holiday_descriptions')
        .select('*', { count: 'exact' });

      // 필터 적용
      if (country) {
        query = query.eq('country_name', country);
      }
      if (countryName) {
        query = query.eq('country_name', countryName);
      }
      if (holidayName) {
        query = query.eq('holiday_name', holidayName);
      }
      if (locale) {
        query = query.eq('locale', locale);
      }
      if (typeof isManual === 'boolean') {
        query = query.eq('is_manual', isManual);
      }
      if (search) {
        query = query.or(`holiday_name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // 페이지네이션 적용
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('modified_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: data || [],
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('공휴일 설명 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * ID로 특정 설명 조회
   */
  async getDescriptionById(id: string): Promise<HolidayDescription | null> {
    try {
      const { data, error } = await this.supabase
        .from('holiday_descriptions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 데이터가 없는 경우
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('ID로 설명 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 설명이 없는 공휴일 목록 조회
   * 실제 구현에서는 기존 공휴일 데이터와 비교하여 설명이 없는 항목을 찾아야 함
   */
  async getMissingDescriptions(): Promise<Array<{
    holiday_id: string;
    holiday_name: string;
    country_name: string;
  }>> {
    // TODO: 실제 구현에서는 기존 공휴일 데이터 소스와 비교 로직 필요
    // 현재는 빈 배열 반환
    return [];
  }

  /**
   * 대시보드 통계 데이터 조회
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      // 전체 설명 수
      const { count: totalDescriptions } = await this.supabase
        .from('holiday_descriptions')
        .select('*', { count: 'exact', head: true });

      // AI 생성 설명 수
      const { count: aiGeneratedCount } = await this.supabase
        .from('holiday_descriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_manual', false);

      // 수동 작성 설명 수
      const { count: manualCount } = await this.supabase
        .from('holiday_descriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_manual', true);

      // 최근 수정된 설명들
      const { data: recentModifications } = await this.supabase
        .from('holiday_descriptions')
        .select('*')
        .order('modified_at', { ascending: false })
        .limit(10);

      // 국가별 통계
      const { data: countryStatsData } = await this.supabase
        .from('holiday_descriptions')
        .select('country_name')
        .order('country_name');

      // 국가별 통계 계산
      const countryStats = this.calculateCountryStats(countryStatsData || []);

      const total = totalDescriptions || 0;
      const aiCount = aiGeneratedCount || 0;
      const manualCountValue = manualCount || 0;
      const completionRate = total > 0 ? ((aiCount + manualCountValue) / total) * 100 : 0;

      return {
        totalHolidays: 0, // TODO: 실제 공휴일 총 수 계산 필요
        totalDescriptions: total,
        aiGeneratedCount: aiCount,
        manualCount: manualCountValue,
        completionRate: Math.round(completionRate * 100) / 100,
        recentModifications: recentModifications || [],
        countryStats
      };
    } catch (error) {
      console.error('대시보드 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 로컬 캐시에서 Supabase로 데이터 마이그레이션
   */
  async migrateFromLocalCache(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    // TODO: 실제 마이그레이션 로직 구현 필요
    // 현재는 기본 응답 반환
    return {
      success: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * 연결 상태 확인 (캐시된 결과 사용)
   */
  private async isConnectionHealthy(): Promise<boolean> {
    const now = Date.now();
    
    // 캐시된 결과가 유효한 경우 재사용
    if (now - this.lastConnectionCheck < this.CONNECTION_CHECK_INTERVAL) {
      return this.connectionCache.get('healthy') || false;
    }

    try {
      // 간단한 쿼리로 연결 상태 확인
      const { error } = await this.supabase
        .from('holiday_descriptions')
        .select('id')
        .limit(1);
      
      const isHealthy = !error;
      this.connectionCache.set('healthy', isHealthy);
      this.lastConnectionCheck = now;
      
      return isHealthy;
    } catch (error) {
      this.connectionCache.set('healthy', false);
      this.lastConnectionCheck = now;
      return false;
    }
  }

  /**
   * last_used 필드 업데이트 (내부 사용)
   */
  private async updateLastUsed(id: string): Promise<void> {
    try {
      await this.supabase
        .from('holiday_descriptions')
        .update({ last_used: new Date().toISOString() })
        .eq('id', id);
    } catch (error) {
      // last_used 업데이트 실패는 치명적이지 않으므로 로그만 남김
      console.warn('last_used 업데이트 실패:', error);
    }
  }

  /**
   * 여러 항목의 last_used 필드 배치 업데이트 (내부 사용)
   */
  private async updateLastUsedBatch(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      const now = new Date().toISOString();
      
      // 배치 업데이트 (PostgreSQL의 ANY 연산자 사용)
      await this.supabase
        .from('holiday_descriptions')
        .update({ last_used: now })
        .in('id', ids);
        
    } catch (error) {
      // 배치 업데이트 실패는 치명적이지 않으므로 로그만 남김
      console.warn('배치 last_used 업데이트 실패:', error);
    }
  }

  /**
   * 국가별 통계 계산 (내부 사용)
   */
  private calculateCountryStats(data: Array<{ country_name: string }>): Array<{
    country: string;
    total: number;
    completed: number;
    rate: number;
  }> {
    const countryMap = new Map<string, number>();
    
    data.forEach(item => {
      const count = countryMap.get(item.country_name) || 0;
      countryMap.set(item.country_name, count + 1);
    });

    return Array.from(countryMap.entries()).map(([country, total]) => ({
      country,
      total,
      completed: total, // 현재는 모든 항목이 완료된 것으로 간주
      rate: 100
    }));
  }
}