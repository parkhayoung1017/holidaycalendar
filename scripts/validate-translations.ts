#!/usr/bin/env tsx

/**
 * 번역 파일 검증 스크립트
 * 모든 번역 키가 올바르게 설정되어 있는지 확인합니다.
 */

import { loadTranslationsSync } from '../src/lib/translation-loader';
import { translateKey } from '../src/lib/translation-utils';

// 필수 번역 키 목록
const REQUIRED_KEYS = [
  'home.title',
  'home.subtitle',
  'home.popularCountries',
  'home.searchPlaceholder',
  'time.year',
  'time.month',
  'time.day',
  'actions.search',
  'actions.loading'
];

async function validateTranslations() {
  console.log('🔍 번역 파일 검증을 시작합니다...\n');

  const locales = ['ko', 'en'];
  let hasErrors = false;

  for (const locale of locales) {
    console.log(`📋 ${locale.toUpperCase()} 번역 검증 중...`);
    
    try {
      // 번역 데이터 로드
      const translations = loadTranslationsSync(locale);
      
      if (!translations || Object.keys(translations).length === 0) {
        console.error(`❌ ${locale} 번역 데이터를 로드할 수 없습니다.`);
        hasErrors = true;
        continue;
      }

      console.log(`✅ ${locale} 번역 데이터 로드 성공`);
      console.log(`   - 네임스페이스: ${Object.keys(translations).join(', ')}`);

      // 필수 키 검증
      const missingKeys: string[] = [];
      
      for (const key of REQUIRED_KEYS) {
        const translated = translateKey(translations, key, { fallback: null });
        
        if (!translated || translated === key) {
          missingKeys.push(key);
        } else {
          console.log(`   ✓ ${key}: "${translated}"`);
        }
      }

      if (missingKeys.length > 0) {
        console.error(`❌ ${locale}에서 누락된 번역 키:`);
        missingKeys.forEach(key => console.error(`   - ${key}`));
        hasErrors = true;
      } else {
        console.log(`✅ ${locale} 모든 필수 키 검증 완료`);
      }

    } catch (error) {
      console.error(`❌ ${locale} 번역 검증 중 오류:`, error);
      hasErrors = true;
    }

    console.log(''); // 빈 줄
  }

  if (hasErrors) {
    console.error('❌ 번역 검증에 실패했습니다.');
    process.exit(1);
  } else {
    console.log('🎉 모든 번역 검증이 완료되었습니다!');
  }
}

// 스크립트 실행
validateTranslations().catch(error => {
  console.error('스크립트 실행 중 오류:', error);
  process.exit(1);
});