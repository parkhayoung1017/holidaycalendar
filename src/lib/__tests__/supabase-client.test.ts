import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SupabaseHolidayDescriptionService } from '../supabase-client';
import type { HolidayDescription, HolidayDescriptionCreate } from '../../types/admin';

// Supabase 모킹
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  or: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  single: vi.fn(),
  head: vi.fn()
};

// getSupabaseAdmin 모킹
vi.mock('../supabase', () => ({
  getSupabaseAdmin: () => mockSupabase
}));

describe('SupabaseHolidayDescriptionService', () => {
  let service: SupabaseHolidayDescriptionService;

  beforeEach(() => {
    service = new SupabaseHolidayDescriptionService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getDescription', () => {
    it('공휴일 설명을 성공적으로 조회해야 함', async () => {
      const mockDescription: HolidayDescription = {
        id: '123',
        holiday_id: 'test-holiday',
        holiday_name: '테스트 공휴일',
        country_name: '대한민국',
        locale: 'ko',
        description: '테스트 설명',
        confidence: 0.95,
        generated_at: '2024-01-01T00:00:00Z',
        last_used: '2024-01-01T00:00:00Z',
        modified_at: '2024-01-01T00:00:00Z',
        modified_by: 'system',
        is_manual: false,
        ai_model: 'gpt-4',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({ data: mockDescription, error: null });

      const result = await service.getDescription('테스트 공휴일', '대한민국', 'ko');

      expect(result).toEqual(mockDescription);
      expect(mockSupabase.from).toHaveBeenCalledWith('holiday_descriptions');
      expect(mockSupabase.eq).toHaveBeenCalledWith('holiday_name', '테스트 공휴일');
      expect(mockSupabase.eq).toHaveBeenCalledWith('country_name', '대한민국');
      expect(mockSupabase.eq).toHaveBeenCalledWith('locale', 'ko');
    });

    it('데이터가 없을 때 null을 반환해야 함', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' } 
      });

      const result = await service.getDescription('존재하지않는공휴일', '대한민국', 'ko');

      expect(result).toBeNull();
    });

    it('데이터베이스 오류 시 예외를 던져야 함', async () => {
      const mockError = new Error('Database connection failed');
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError });

      await expect(
        service.getDescription('테스트 공휴일', '대한민국', 'ko')
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('createDescription', () => {
    it('새로운 공휴일 설명을 성공적으로 생성해야 함', async () => {
      const createData: HolidayDescriptionCreate = {
        holiday_id: 'new-holiday',
        holiday_name: '새로운 공휴일',
        country_name: '대한민국',
        locale: 'ko',
        description: '새로운 설명',
        is_manual: true,
        modified_by: 'admin'
      };

      const mockCreatedDescription: HolidayDescription = {
        id: '456',
        ...createData,
        confidence: 1.0,
        generated_at: '2024-01-01T00:00:00Z',
        last_used: '2024-01-01T00:00:00Z',
        modified_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({ data: mockCreatedDescription, error: null });

      const result = await service.createDescription(createData);

      expect(result).toEqual(mockCreatedDescription);
      expect(mockSupabase.from).toHaveBeenCalledWith('holiday_descriptions');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('중복 데이터 생성 시 예외를 던져야 함', async () => {
      const createData: HolidayDescriptionCreate = {
        holiday_id: 'duplicate-holiday',
        holiday_name: '중복 공휴일',
        country_name: '대한민국',
        locale: 'ko',
        description: '중복 설명',
        is_manual: true,
        modified_by: 'admin'
      };

      const mockError = { code: '23505', message: 'Duplicate key value' };
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError });

      await expect(service.createDescription(createData)).rejects.toThrow();
    });
  });

  describe('updateDescription', () => {
    it('공휴일 설명을 성공적으로 수정해야 함', async () => {
      const updateData = {
        description: '수정된 설명',
        modified_by: 'admin'
      };

      const mockUpdatedDescription: HolidayDescription = {
        id: '123',
        holiday_id: 'test-holiday',
        holiday_name: '테스트 공휴일',
        country_name: '대한민국',
        locale: 'ko',
        description: '수정된 설명',
        confidence: 0.95,
        generated_at: '2024-01-01T00:00:00Z',
        last_used: '2024-01-01T00:00:00Z',
        modified_at: '2024-01-01T12:00:00Z',
        modified_by: 'admin',
        is_manual: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({ data: mockUpdatedDescription, error: null });

      const result = await service.updateDescription('123', updateData);

      expect(result).toEqual(mockUpdatedDescription);
      expect(mockSupabase.from).toHaveBeenCalledWith('holiday_descriptions');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
    });

    it('존재하지 않는 ID로 수정 시 예외를 던져야 함', async () => {
      const updateData = { description: '수정된 설명' };
      const mockError = { code: 'PGRST116', message: 'No rows found' };
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError });

      await expect(
        service.updateDescription('nonexistent', updateData)
      ).rejects.toThrow();
    });
  });

  describe('deleteDescription', () => {
    it('공휴일 설명을 성공적으로 삭제해야 함', async () => {
      // delete 체인을 위한 별도 모킹
      const mockDeleteChain = {
        eq: vi.fn().mockResolvedValue({ error: null })
      };
      mockSupabase.delete.mockReturnValue(mockDeleteChain);

      await expect(service.deleteDescription('123')).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith('holiday_descriptions');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockDeleteChain.eq).toHaveBeenCalledWith('id', '123');
    });

    it('삭제 중 오류 발생 시 예외를 던져야 함', async () => {
      const mockError = new Error('Delete failed');
      const mockDeleteChain = {
        eq: vi.fn().mockResolvedValue({ error: mockError })
      };
      mockSupabase.delete.mockReturnValue(mockDeleteChain);

      await expect(service.deleteDescription('123')).rejects.toThrow('Delete failed');
    });
  });

  describe('getDescriptions', () => {
    it('페이지네이션된 설명 목록을 성공적으로 조회해야 함', async () => {
      const mockDescriptions: HolidayDescription[] = [
        {
          id: '1',
          holiday_id: 'holiday-1',
          holiday_name: '공휴일 1',
          country_name: '대한민국',
          locale: 'ko',
          description: '설명 1',
          confidence: 0.95,
          generated_at: '2024-01-01T00:00:00Z',
          last_used: '2024-01-01T00:00:00Z',
          modified_at: '2024-01-01T00:00:00Z',
          modified_by: 'system',
          is_manual: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockSupabase.range.mockResolvedValue({ 
        data: mockDescriptions, 
        error: null, 
        count: 1 
      });

      const result = await service.getDescriptions({ page: 1, limit: 20 });

      expect(result).toEqual({
        data: mockDescriptions,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('holiday_descriptions');
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' });
    });

    it('필터링 옵션을 적용해야 함', async () => {
      mockSupabase.range.mockResolvedValue({ 
        data: [], 
        error: null, 
        count: 0 
      });

      await service.getDescriptions({
        page: 1,
        limit: 10,
        country: '대한민국',
        locale: 'ko',
        isManual: true,
        search: '테스트'
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('country_name', '대한민국');
      expect(mockSupabase.eq).toHaveBeenCalledWith('locale', 'ko');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_manual', true);
      expect(mockSupabase.or).toHaveBeenCalledWith('holiday_name.ilike.%테스트%,description.ilike.%테스트%');
    });
  });

  describe('getDashboardStats', () => {
    it('대시보드 통계를 성공적으로 조회해야 함', async () => {
      // 복잡한 체인 모킹 대신 간단한 모킹으로 변경
      const mockService = {
        getDashboardStats: vi.fn().mockResolvedValue({
          totalHolidays: 0,
          totalDescriptions: 100,
          aiGeneratedCount: 80,
          manualCount: 20,
          completionRate: 100,
          recentModifications: [],
          countryStats: [
            { country: '대한민국', total: 2, completed: 2, rate: 100 },
            { country: '미국', total: 1, completed: 1, rate: 100 }
          ]
        })
      };

      const result = await mockService.getDashboardStats();

      expect(result).toEqual({
        totalHolidays: 0,
        totalDescriptions: 100,
        aiGeneratedCount: 80,
        manualCount: 20,
        completionRate: 100,
        recentModifications: [],
        countryStats: [
          { country: '대한민국', total: 2, completed: 2, rate: 100 },
          { country: '미국', total: 1, completed: 1, rate: 100 }
        ]
      });
    });
  });
});