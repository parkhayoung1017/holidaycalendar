#!/usr/bin/env tsx

/**
 * 로컬 AI 캐시 데이터를 Supabase로 마이그레이션하는 스크립트
 * 
 * 기능:
 * - 로컬 JSON 캐시에서 Supabase로 데이터 마이그레이션
 * - 데이터 무결성 검증
 * - 마이그레이션 진행 상황 로깅
 * - 오류 처리 및 롤백 기능
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

import { getSupabaseAdmin } from '../src/lib/supabase';
import { getEnvironmentConfig } from '../src/lib/env-config';

// 로컬 캐시 데이터 타입 정의
interface LocalCacheEntry {
  holidayId: string;
  holidayName: string;
  countryName: string;
  locale: string;
  description: string;
  confidence: number;
  generatedAt: string;
  lastUsed: string;
}

// 마이그레이션 결과 타입
interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
  duration: number;
}

// 마이그레이션 옵션
interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
  skipExisting?: boolean;
  rollbackOnError?: boolean;
  verbose?: boolean;
}

class CacheToSupabaseMigrator {
  private supabase = getSupabaseAdmin();
  private cacheFilePath = path.join(process.cwd(), 'data/ai-cache/holiday-descriptions.json');
  private backupFilePath = path.join(process.cwd(), 'data/ai-cache/migration-backup.json');
  private logFilePath = path.join(process.cwd(), 'logs/migration.log');
  
  constructor(private options: MigrationOptions = {}) {
    this.options = {
      dryRun: false,
      batchSize: 50,
      skipExisting: true,
      rollbackOnError: false,
      verbose: false,
      ...options
    };
  }

  /**
   * 마이그레이션 실행
   */
  async migrate(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      duration: 0
    };

    try {
      this.log('🚀 캐시 데이터 마이그레이션을 시작합니다...');
      
      // 환경 설정 검증
      await this.validateEnvironment();
      
      // 로컬 캐시 데이터 로드
      const cacheData = await this.loadCacheData();
      this.log(`📁 로컬 캐시에서 ${Object.keys(cacheData).length}개의 항목을 발견했습니다.`);
      
      // 데이터 변환
      const entries = this.transformCacheData(cacheData);
      this.log(`🔄 ${entries.length}개의 항목을 변환했습니다.`);
      
      // 백업 생성
      if (!this.options.dryRun) {
        await this.createBackup(cacheData);
      }
      
      // 배치 단위로 마이그레이션 실행
      const batches = this.createBatches(entries, this.options.batchSize!);
      this.log(`📦 ${batches.length}개의 배치로 나누어 처리합니다.`);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        this.log(`⏳ 배치 ${i + 1}/${batches.length} 처리 중... (${batch.length}개 항목)`);
        
        const batchResult = await this.processBatch(batch);
        result.success += batchResult.success;
        result.failed += batchResult.failed;
        result.skipped += batchResult.skipped;
        result.errors.push(...batchResult.errors);
        
        // 오류 발생 시 롤백 옵션 확인
        if (batchResult.failed > 0 && this.options.rollbackOnError) {
          this.log('❌ 오류 발생으로 인한 롤백을 시작합니다...');
          await this.rollback();
          throw new Error('마이그레이션 중 오류가 발생하여 롤백했습니다.');
        }
        
        // 배치 간 잠시 대기 (API 제한 방지)
        if (i < batches.length - 1) {
          await this.sleep(100);
        }
      }
      
      // 데이터 무결성 검증
      await this.validateMigration(entries.length);
      
      result.duration = Date.now() - startTime;
      this.logSummary(result);
      
      return result;
      
    } catch (error) {
      result.duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      result.errors.push(errorMessage);
      this.log(`💥 마이그레이션 실패: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 환경 설정 검증
   */
  private async validateEnvironment(): Promise<void> {
    try {
      const config = getEnvironmentConfig();
      
      if (!config.supabase.serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
      }
      
      // Supabase 연결 테스트
      const { error } = await this.supabase.from('holiday_descriptions').select('count').limit(1);
      if (error) {
        throw new Error(`Supabase 연결 실패: ${error.message}`);
      }
      
      this.log('✅ 환경 설정 검증 완료');
      
    } catch (error) {
      throw new Error(`환경 설정 검증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 로컬 캐시 데이터 로드
   */
  private async loadCacheData(): Promise<Record<string, LocalCacheEntry>> {
    try {
      const fileContent = await fs.readFile(this.cacheFilePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // 데이터 구조 검증
      if (typeof data !== 'object' || data === null) {
        throw new Error('캐시 파일 형식이 올바르지 않습니다.');
      }
      
      return data;
      
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`캐시 파일을 찾을 수 없습니다: ${this.cacheFilePath}`);
      }
      throw error;
    }
  }

  /**
   * 캐시 데이터를 Supabase 형식으로 변환
   */
  private transformCacheData(cacheData: Record<string, LocalCacheEntry>): Array<any> {
    const entries: Array<any> = [];
    
    for (const [key, entry] of Object.entries(cacheData)) {
      try {
        // 데이터 검증
        if (!entry.holidayName || !entry.countryName || !entry.description) {
          this.log(`⚠️  필수 필드가 누락된 항목 건너뜀: ${key}`);
          continue;
        }
        
        const transformedEntry = {
          holiday_id: entry.holidayId || key,
          holiday_name: entry.holidayName,
          country_name: entry.countryName,
          locale: entry.locale || 'ko',
          description: entry.description,
          confidence: entry.confidence || 0.95,
          generated_at: entry.generatedAt ? new Date(entry.generatedAt).toISOString() : new Date().toISOString(),
          last_used: entry.lastUsed ? new Date(entry.lastUsed).toISOString() : new Date().toISOString(),
          modified_at: new Date().toISOString(),
          modified_by: 'migration_script',
          is_manual: false,
          ai_model: 'openai-gpt', // 기본값
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        entries.push(transformedEntry);
        
      } catch (error) {
        this.log(`⚠️  항목 변환 실패: ${key} - ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }
    
    return entries;
  }

  /**
   * 백업 생성
   */
  private async createBackup(data: Record<string, LocalCacheEntry>): Promise<void> {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        originalData: data,
        metadata: {
          totalEntries: Object.keys(data).length,
          migrationVersion: '1.0.0'
        }
      };
      
      await fs.writeFile(this.backupFilePath, JSON.stringify(backupData, null, 2));
      this.log(`💾 백업 파일 생성: ${this.backupFilePath}`);
      
    } catch (error) {
      throw new Error(`백업 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 배치 생성
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 배치 처리
   */
  private async processBatch(batch: Array<any>): Promise<{
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
  }> {
    const result = { success: 0, failed: 0, skipped: 0, errors: [] };
    
    if (this.options.dryRun) {
      this.log(`🔍 [DRY RUN] ${batch.length}개 항목 처리 시뮬레이션`);
      result.success = batch.length;
      return result;
    }
    
    for (const entry of batch) {
      try {
        // 기존 데이터 확인
        if (this.options.skipExisting) {
          const { data: existing } = await this.supabase
            .from('holiday_descriptions')
            .select('id')
            .eq('holiday_name', entry.holiday_name)
            .eq('country_name', entry.country_name)
            .eq('locale', entry.locale)
            .single();
          
          if (existing) {
            result.skipped++;
            if (this.options.verbose) {
              this.log(`⏭️  이미 존재하는 항목 건너뜀: ${entry.holiday_name} (${entry.country_name})`);
            }
            continue;
          }
        }
        
        // 데이터 삽입
        const { error } = await this.supabase
          .from('holiday_descriptions')
          .insert(entry);
        
        if (error) {
          throw error;
        }
        
        result.success++;
        if (this.options.verbose) {
          this.log(`✅ 성공: ${entry.holiday_name} (${entry.country_name})`);
        }
        
      } catch (error) {
        result.failed++;
        const errorMessage = `${entry.holiday_name} (${entry.country_name}): ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        result.errors.push(errorMessage);
        this.log(`❌ 실패: ${errorMessage}`);
      }
    }
    
    return result;
  }

  /**
   * 마이그레이션 검증
   */
  private async validateMigration(expectedCount: number): Promise<void> {
    try {
      const { count, error } = await this.supabase
        .from('holiday_descriptions')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      this.log(`🔍 데이터 무결성 검증: 예상 ${expectedCount}개, 실제 ${count}개`);
      
      // 샘플 데이터 검증
      const { data: sampleData, error: sampleError } = await this.supabase
        .from('holiday_descriptions')
        .select('*')
        .limit(5);
      
      if (sampleError) {
        throw sampleError;
      }
      
      if (sampleData && sampleData.length > 0) {
        this.log('✅ 샘플 데이터 검증 완료');
      }
      
    } catch (error) {
      throw new Error(`데이터 무결성 검증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 롤백 실행
   */
  private async rollback(): Promise<void> {
    try {
      this.log('🔄 롤백을 시작합니다...');
      
      // 마이그레이션으로 추가된 데이터 삭제
      const { error } = await this.supabase
        .from('holiday_descriptions')
        .delete()
        .eq('modified_by', 'migration_script');
      
      if (error) {
        throw error;
      }
      
      this.log('✅ 롤백 완료');
      
    } catch (error) {
      throw new Error(`롤백 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 로그 출력 및 파일 저장
   */
  private async log(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    
    try {
      // 로그 디렉토리 생성
      await fs.mkdir(path.dirname(this.logFilePath), { recursive: true });
      
      // 로그 파일에 추가
      await fs.appendFile(this.logFilePath, logMessage + '\n');
    } catch (error) {
      // 로그 파일 쓰기 실패는 치명적이지 않음
      console.warn('로그 파일 쓰기 실패:', error);
    }
  }

  /**
   * 마이그레이션 결과 요약 출력
   */
  private logSummary(result: MigrationResult): void {
    const durationSeconds = (result.duration / 1000).toFixed(2);
    
    this.log('\n📊 마이그레이션 결과 요약:');
    this.log(`   ✅ 성공: ${result.success}개`);
    this.log(`   ❌ 실패: ${result.failed}개`);
    this.log(`   ⏭️  건너뜀: ${result.skipped}개`);
    this.log(`   ⏱️  소요 시간: ${durationSeconds}초`);
    
    if (result.errors.length > 0) {
      this.log('\n❌ 오류 목록:');
      result.errors.forEach((error, index) => {
        this.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (result.failed === 0) {
      this.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!');
    } else {
      this.log('\n⚠️  일부 항목에서 오류가 발생했습니다. 로그를 확인해주세요.');
    }
  }

  /**
   * 지연 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * CLI 실행 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {};
  
  // 명령행 인수 파싱
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]) || 50;
        break;
      case '--no-skip-existing':
        options.skipExisting = false;
        break;
      case '--rollback-on-error':
        options.rollbackOnError = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
사용법: tsx scripts/migrate-cache-to-supabase.ts [옵션]

옵션:
  --dry-run              실제 마이그레이션 없이 시뮬레이션만 실행
  --batch-size <숫자>    배치 크기 설정 (기본값: 50)
  --no-skip-existing     기존 데이터가 있어도 덮어쓰기
  --rollback-on-error    오류 발생 시 자동 롤백
  --verbose              상세한 로그 출력
  --help                 도움말 표시

예시:
  tsx scripts/migrate-cache-to-supabase.ts --dry-run --verbose
  tsx scripts/migrate-cache-to-supabase.ts --batch-size 100 --rollback-on-error
        `);
        process.exit(0);
        break;
    }
  }
  
  try {
    const migrator = new CacheToSupabaseMigrator(options);
    const result = await migrator.migrate();
    
    process.exit(result.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 마이그레이션 실행 실패:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

export { CacheToSupabaseMigrator, type MigrationResult, type MigrationOptions };