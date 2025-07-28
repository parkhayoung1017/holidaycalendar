#!/usr/bin/env node

/**
 * 빌드 전 데이터 검증 스크립트
 * 
 * 이 스크립트는 빌드 프로세스 전에 실행되어 모든 데이터 파일의 유효성을 검증합니다.
 * 검증 실패 시 빌드를 중단하여 잘못된 데이터로 인한 배포를 방지합니다.
 */

import { validateBuildData, logValidationResult } from '../src/lib/build-validator';

async function main() {
  console.log('🔍 빌드 데이터 및 번역 검증을 시작합니다...\n');
  
  try {
    // 번역 검증을 포함한 전체 검증 실행
    const includeTranslations = !process.argv.includes('--no-translations');
    const result = await validateBuildData(includeTranslations);
    
    // 검증 결과 출력
    logValidationResult(result);
    
    // 검증 실패 시 프로세스 종료
    if (!result.isValid) {
      console.error('❌ 데이터 또는 번역 검증 실패로 인해 빌드를 중단합니다.');
      process.exit(1);
    }
    
    // 번역 완성도가 너무 낮은 경우 경고
    if (result.translationCompleteness && result.translationCompleteness.overallScore < 70) {
      console.log('⚠️  번역 완성도가 낮습니다. 사용자 경험에 영향을 줄 수 있습니다.');
    }
    
    // 경고가 있지만 빌드는 계속 진행
    if (result.warnings.length > 0) {
      console.log('⚠️  경고가 있지만 빌드를 계속 진행합니다.');
    }
    
    console.log('✅ 데이터 및 번역 검증이 완료되었습니다. 빌드를 진행합니다.\n');
    
  } catch (error) {
    console.error('💥 검증 중 예상치 못한 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

export { main as validateBuildData };