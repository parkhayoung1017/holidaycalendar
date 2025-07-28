import fs from 'fs';
import path from 'path';

/**
 * 번역 파일 검증을 위한 유틸리티 클래스
 */
export class TranslationValidator {
  private localesDir: string;
  private supportedLocales: string[];
  private translationFiles: string[];

  constructor(localesDir: string = 'src/locales', supportedLocales: string[] = ['ko', 'en']) {
    this.localesDir = localesDir;
    this.supportedLocales = supportedLocales;
    this.translationFiles = ['common.json', 'navigation.json', 'holidays.json', 'countries.json'];
  }

  /**
   * 모든 번역 파일을 검증합니다
   */
  async validateAll(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalFiles: 0,
        validFiles: 0,
        missingFiles: 0,
        missingKeys: 0,
        extraKeys: 0
      }
    };

    // 각 번역 파일에 대해 검증 수행
    for (const fileName of this.translationFiles) {
      const fileResult = await this.validateTranslationFile(fileName);
      
      result.summary.totalFiles += fileResult.summary.totalFiles;
      result.summary.validFiles += fileResult.summary.validFiles;
      result.summary.missingFiles += fileResult.summary.missingFiles;
      result.summary.missingKeys += fileResult.summary.missingKeys;
      result.summary.extraKeys += fileResult.summary.extraKeys;
      
      result.errors.push(...fileResult.errors);
      result.warnings.push(...fileResult.warnings);
      
      if (!fileResult.isValid) {
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * 특정 번역 파일을 검증합니다
   */
  async validateTranslationFile(fileName: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalFiles: this.supportedLocales.length,
        validFiles: 0,
        missingFiles: 0,
        missingKeys: 0,
        extraKeys: 0
      }
    };

    const translations: Record<string, any> = {};
    const filePaths: Record<string, string> = {};

    // 각 언어별 번역 파일 로드
    for (const locale of this.supportedLocales) {
      const filePath = path.join(this.localesDir, locale, fileName);
      filePaths[locale] = filePath;

      if (!fs.existsSync(filePath)) {
        result.errors.push({
          type: 'missing-file',
          message: `번역 파일이 없습니다: ${filePath}`,
          file: filePath,
          locale
        });
        result.summary.missingFiles++;
        result.isValid = false;
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        translations[locale] = JSON.parse(content);
        result.summary.validFiles++;
      } catch (error) {
        result.errors.push({
          type: 'invalid-json',
          message: `JSON 파싱 오류: ${filePath} - ${error}`,
          file: filePath,
          locale
        });
        result.isValid = false;
      }
    }

    // 번역 키 일관성 검증
    if (Object.keys(translations).length > 1) {
      const keyValidation = this.validateTranslationKeys(translations, fileName);
      result.errors.push(...keyValidation.errors);
      result.warnings.push(...keyValidation.warnings);
      result.summary.missingKeys += keyValidation.summary.missingKeys;
      result.summary.extraKeys += keyValidation.summary.extraKeys;
      
      if (!keyValidation.isValid) {
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * 번역 키의 일관성을 검증합니다
   */
  private validateTranslationKeys(translations: Record<string, any>, fileName: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalFiles: 0,
        validFiles: 0,
        missingFiles: 0,
        missingKeys: 0,
        extraKeys: 0
      }
    };

    const locales = Object.keys(translations);
    const baseLocale = locales[0]; // 첫 번째 언어를 기준으로 사용
    const baseKeys = this.extractAllKeys(translations[baseLocale]);

    // 다른 언어들과 키 비교
    for (let i = 1; i < locales.length; i++) {
      const currentLocale = locales[i];
      const currentKeys = this.extractAllKeys(translations[currentLocale]);
      
      // 누락된 키 찾기
      const missingKeys = baseKeys.filter(key => !currentKeys.includes(key));
      for (const missingKey of missingKeys) {
        result.errors.push({
          type: 'missing-key',
          message: `번역 키가 누락됨: ${missingKey}`,
          file: fileName,
          locale: currentLocale,
          key: missingKey
        });
        result.summary.missingKeys++;
        result.isValid = false;
      }

      // 추가된 키 찾기
      const extraKeys = currentKeys.filter(key => !baseKeys.includes(key));
      for (const extraKey of extraKeys) {
        result.warnings.push({
          type: 'extra-key',
          message: `추가 번역 키 발견: ${extraKey}`,
          file: fileName,
          locale: currentLocale,
          key: extraKey
        });
        result.summary.extraKeys++;
      }

      // 빈 값 검증
      const emptyKeys = this.findEmptyValues(translations[currentLocale]);
      for (const emptyKey of emptyKeys) {
        result.warnings.push({
          type: 'empty-value',
          message: `빈 번역 값: ${emptyKey}`,
          file: fileName,
          locale: currentLocale,
          key: emptyKey
        });
      }
    }

    return result;
  }

  /**
   * 객체에서 모든 키를 추출합니다 (중첩된 객체 포함)
   */
  private extractAllKeys(obj: any, prefix: string = ''): string[] {
    const keys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...this.extractAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * 빈 값을 가진 키들을 찾습니다
   */
  private findEmptyValues(obj: any, prefix: string = ''): string[] {
    const emptyKeys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        emptyKeys.push(...this.findEmptyValues(obj[key], fullKey));
      } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
        emptyKeys.push(fullKey);
      }
    }
    
    return emptyKeys;
  }

  /**
   * 번역 완성도를 계산합니다
   */
  calculateCompleteness(validationResult: ValidationResult): TranslationCompleteness {
    const { summary } = validationResult;
    const totalExpectedFiles = this.supportedLocales.length * this.translationFiles.length;
    const totalExpectedKeys = summary.totalFiles > 0 ? 
      (summary.validFiles * 100) / summary.totalFiles : 0;

    return {
      fileCompleteness: totalExpectedFiles > 0 ? 
        ((totalExpectedFiles - summary.missingFiles) / totalExpectedFiles) * 100 : 0,
      keyCompleteness: summary.missingKeys > 0 ? 
        Math.max(0, 100 - (summary.missingKeys / (summary.missingKeys + 100)) * 100) : 100,
      overallScore: totalExpectedKeys,
      recommendations: this.generateRecommendations(validationResult)
    };
  }

  /**
   * 검증 결과를 바탕으로 권장사항을 생성합니다
   */
  private generateRecommendations(validationResult: ValidationResult): string[] {
    const recommendations: string[] = [];
    
    if (validationResult.summary.missingFiles > 0) {
      recommendations.push('누락된 번역 파일을 생성하세요.');
    }
    
    if (validationResult.summary.missingKeys > 0) {
      recommendations.push('누락된 번역 키를 추가하세요.');
    }
    
    if (validationResult.summary.extraKeys > 0) {
      recommendations.push('불필요한 번역 키를 정리하거나 다른 언어에도 추가하세요.');
    }
    
    if (validationResult.errors.some(e => e.type === 'invalid-json')) {
      recommendations.push('JSON 형식 오류를 수정하세요.');
    }
    
    if (validationResult.warnings.some(w => w.type === 'empty-value')) {
      recommendations.push('빈 번역 값을 채우세요.');
    }
    
    return recommendations;
  }
}

/**
 * 검증 결과 인터페이스
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  type: 'missing-file' | 'invalid-json' | 'missing-key';
  message: string;
  file: string;
  locale: string;
  key?: string;
}

export interface ValidationWarning {
  type: 'extra-key' | 'empty-value';
  message: string;
  file: string;
  locale: string;
  key?: string;
}

export interface ValidationSummary {
  totalFiles: number;
  validFiles: number;
  missingFiles: number;
  missingKeys: number;
  extraKeys: number;
}

export interface TranslationCompleteness {
  fileCompleteness: number;
  keyCompleteness: number;
  overallScore: number;
  recommendations: string[];
}