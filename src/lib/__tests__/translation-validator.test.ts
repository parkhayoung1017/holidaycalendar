import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TranslationValidator } from '../translation-validator';
import fs from 'fs';
import path from 'path';

// 테스트용 임시 디렉토리 설정
const TEST_LOCALES_DIR = 'test-locales';
const TEST_LOCALES = ['ko', 'en'];

describe('TranslationValidator', () => {
  let validator: TranslationValidator;

  beforeEach(() => {
    // 테스트용 번역 파일 생성
    createTestTranslationFiles();
    validator = new TranslationValidator(TEST_LOCALES_DIR, TEST_LOCALES);
  });

  afterEach(() => {
    // 테스트 파일 정리
    cleanupTestFiles();
  });

  describe('validateAll', () => {
    it('모든 번역 파일이 유효한 경우 성공해야 함', async () => {
      const result = await validator.validateAll();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.validFiles).toBeGreaterThan(0);
    });

    it('번역 파일이 누락된 경우 오류를 반환해야 함', async () => {
      // 영어 common.json 파일 삭제
      const filePath = path.join(TEST_LOCALES_DIR, 'en', 'common.json');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const result = await validator.validateAll();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'missing-file')).toBe(true);
      expect(result.summary.missingFiles).toBeGreaterThan(0);
    });

    it('JSON 형식이 잘못된 경우 오류를 반환해야 함', async () => {
      // 잘못된 JSON 파일 생성
      const filePath = path.join(TEST_LOCALES_DIR, 'ko', 'common.json');
      fs.writeFileSync(filePath, '{ invalid json }');

      const result = await validator.validateAll();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'invalid-json')).toBe(true);
    });
  });

  describe('validateTranslationFile', () => {
    it('특정 번역 파일을 올바르게 검증해야 함', async () => {
      const result = await validator.validateTranslationFile('common.json');
      
      expect(result.isValid).toBe(true);
      expect(result.summary.validFiles).toBe(2); // ko, en
    });

    it('번역 키가 누락된 경우 오류를 반환해야 함', async () => {
      // 영어 파일에서 키 제거
      const enFilePath = path.join(TEST_LOCALES_DIR, 'en', 'common.json');
      const enData = {
        site: {
          title: 'World Holiday Calendar'
          // description 키 누락
        }
      };
      fs.writeFileSync(enFilePath, JSON.stringify(enData, null, 2));

      const result = await validator.validateTranslationFile('common.json');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'missing-key')).toBe(true);
      expect(result.summary.missingKeys).toBeGreaterThan(0);
    });

    it('추가 번역 키가 있는 경우 경고를 반환해야 함', async () => {
      // 영어 파일에 추가 키 삽입
      const enFilePath = path.join(TEST_LOCALES_DIR, 'en', 'common.json');
      const enData = {
        site: {
          title: 'World Holiday Calendar',
          description: 'Check worldwide holiday information',
          extraKey: 'Extra value' // 추가 키
        }
      };
      fs.writeFileSync(enFilePath, JSON.stringify(enData, null, 2));

      const result = await validator.validateTranslationFile('common.json');
      
      expect(result.warnings.some(w => w.type === 'extra-key')).toBe(true);
      expect(result.summary.extraKeys).toBeGreaterThan(0);
    });

    it('빈 번역 값이 있는 경우 경고를 반환해야 함', async () => {
      // 영어 파일에 빈 값 설정
      const enFilePath = path.join(TEST_LOCALES_DIR, 'en', 'common.json');
      const enData = {
        site: {
          title: '', // 빈 값
          description: 'Check worldwide holiday information'
        }
      };
      fs.writeFileSync(enFilePath, JSON.stringify(enData, null, 2));

      const result = await validator.validateTranslationFile('common.json');
      
      expect(result.warnings.some(w => w.type === 'empty-value')).toBe(true);
    });
  });

  describe('calculateCompleteness', () => {
    it('완벽한 번역의 경우 높은 점수를 반환해야 함', async () => {
      const validationResult = await validator.validateAll();
      const completeness = validator.calculateCompleteness(validationResult);
      
      expect(completeness.fileCompleteness).toBe(100);
      expect(completeness.keyCompleteness).toBe(100);
      expect(completeness.overallScore).toBeGreaterThan(90);
    });

    it('누락된 파일이 있는 경우 낮은 점수를 반환해야 함', async () => {
      // 파일 삭제
      const filePath = path.join(TEST_LOCALES_DIR, 'en', 'navigation.json');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const validationResult = await validator.validateAll();
      const completeness = validator.calculateCompleteness(validationResult);
      
      expect(completeness.fileCompleteness).toBeLessThan(100);
    });

    it('권장사항을 올바르게 생성해야 함', async () => {
      // 파일 삭제하여 권장사항 생성
      const filePath = path.join(TEST_LOCALES_DIR, 'en', 'common.json');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const validationResult = await validator.validateAll();
      const completeness = validator.calculateCompleteness(validationResult);
      
      expect(completeness.recommendations).toContain('누락된 번역 파일을 생성하세요.');
    });
  });
});

// 테스트용 번역 파일 생성 함수
function createTestTranslationFiles() {
  // 디렉토리 생성
  for (const locale of TEST_LOCALES) {
    const localeDir = path.join(TEST_LOCALES_DIR, locale);
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
    }
  }

  // 한국어 번역 파일
  const koCommon = {
    site: {
      title: '세계 공휴일 달력',
      description: '전세계 공휴일 정보를 한눈에 확인하세요'
    },
    actions: {
      search: '검색',
      viewMore: '더 보기'
    }
  };

  const koNavigation = {
    menu: {
      home: '홈',
      todayHolidays: '오늘의 공휴일'
    }
  };

  // 영어 번역 파일
  const enCommon = {
    site: {
      title: 'World Holiday Calendar',
      description: 'Check worldwide holiday information at a glance'
    },
    actions: {
      search: 'Search',
      viewMore: 'View More'
    }
  };

  const enNavigation = {
    menu: {
      home: 'Home',
      todayHolidays: "Today's Holidays"
    }
  };

  // 파일 작성
  fs.writeFileSync(
    path.join(TEST_LOCALES_DIR, 'ko', 'common.json'),
    JSON.stringify(koCommon, null, 2)
  );
  fs.writeFileSync(
    path.join(TEST_LOCALES_DIR, 'ko', 'navigation.json'),
    JSON.stringify(koNavigation, null, 2)
  );
  fs.writeFileSync(
    path.join(TEST_LOCALES_DIR, 'en', 'common.json'),
    JSON.stringify(enCommon, null, 2)
  );
  fs.writeFileSync(
    path.join(TEST_LOCALES_DIR, 'en', 'navigation.json'),
    JSON.stringify(enNavigation, null, 2)
  );

  // 빈 holidays.json과 countries.json 파일 생성
  const emptyFiles = ['holidays.json', 'countries.json'];
  for (const locale of TEST_LOCALES) {
    for (const fileName of emptyFiles) {
      fs.writeFileSync(
        path.join(TEST_LOCALES_DIR, locale, fileName),
        JSON.stringify({}, null, 2)
      );
    }
  }
}

// 테스트 파일 정리 함수
function cleanupTestFiles() {
  if (fs.existsSync(TEST_LOCALES_DIR)) {
    fs.rmSync(TEST_LOCALES_DIR, { recursive: true, force: true });
  }
}