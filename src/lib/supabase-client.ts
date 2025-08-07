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
 * Supabase를 통한 공휴일 설명 데이터 관리 서비스
 */
export class SupabaseHolidayDescriptionService {
  private supabase = getSupabaseAdmin();

  /**
   * 특정 공휴일 설명 조회
   */
  async getDescription(
    holidayName: string, 
    countryName: string, 
    locale: string = 'ko'
  ): Promise<HolidayDescription | null> {
    try {
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
          return null;
        }
        throw error;
      }

      // last_used 업데이트
      await this.updateLastUsed(data.id);

      return data;
    } catch (error) {
      console.error('공휴일 설명 조회 실패:', error);
      throw error;
    }
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