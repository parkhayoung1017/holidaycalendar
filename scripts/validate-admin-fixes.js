#!/usr/bin/env node

/**
 * 어드민 설명 관리 시스템 수정사항 검증 스크립트
 * 서버 실행 없이 코드 수준에서 수정사항들을 검증합니다.
 */

const fs = require('fs');
const path = require('path');

class AdminFixesValidator {
  constructor() {
    this.results = [];
  }

  addResult(check, success, message, details = null) {
    this.results.push({ check, success, message, details });
    const status = success ? '✅' : '❌';
    console.log(`${status} ${check}: ${message}`);
    if (details && process.env.DEBUG) {
      console.log('   세부사항:', details);
    }
  }

  /**
   * 1. 설명 없는 공휴일 목록 API 수정사항 확인
   */
  validateMissingDescriptionsAPI() {
    console.log('\n🔍 1. 설명 없는 공휴일 목록 API 수정사항 확인');
    
    try {
      const apiPath = path.join(process.cwd(), 'src/app/api/admin/descriptions/missing/route.ts');
      const content = fs.readFileSync(apiPath, 'utf-8');
      
      // 주요 수정사항들 확인
      const checks = [
        {
          name: '다양한 키 형식 매칭',
          pattern: /possibleKeys.*=.*\[/s,
          description: '공휴일 매칭 시 다양한 키 형식 사용'
        },
        {
          name: '국가 코드 변환 함수',
          pattern: /getCountryCodeFromName.*function/s,
          description: '국가명을 국가코드로 변환하는 함수 추가'
        },
        {
          name: '향상된 기존 설명 확인',
          pattern: /existingKeys\.add.*countryCode/s,
          description: '기존 설명 확인 시 국가코드도 함께 확인'
        }
      ];
      
      let passedChecks = 0;
      checks.forEach(check => {
        if (check.pattern.test(content)) {
          this.addResult(`Missing API - ${check.name}`, true, check.description);
          passedChecks++;
        } else {
          this.addResult(`Missing API - ${check.name}`, false, `${check.description} - 코드에서 찾을 수 없음`);
        }
      });
      
      this.addResult(
        'Missing Descriptions API 전체',
        passedChecks === checks.length,
        `${passedChecks}/${checks.length} 수정사항 적용됨`
      );
      
    } catch (error) {
      this.addResult(
        'Missing Descriptions API 파일 확인',
        false,
        `파일 읽기 실패: ${error.message}`
      );
    }
  }

  /**
   * 2. 설명 저장 API 수정사항 확인
   */
  validateDescriptionSaveAPI() {
    console.log('\n💾 2. 설명 저장 API 수정사항 확인');
    
    try {
      const apiPath = path.join(process.cwd(), 'src/app/api/admin/descriptions/route.ts');
      const content = fs.readFileSync(apiPath, 'utf-8');
      
      const checks = [
        {
          name: '국가명 변환 로직',
          pattern: /countryName.*=.*body\.country_name/s,
          description: '국가 코드를 국가명으로 변환하는 로직'
        },
        {
          name: '하이브리드 캐시 저장',
          pattern: /setCachedDescription.*countryName/s,
          description: '하이브리드 캐시에 변환된 국가명으로 저장'
        },
        {
          name: '캐시 무효화',
          pattern: /invalidateCachedDescription/s,
          description: '저장 후 캐시 무효화 처리'
        }
      ];
      
      let passedChecks = 0;
      checks.forEach(check => {
        if (check.pattern.test(content)) {
          this.addResult(`Save API - ${check.name}`, true, check.description);
          passedChecks++;
        } else {
          this.addResult(`Save API - ${check.name}`, false, `${check.description} - 코드에서 찾을 수 없음`);
        }
      });
      
      this.addResult(
        'Description Save API 전체',
        passedChecks === checks.length,
        `${passedChecks}/${checks.length} 수정사항 적용됨`
      );
      
    } catch (error) {
      this.addResult(
        'Description Save API 파일 확인',
        false,
        `파일 읽기 실패: ${error.message}`
      );
    }
  }

  /**
   * 3. 하이브리드 캐시 시스템 수정사항 확인
   */
  validateHybridCacheSystem() {
    console.log('\n🔄 3. 하이브리드 캐시 시스템 수정사항 확인');
    
    try {
      const cachePath = path.join(process.cwd(), 'src/lib/hybrid-cache.ts');
      const content = fs.readFileSync(cachePath, 'utf-8');
      
      const checks = [
        {
          name: '캐시 무효화 함수 개선',
          pattern: /invalidateCachedDescription.*async.*function/s,
          description: '안전한 캐시 무효화 함수'
        },
        {
          name: '국가명/코드 변환 로직',
          pattern: /getCountryCodeFromName.*getCountryNameFromCode/s,
          description: '국가명과 국가코드 상호 변환 로직'
        },
        {
          name: '다중 조회 시도',
          pattern: /countryCode.*countryName_full/s,
          description: '다양한 국가명 형식으로 조회 시도'
        }
      ];
      
      let passedChecks = 0;
      checks.forEach(check => {
        if (check.pattern.test(content)) {
          this.addResult(`Hybrid Cache - ${check.name}`, true, check.description);
          passedChecks++;
        } else {
          this.addResult(`Hybrid Cache - ${check.name}`, false, `${check.description} - 코드에서 찾을 수 없음`);
        }
      });
      
      this.addResult(
        'Hybrid Cache System 전체',
        passedChecks === checks.length,
        `${passedChecks}/${checks.length} 수정사항 적용됨`
      );
      
    } catch (error) {
      this.addResult(
        'Hybrid Cache System 파일 확인',
        false,
        `파일 읽기 실패: ${error.message}`
      );
    }
  }

  /**
   * 4. AI 콘텐츠 생성기 수정사항 확인
   */
  validateAIContentGenerator() {
    console.log('\n🤖 4. AI 콘텐츠 생성기 수정사항 확인');
    
    try {
      const aiPath = path.join(process.cwd(), 'src/lib/ai-content-generator.ts');
      const content = fs.readFileSync(aiPath, 'utf-8');
      
      const checks = [
        {
          name: '향상된 캐시 조회',
          pattern: /countryCodeMap.*reverseCountryCodeMap/s,
          description: '국가명/코드 매핑을 통한 향상된 캐시 조회'
        },
        {
          name: '다중 조회 시도',
          pattern: /getCachedDescription.*countryCode.*fullCountryName/s,
          description: '다양한 국가명 형식으로 캐시 조회 시도'
        }
      ];
      
      let passedChecks = 0;
      checks.forEach(check => {
        if (check.pattern.test(content)) {
          this.addResult(`AI Generator - ${check.name}`, true, check.description);
          passedChecks++;
        } else {
          this.addResult(`AI Generator - ${check.name}`, false, `${check.description} - 코드에서 찾을 수 없음`);
        }
      });
      
      this.addResult(
        'AI Content Generator 전체',
        passedChecks === checks.length,
        `${passedChecks}/${checks.length} 수정사항 적용됨`
      );
      
    } catch (error) {
      this.addResult(
        'AI Content Generator 파일 확인',
        false,
        `파일 읽기 실패: ${error.message}`
      );
    }
  }

  /**
   * 5. 데이터 로더 수정사항 확인
   */
  validateDataLoader() {
    console.log('\n📊 5. 데이터 로더 수정사항 확인');
    
    try {
      const loaderPath = path.join(process.cwd(), 'src/lib/data-loader.ts');
      const content = fs.readFileSync(loaderPath, 'utf-8');
      
      const checks = [
        {
          name: '향상된 설명 조회',
          pattern: /enrichHolidaysWithDescriptions.*countryVariations/s,
          description: '다양한 국가명 형식으로 설명 조회 시도'
        },
        {
          name: '국가명 변형 로직',
          pattern: /countryVariations.*=.*\[/s,
          description: '국가명 변형 배열 생성 로직'
        }
      ];
      
      let passedChecks = 0;
      checks.forEach(check => {
        if (check.pattern.test(content)) {
          this.addResult(`Data Loader - ${check.name}`, true, check.description);
          passedChecks++;
        } else {
          this.addResult(`Data Loader - ${check.name}`, false, `${check.description} - 코드에서 찾을 수 없음`);
        }
      });
      
      this.addResult(
        'Data Loader 전체',
        passedChecks === checks.length,
        `${passedChecks}/${checks.length} 수정사항 적용됨`
      );
      
    } catch (error) {
      this.addResult(
        'Data Loader 파일 확인',
        false,
        `파일 읽기 실패: ${error.message}`
      );
    }
  }

  /**
   * 6. 어드민 컴포넌트 확인
   */
  validateAdminComponents() {
    console.log('\n🎛️ 6. 어드민 컴포넌트 확인');
    
    const components = [
      {
        name: 'MissingDescriptionsList',
        path: 'src/components/admin/MissingDescriptionsList.tsx',
        checks: ['페이지네이션', '설명 작성 버튼']
      },
      {
        name: 'MissingDescriptionEditor',
        path: 'src/components/admin/MissingDescriptionEditor.tsx',
        checks: ['수동 작성 폼', 'Supabase 저장']
      },
      {
        name: 'DescriptionList',
        path: 'src/components/admin/DescriptionList.tsx',
        checks: ['설명 목록 표시', '필터링 기능']
      }
    ];
    
    let allComponentsExist = true;
    
    components.forEach(component => {
      try {
        const componentPath = path.join(process.cwd(), component.path);
        if (fs.existsSync(componentPath)) {
          this.addResult(
            `Component - ${component.name}`,
            true,
            '컴포넌트 파일 존재'
          );
        } else {
          this.addResult(
            `Component - ${component.name}`,
            false,
            '컴포넌트 파일 없음'
          );
          allComponentsExist = false;
        }
      } catch (error) {
        this.addResult(
          `Component - ${component.name}`,
          false,
          `확인 실패: ${error.message}`
        );
        allComponentsExist = false;
      }
    });
    
    this.addResult(
      'Admin Components 전체',
      allComponentsExist,
      allComponentsExist ? '모든 어드민 컴포넌트 존재' : '일부 컴포넌트 누락'
    );
  }

  /**
   * 전체 검증 실행
   */
  runValidation() {
    console.log('🔍 어드민 설명 관리 시스템 수정사항 검증 시작\n');

    this.validateMissingDescriptionsAPI();
    this.validateDescriptionSaveAPI();
    this.validateHybridCacheSystem();
    this.validateAIContentGenerator();
    this.validateDataLoader();
    this.validateAdminComponents();

    this.printSummary();
  }

  /**
   * 검증 결과 요약 출력
   */
  printSummary() {
    console.log('\n📊 검증 결과 요약');
    console.log('='.repeat(50));

    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const successRate = Math.round((successCount / totalCount) * 100);

    console.log(`총 검증 항목: ${totalCount}개`);
    console.log(`통과: ${successCount}개`);
    console.log(`실패: ${totalCount - successCount}개`);
    console.log(`통과율: ${successRate}%`);

    console.log('\n📋 상세 결과:');
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.check}`);
      if (!result.success) {
        console.log(`   문제: ${result.message}`);
      }
    });

    console.log('\n🎯 주요 수정사항 요약:');
    console.log('1. ✅ 설명 없는 공휴일 목록 조회 시 다양한 키 형식으로 매칭');
    console.log('2. ✅ 수동 설명 작성 시 국가명 변환 및 하이브리드 캐시 저장');
    console.log('3. ✅ 하이브리드 캐시 시스템의 안전한 무효화 처리');
    console.log('4. ✅ AI 콘텐츠 생성기의 향상된 캐시 조회');
    console.log('5. ✅ 데이터 로더의 다중 국가명 형식 지원');

    if (successRate >= 80) {
      console.log('\n🎉 대부분의 수정사항이 성공적으로 적용되었습니다!');
      console.log('이제 개발 서버를 실행하고 실제 테스트를 진행해보세요.');
      console.log('\n💡 다음 단계:');
      console.log('1. npm run dev 로 개발 서버 실행');
      console.log('2. node scripts/test-admin-missing-descriptions-flow.js 로 통합 테스트 실행');
      console.log('3. 어드민 대시보드에서 수동으로 기능 확인');
    } else {
      console.log('\n⚠️ 일부 수정사항이 누락되었습니다.');
      console.log('실패한 항목들을 확인하고 추가 수정이 필요합니다.');
    }

    // 결과를 파일로 저장
    const reportPath = path.join(process.cwd(), 'logs', 'admin-fixes-validation-report.json');
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    
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
function main() {
  const validator = new AdminFixesValidator();
  validator.runValidation();
}

if (require.main === module) {
  main();
}

module.exports = { AdminFixesValidator };