#!/usr/bin/env node

/**
 * 어드민 설명 없는 공휴일 관리 플로우 테스트 스크립트
 * 
 * 이 스크립트는 다음을 테스트합니다:
 * 1. 설명 없는 공휴일 목록 조회의 정확성
 * 2. 수동 설명 작성 후 Supabase 저장
 * 3. 웹사이트에서 설명 표시 확인
 * 4. 어드민 설명 관리 탭에서 표시 확인
 */

import { SupabaseHolidayDescriptionService } from '../src/lib/supabase-client';
import { getCachedDescription, setCachedDescription } from '../src/lib/hybrid-cache';
import fs from 'fs';
import path from 'path';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

class AdminMissingDescriptionsFlowTester {
  private results: TestResult[] = [];
  private supabaseService: SupabaseHolidayDescriptionService;

  constructor() {
    this.supabaseService = new SupabaseHolidayDescriptionService();
  }

  private addResult(step: string, success: boolean, message: string, data?: any) {
    this.results.push({ step, success, message, data });
    const status = success ? '✅' : '❌';
    console.log(`${status} ${step}: ${message}`);
    if (data && process.env.DEBUG) {
      console.log('   데이터:', JSON.stringify(data, null, 2));
    }
  }

  /**
   * 1단계: 설명 없는 공휴일 목록 조회 테스트
   */
  async testMissingDescriptionsList(): Promise<void> {
    console.log('\n🔍 1단계: 설명 없는 공휴일 목록 조회 테스트');
    
    try {
      // API 호출 시뮬레이션
      const response = await fetch('http://localhost:3000/api/admin/descriptions/missing?limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        this.addResult(
          '설명 없는 공휴일 목록 조회',
          true,
          `${result.data.length}개의 설명 없는 공휴일을 찾았습니다`,
          { 
            total: result.meta?.total || result.data.length,
            sample: result.data.slice(0, 3)
          }
        );
        
        // 첫 번째 항목을 테스트용으로 저장
        if (result.data.length > 0) {
          (this as any).testHoliday = result.data[0];
        }
      } else {
        this.addResult(
          '설명 없는 공휴일 목록 조회',
          false,
          result.error || '알 수 없는 오류'
        );
      }
    } catch (error) {
      this.addResult(
        '설명 없는 공휴일 목록 조회',
        false,
        `네트워크 오류: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * 2단계: 수동 설명 작성 및 저장 테스트
   */
  async testManualDescriptionCreation(): Promise<void> {
    console.log('\n✍️ 2단계: 수동 설명 작성 및 저장 테스트');
    
    const testHoliday = (this as any).testHoliday;
    if (!testHoliday) {
      this.addResult(
        '수동 설명 작성',
        false,
        '테스트할 공휴일이 없습니다'
      );
      return;
    }

    try {
      const testDescription = `${testHoliday.holiday_name}은 ${testHoliday.country_name}에서 기념하는 중요한 공휴일입니다. 이 날은 특별한 의미를 가지며, 국민들이 함께 축하하는 뜻깊은 시간입니다. [테스트 설명 - ${new Date().toISOString()}]`;

      const response = await fetch('http://localhost:3000/api/admin/descriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holiday_id: testHoliday.holiday_id,
          holiday_name: testHoliday.holiday_name,
          country_name: testHoliday.country_name,
          locale: 'ko',
          description: testDescription,
          modified_by: 'test_admin',
          is_manual: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.addResult(
          '수동 설명 작성 및 저장',
          true,
          '설명이 성공적으로 저장되었습니다',
          { holiday: testHoliday.holiday_name, country: testHoliday.country_name }
        );
        
        // 저장된 설명을 테스트용으로 보관
        (this as any).savedDescription = {
          holiday_name: testHoliday.holiday_name,
          country_name: testHoliday.country_name,
          description: testDescription
        };
      } else {
        this.addResult(
          '수동 설명 작성 및 저장',
          false,
          result.error || '저장 실패'
        );
      }
    } catch (error) {
      this.addResult(
        '수동 설명 작성 및 저장',
        false,
        `오류: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * 3단계: Supabase에서 저장된 설명 확인
   */
  async testSupabaseStorage(): Promise<void> {
    console.log('\n🗄️ 3단계: Supabase에서 저장된 설명 확인');
    
    const savedDescription = (this as any).savedDescription;
    if (!savedDescription) {
      this.addResult(
        'Supabase 저장 확인',
        false,
        '저장된 설명이 없습니다'
      );
      return;
    }

    try {
      // 잠시 대기 (저장 완료를 위해)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const description = await this.supabaseService.getDescription(
        savedDescription.holiday_name,
        savedDescription.country_name,
        'ko'
      );

      if (description) {
        this.addResult(
          'Supabase 저장 확인',
          true,
          'Supabase에서 설명을 성공적으로 조회했습니다',
          { 
            id: description.id,
            is_manual: description.is_manual,
            description_length: description.description.length
          }
        );
      } else {
        this.addResult(
          'Supabase 저장 확인',
          false,
          'Supabase에서 설명을 찾을 수 없습니다'
        );
      }
    } catch (error) {
      this.addResult(
        'Supabase 저장 확인',
        false,
        `Supabase 조회 오류: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * 4단계: 하이브리드 캐시에서 설명 조회 테스트
   */
  async testHybridCacheRetrieval(): Promise<void> {
    console.log('\n🔄 4단계: 하이브리드 캐시에서 설명 조회 테스트');
    
    const savedDescription = (this as any).savedDescription;
    if (!savedDescription) {
      this.addResult(
        '하이브리드 캐시 조회',
        false,
        '저장된 설명이 없습니다'
      );
      return;
    }

    try {
      const cachedDescription = await getCachedDescription(
        savedDescription.holiday_name,
        savedDescription.country_name,
        'ko'
      );

      if (cachedDescription && cachedDescription.description.includes('[테스트 설명')) {
        this.addResult(
          '하이브리드 캐시 조회',
          true,
          '하이브리드 캐시에서 설명을 성공적으로 조회했습니다',
          { 
            confidence: cachedDescription.confidence,
            description_preview: cachedDescription.description.substring(0, 100) + '...'
          }
        );
      } else {
        this.addResult(
          '하이브리드 캐시 조회',
          false,
          '하이브리드 캐시에서 설명을 찾을 수 없거나 내용이 일치하지 않습니다'
        );
      }
    } catch (error) {
      this.addResult(
        '하이브리드 캐시 조회',
        false,
        `하이브리드 캐시 조회 오류: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * 5단계: 어드민 설명 관리 탭에서 표시 확인
   */
  async testAdminDescriptionsList(): Promise<void> {
    console.log('\n📋 5단계: 어드민 설명 관리 탭에서 표시 확인');
    
    const savedDescription = (this as any).savedDescription;
    if (!savedDescription) {
      this.addResult(
        '어드민 설명 관리 탭 확인',
        false,
        '저장된 설명이 없습니다'
      );
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/admin/descriptions?search=${encodeURIComponent(savedDescription.holiday_name)}&isManual=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.descriptions && result.descriptions.length > 0) {
        const foundDescription = result.descriptions.find((desc: any) => 
          desc.holiday_name === savedDescription.holiday_name &&
          desc.country_name === savedDescription.country_name &&
          desc.is_manual === true
        );

        if (foundDescription) {
          this.addResult(
            '어드민 설명 관리 탭 확인',
            true,
            '어드민 설명 관리 탭에서 수동 작성 설명을 확인했습니다',
            { 
              id: foundDescription.id,
              is_manual: foundDescription.is_manual,
              modified_by: foundDescription.modified_by
            }
          );
        } else {
          this.addResult(
            '어드민 설명 관리 탭 확인',
            false,
            '어드민 설명 관리 탭에서 해당 설명을 찾을 수 없습니다'
          );
        }
      } else {
        this.addResult(
          '어드민 설명 관리 탭 확인',
          false,
          '어드민 설명 관리 탭에서 설명 목록을 가져올 수 없습니다'
        );
      }
    } catch (error) {
      this.addResult(
        '어드민 설명 관리 탭 확인',
        false,
        `API 호출 오류: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * 6단계: 설명 없는 공휴일 목록에서 제거 확인
   */
  async testMissingListUpdate(): Promise<void> {
    console.log('\n🔄 6단계: 설명 없는 공휴일 목록에서 제거 확인');
    
    const testHoliday = (this as any).testHoliday;
    if (!testHoliday) {
      this.addResult(
        '설명 없는 목록 업데이트 확인',
        false,
        '테스트할 공휴일이 없습니다'
      );
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/admin/descriptions/missing?country=${testHoliday.country_code}&year=${testHoliday.year}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const stillMissing = result.data.find((holiday: any) => 
          holiday.holiday_id === testHoliday.holiday_id
        );

        if (!stillMissing) {
          this.addResult(
            '설명 없는 목록 업데이트 확인',
            true,
            '설명을 작성한 공휴일이 설명 없는 목록에서 제거되었습니다'
          );
        } else {
          this.addResult(
            '설명 없는 목록 업데이트 확인',
            false,
            '설명을 작성했지만 여전히 설명 없는 목록에 나타납니다'
          );
        }
      } else {
        this.addResult(
          '설명 없는 목록 업데이트 확인',
          false,
          '설명 없는 공휴일 목록을 조회할 수 없습니다'
        );
      }
    } catch (error) {
      this.addResult(
        '설명 없는 목록 업데이트 확인',
        false,
        `API 호출 오류: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * 전체 테스트 실행
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 어드민 설명 없는 공휴일 관리 플로우 테스트 시작\n');

    await this.testMissingDescriptionsList();
    await this.testManualDescriptionCreation();
    await this.testSupabaseStorage();
    await this.testHybridCacheRetrieval();
    await this.testAdminDescriptionsList();
    await this.testMissingListUpdate();

    this.printSummary();
  }

  /**
   * 테스트 결과 요약 출력
   */
  private printSummary(): void {
    console.log('\n📊 테스트 결과 요약');
    console.log('='.repeat(50));

    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const successRate = Math.round((successCount / totalCount) * 100);

    console.log(`총 테스트: ${totalCount}개`);
    console.log(`성공: ${successCount}개`);
    console.log(`실패: ${totalCount - successCount}개`);
    console.log(`성공률: ${successRate}%`);

    console.log('\n📋 상세 결과:');
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.step}`);
      if (!result.success) {
        console.log(`   오류: ${result.message}`);
      }
    });

    if (successRate === 100) {
      console.log('\n🎉 모든 테스트가 성공했습니다!');
      console.log('어드민 설명 없는 공휴일 관리 플로우가 정상적으로 작동합니다.');
    } else {
      console.log('\n⚠️ 일부 테스트가 실패했습니다.');
      console.log('실패한 부분을 확인하고 수정이 필요합니다.');
    }

    // 결과를 파일로 저장
    const reportPath = path.join(process.cwd(), 'logs', 'admin-missing-descriptions-test-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: totalCount,
        success: successCount,
        failed: totalCount - successCount,
        successRate
      },
      results: this.results
    }, null, 2));

    console.log(`\n📄 상세 보고서가 저장되었습니다: ${reportPath}`);
  }
}

// 메인 실행
async function main() {
  const tester = new AdminMissingDescriptionsFlowTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ 테스트 실행 중 치명적 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main().catch(console.error);
}

export { AdminMissingDescriptionsFlowTester };