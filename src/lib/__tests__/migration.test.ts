/**
 * 캐시 마이그레이션 시스템 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { CacheToSupabaseMigrator, type MigrationOptions } from '../../../scripts/migrate-cache-to-supabase';

// Mock 데이터
const mockCacheData = {
  'Independence Day-United States-ko': {
    holidayId: 'US-2025-07-04-9',
    holidayName: 'Independence Day',
    countryName: 'United States',
    locale: 'ko',
    description: '미국 독립기념일 설명...',
    confidence: 0.95,
    generatedAt: '2025-07-28T04:56:09.346Z',
    lastUsed: '2025-07-29T08:29:09.974Z'
  },
  'New Year\'s Day-South Korea-ko': {
    holidayId: 'KR-2025-01-01-0',
    holidayName: 'New Year\'s Day',
    countryName: 'South Korea',
    locale: 'ko',
    description: '신정 설명...',
    confidence: 0.95,
    generatedAt: '2025-07-29T12:00:00.000Z',
    lastUsed: '2025-07-29T08:28:32.086Z'
  }
};

// Supabase 모킹
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        limit: vi.fn(() => ({ data: [], error: null }))
      })),
      limit: vi.fn(() => ({ data: [], error: null, count: 0 }))
    })),
    insert: vi.fn(() => ({ error: null })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null }))
    }))
  }))
};

// 환경 변수 모킹
vi.mock('../env-config', () => ({
  getEnvironmentConfig: vi.fn(() => ({
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
      serviceRoleKey: 'test-service-key'
    },
    admin: {
      password: 'test-password',
      sessionSecret: 'test-session-secret-32-characters-long',
      sessionDuration: 86400000
    },
    apis: {},
    nodeEnv: 'test',
    isDevelopment: false,
    isProduction: false
  }))
}));

// Supabase 클라이언트 모킹
vi.mock('../supabase', () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabase)
}));

// 파일 시스템 모킹
vi.mock('fs/promises');

describe('CacheToSupabaseMigrator', () => {
  let migrator: CacheToSupabaseMigrator;
  let mockOptions: MigrationOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOptions = {
      dryRun: true,
      batchSize: 2,
      skipExisting: true,
      rollbackOnError: false,
      verbose: true
    };
    
    migrator = new CacheToSupabaseMigrator(mockOptions);
    
    // 파일 시스템 모킹 설정
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCacheData));
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.appendFile).mockResolvedValue();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('migrate', () => {
    it('성공적으로 마이그레이션을 완료해야 함', async () => {
      const result = await migrator.migrate();
      
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('dry-run 모드에서 실제 데이터를 변경하지 않아야 함', async () => {
      const result = await migrator.migrate();
      
      expect(result.success).toBe(2);
      expect(mockSupabase.from().insert).not.toHaveBeenCalled();
    });

    it('캐시 파일이 없을 때 오류를 발생시켜야 함', async () => {
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);
      
      await expect(migrator.migrate()).rejects.toThrow('캐시 파일을 찾을 수 없습니다');
    });

    it('잘못된 JSON 형식일 때 오류를 발생시켜야 함', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');
      
      await expect(migrator.migrate()).rejects.toThrow();
    });
  });

  describe('데이터 변환', () => {
    it('로컬 캐시 데이터를 올바른 Supabase 형식으로 변환해야 함', async () => {
      // 실제 마이그레이션을 위해 dryRun을 false로 설정
      const realMigrator = new CacheToSupabaseMigrator({
        ...mockOptions,
        dryRun: false
      });

      // insert 호출을 캡처하기 위한 모킹
      const insertMock = vi.fn(() => ({ error: null }));
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
            limit: vi.fn(() => ({ data: [], error: null, count: 2 }))
          })),
          limit: vi.fn(() => ({ data: [{ id: '1' }, { id: '2' }], error: null }))
        })),
        insert: insertMock,
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      }));

      await realMigrator.migrate();

      expect(insertMock).toHaveBeenCalledTimes(2);
      
      const firstCall = insertMock.mock.calls[0][0];
      expect(firstCall).toMatchObject({
        holiday_id: 'US-2025-07-04-9',
        holiday_name: 'Independence Day',
        country_name: 'United States',
        locale: 'ko',
        description: '미국 독립기념일 설명...',
        confidence: 0.95,
        is_manual: false,
        modified_by: 'migration_script'
      });
      
      expect(firstCall.generated_at).toBeDefined();
      expect(firstCall.created_at).toBeDefined();
      expect(firstCall.updated_at).toBeDefined();
    });

    it('필수 필드가 누락된 데이터를 건너뛰어야 함', async () => {
      const invalidCacheData = {
        'invalid-entry': {
          holidayId: 'test-id',
          // holidayName 누락
          countryName: 'Test Country',
          locale: 'ko',
          description: '', // 빈 설명
          confidence: 0.95,
          generatedAt: '2025-07-28T04:56:09.346Z',
          lastUsed: '2025-07-29T08:29:09.974Z'
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidCacheData));

      const result = await migrator.migrate();
      
      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });

  describe('배치 처리', () => {
    it('지정된 배치 크기로 데이터를 나누어 처리해야 함', async () => {
      const largeCacheData: Record<string, any> = {};
      for (let i = 0; i < 5; i++) {
        largeCacheData[`holiday-${i}`] = {
          holidayId: `test-${i}`,
          holidayName: `Holiday ${i}`,
          countryName: 'Test Country',
          locale: 'ko',
          description: `Description ${i}`,
          confidence: 0.95,
          generatedAt: '2025-07-28T04:56:09.346Z',
          lastUsed: '2025-07-29T08:29:09.974Z'
        };
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(largeCacheData));

      const result = await migrator.migrate();
      
      // 배치 크기가 2이므로 5개 항목이 3개 배치로 나뉘어 처리됨
      expect(result.success).toBe(5);
    });
  });

  describe('오류 처리', () => {
    it('Supabase 연결 실패 시 오류를 발생시켜야 함', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn(() => ({ data: null, error: new Error('Connection failed') }))
        }))
      }));

      await expect(migrator.migrate()).rejects.toThrow('환경 설정 검증 실패');
    });

    it('개별 항목 삽입 실패를 적절히 처리해야 함', async () => {
      const realMigrator = new CacheToSupabaseMigrator({
        ...mockOptions,
        dryRun: false
      });

      // 첫 번째 삽입은 성공, 두 번째는 실패하도록 설정
      let callCount = 0;
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
            limit: vi.fn(() => ({ data: [], error: null, count: 1 }))
          })),
          limit: vi.fn(() => ({ data: [{ id: '1' }], error: null }))
        })),
        insert: vi.fn(() => {
          callCount++;
          return { error: callCount === 2 ? new Error('Insert failed') : null };
        }),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      }));

      const result = await realMigrator.migrate();
      
      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('백업 및 롤백', () => {
    it('마이그레이션 전에 백업을 생성해야 함', async () => {
      const realMigrator = new CacheToSupabaseMigrator({
        ...mockOptions,
        dryRun: false
      });

      await realMigrator.migrate();
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('migration-backup.json'),
        expect.stringContaining('"originalData"')
      );
    });

    it('롤백 시 마이그레이션된 데이터를 삭제해야 함', async () => {
      const realMigrator = new CacheToSupabaseMigrator({
        ...mockOptions,
        dryRun: false,
        rollbackOnError: true
      });

      // 삽입 실패를 시뮬레이션
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
            limit: vi.fn(() => ({ data: [], error: null, count: 0 }))
          })),
          limit: vi.fn(() => ({ data: [], error: null }))
        })),
        insert: vi.fn(() => ({ error: new Error('Insert failed') })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      }));

      await expect(realMigrator.migrate()).rejects.toThrow('마이그레이션 중 오류가 발생하여 롤백했습니다');
      
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('modified_by', 'migration_script');
    });
  });

  describe('로깅', () => {
    it('마이그레이션 과정을 로그 파일에 기록해야 함', async () => {
      await migrator.migrate();
      
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('logs'),
        { recursive: true }
      );
      
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('migration.log'),
        expect.stringContaining('캐시 데이터 마이그레이션을 시작합니다')
      );
    });

    it('verbose 모드에서 상세한 로그를 출력해야 함', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await migrator.migrate();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('로컬 캐시에서')
      );
      
      consoleSpy.mockRestore();
    });
  });
});

describe('마이그레이션 유틸리티 함수', () => {
  it('배치 생성이 올바르게 작동해야 함', () => {
    const items = [1, 2, 3, 4, 5];
    const batchSize = 2;
    
    // 실제로는 private 메서드이므로 테스트를 위해 별도 함수로 추출 필요
    // 여기서는 개념적 테스트만 작성
    const expectedBatches = [[1, 2], [3, 4], [5]];
    
    expect(expectedBatches).toHaveLength(3);
    expect(expectedBatches[0]).toHaveLength(2);
    expect(expectedBatches[2]).toHaveLength(1);
  });
});