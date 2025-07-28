import { promises as fs } from 'fs';
import path from 'path';
import { Holiday } from '@/types';
import { SUPPORTED_COUNTRIES, SUPPORTED_YEARS } from '@/lib/constants';
import { TranslationValidator, ValidationResult as TranslationValidationResult } from './translation-validator';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalCountries: number;
    totalYears: number;
    totalHolidays: number;
    missingData: Array<{ country: string; year: number }>;
  };
}

interface ComprehensiveValidationResult extends ValidationResult {
  translationResult?: TranslationValidationResult;
  translationCompleteness?: {
    fileCompleteness: number;
    keyCompleteness: number;
    overallScore: number;
    recommendations: string[];
  };
}

interface HolidayDataFile {
  countryCode: string;
  year: number;
  totalHolidays: number;
  lastUpdated: string;
  holidays: Holiday[];
}

/**
 * 빌드 시 모든 데이터 파일과 번역 파일의 유효성을 검증합니다.
 */
export async function validateBuildData(includeTranslations: boolean = true): Promise<ComprehensiveValidationResult> {
  const result: ComprehensiveValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalCountries: 0,
      totalYears: 0,
      totalHolidays: 0,
      missingData: []
    }
  };

  try {
    // 1. 공휴일 데이터 검증
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    
    // 디렉토리 존재 확인
    try {
      await fs.access(holidaysDir);
    } catch {
      result.errors.push('공휴일 데이터 디렉토리가 존재하지 않습니다.');
      result.isValid = false;
      return result;
    }

    const files = await fs.readdir(holidaysDir);
    const dataFiles = files.filter(file => file.endsWith('.json'));
    
    if (dataFiles.length === 0) {
      result.errors.push('공휴일 데이터 파일이 없습니다.');
      result.isValid = false;
      return result;
    }

    const processedCountries = new Set<string>();
    const processedYears = new Set<number>();
    let totalHolidays = 0;

    // 각 데이터 파일 검증
    for (const file of dataFiles) {
      const filePath = path.join(holidaysDir, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: HolidayDataFile = JSON.parse(fileContent);
        
        // 파일 구조 검증
        const fileValidation = validateDataFile(data, file);
        if (!fileValidation.isValid) {
          result.errors.push(...fileValidation.errors);
          result.warnings.push(...fileValidation.warnings);
          result.isValid = false;
        }
        
        // 통계 업데이트
        processedCountries.add(data.countryCode);
        processedYears.add(data.year);
        totalHolidays += data.holidays?.length || 0;
        
      } catch (error) {
        result.errors.push(`파일 ${file} 파싱 실패: ${error}`);
        result.isValid = false;
      }
    }

    // 누락된 데이터 확인
    const missingData = findMissingData(processedCountries, processedYears);
    result.stats.missingData = missingData;
    
    if (missingData.length > 0) {
      result.warnings.push(`${missingData.length}개의 국가/연도 조합 데이터가 누락되었습니다.`);
    }

    // 통계 설정
    result.stats.totalCountries = processedCountries.size;
    result.stats.totalYears = processedYears.size;
    result.stats.totalHolidays = totalHolidays;

    // 최소 데이터 요구사항 확인
    if (processedCountries.size < 5) {
      result.warnings.push('최소 5개 국가의 데이터가 권장됩니다.');
    }

    if (processedYears.size < 3) {
      result.warnings.push('최소 3개 연도의 데이터가 권장됩니다.');
    }

    // 2. 번역 파일 검증 (옵션)
    if (includeTranslations) {
      try {
        const translationValidator = new TranslationValidator();
        const translationResult = await translationValidator.validateAll();
        
        result.translationResult = translationResult;
        result.translationCompleteness = translationValidator.calculateCompleteness(translationResult);
        
        // 번역 오류를 전체 결과에 반영
        if (!translationResult.isValid) {
          result.isValid = false;
          result.errors.push(...translationResult.errors.map(e => `번역: ${e.message}`));
        }
        
        // 번역 경고를 전체 결과에 반영
        result.warnings.push(...translationResult.warnings.map(w => `번역: ${w.message}`));
        
        // 번역 완성도가 낮은 경우 경고 추가
        if (result.translationCompleteness.overallScore < 90) {
          result.warnings.push(`번역 완성도가 낮습니다 (${Math.round(result.translationCompleteness.overallScore)}%)`);
        }
        
      } catch (error) {
        result.errors.push(`번역 검증 중 오류 발생: ${error}`);
        result.isValid = false;
      }
    }

  } catch (error) {
    result.errors.push(`데이터 검증 중 오류 발생: ${error}`);
    result.isValid = false;
  }

  return result;
}

/**
 * 개별 데이터 파일의 유효성을 검증합니다.
 */
function validateDataFile(data: HolidayDataFile, filename: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: { totalCountries: 0, totalYears: 0, totalHolidays: 0, missingData: [] }
  };

  // 필수 필드 확인
  if (!data.countryCode) {
    result.errors.push(`${filename}: countryCode 필드가 누락되었습니다.`);
    result.isValid = false;
  }

  if (!data.year) {
    result.errors.push(`${filename}: year 필드가 누락되었습니다.`);
    result.isValid = false;
  }

  if (!Array.isArray(data.holidays)) {
    result.errors.push(`${filename}: holidays 필드가 배열이 아닙니다.`);
    result.isValid = false;
  }

  // 국가 코드 유효성 확인
  if (data.countryCode) {
    const countryExists = SUPPORTED_COUNTRIES.some(c => c.code === data.countryCode);
    if (!countryExists) {
      result.warnings.push(`${filename}: 지원하지 않는 국가 코드입니다 (${data.countryCode}).`);
    }
  }

  // 연도 유효성 확인
  if (data.year) {
    const currentYear = new Date().getFullYear();
    if (data.year < 2020 || data.year > currentYear + 5) {
      result.warnings.push(`${filename}: 비정상적인 연도입니다 (${data.year}).`);
    }
  }

  // 공휴일 데이터 검증
  if (Array.isArray(data.holidays)) {
    data.holidays.forEach((holiday, index) => {
      const holidayValidation = validateHoliday(holiday, `${filename}[${index}]`);
      if (!holidayValidation.isValid) {
        result.errors.push(...holidayValidation.errors);
        result.warnings.push(...holidayValidation.warnings);
        result.isValid = false;
      }
    });

    // 총 공휴일 수 확인
    if (data.totalHolidays !== data.holidays.length) {
      result.warnings.push(`${filename}: totalHolidays와 실제 공휴일 수가 일치하지 않습니다.`);
    }

    // 공휴일 수가 너무 적거나 많은 경우
    if (data.holidays.length === 0) {
      result.warnings.push(`${filename}: 공휴일 데이터가 없습니다.`);
    } else if (data.holidays.length > 50) {
      result.warnings.push(`${filename}: 공휴일 수가 비정상적으로 많습니다 (${data.holidays.length}개).`);
    }
  }

  return result;
}

/**
 * 개별 공휴일 데이터의 유효성을 검증합니다.
 */
function validateHoliday(holiday: Holiday, context: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: { totalCountries: 0, totalYears: 0, totalHolidays: 0, missingData: [] }
  };

  // 필수 필드 확인
  if (!holiday.name) {
    result.errors.push(`${context}: name 필드가 누락되었습니다.`);
    result.isValid = false;
  }

  if (!holiday.date) {
    result.errors.push(`${context}: date 필드가 누락되었습니다.`);
    result.isValid = false;
  }

  if (!holiday.countryCode) {
    result.errors.push(`${context}: countryCode 필드가 누락되었습니다.`);
    result.isValid = false;
  }

  // country 필드는 선택사항 (빈 문자열일 수 있음)
  // countryCode가 있으면 충분함

  // 날짜 형식 확인
  if (holiday.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(holiday.date)) {
      result.errors.push(`${context}: 잘못된 날짜 형식입니다 (${holiday.date}).`);
      result.isValid = false;
    } else {
      // 유효한 날짜인지 확인
      const date = new Date(holiday.date);
      if (isNaN(date.getTime())) {
        result.errors.push(`${context}: 유효하지 않은 날짜입니다 (${holiday.date}).`);
        result.isValid = false;
      }
    }
  }

  // 공휴일 타입 확인
  if (holiday.type && !['public', 'bank', 'school', 'optional'].includes(holiday.type)) {
    result.warnings.push(`${context}: 알 수 없는 공휴일 타입입니다 (${holiday.type}).`);
  }

  return result;
}

/**
 * 누락된 국가/연도 조합을 찾습니다.
 */
function findMissingData(
  processedCountries: Set<string>, 
  processedYears: Set<number>
): Array<{ country: string; year: number }> {
  const missingData: Array<{ country: string; year: number }> = [];
  const currentYear = new Date().getFullYear();
  const targetYears = [currentYear - 1, currentYear, currentYear + 1];

  // 인기 국가들의 최근 3년 데이터 확인
  const popularCountries = SUPPORTED_COUNTRIES.filter(c => c.popular);
  
  for (const country of popularCountries) {
    for (const year of targetYears) {
      if (!processedCountries.has(country.code) || !processedYears.has(year)) {
        missingData.push({ country: country.code, year });
      }
    }
  }

  return missingData;
}

/**
 * 검증 결과를 콘솔에 출력합니다.
 */
export function logValidationResult(result: ValidationResult): void;
export function logValidationResult(result: ComprehensiveValidationResult): void;
export function logValidationResult(result: ValidationResult | ComprehensiveValidationResult): void {
  console.log('\n=== 빌드 데이터 검증 결과 ===');
  
  if (result.isValid) {
    console.log('✅ 모든 데이터가 유효합니다.');
  } else {
    console.log('❌ 데이터 검증 실패');
  }

  console.log('\n📊 통계:');
  console.log(`- 총 국가 수: ${result.stats.totalCountries}`);
  console.log(`- 총 연도 수: ${result.stats.totalYears}`);
  console.log(`- 총 공휴일 수: ${result.stats.totalHolidays}`);
  console.log(`- 누락된 데이터: ${result.stats.missingData.length}개`);

  // 번역 검증 결과가 있는 경우 출력
  const comprehensiveResult = result as ComprehensiveValidationResult;
  if (comprehensiveResult.translationResult && comprehensiveResult.translationCompleteness) {
    console.log('\n🌐 번역 통계:');
    console.log(`- 번역 파일 완성도: ${Math.round(comprehensiveResult.translationCompleteness.fileCompleteness)}%`);
    console.log(`- 번역 키 완성도: ${Math.round(comprehensiveResult.translationCompleteness.keyCompleteness)}%`);
    console.log(`- 전체 번역 점수: ${Math.round(comprehensiveResult.translationCompleteness.overallScore)}%`);
    console.log(`- 번역 오류: ${comprehensiveResult.translationResult.errors.length}개`);
    console.log(`- 번역 경고: ${comprehensiveResult.translationResult.warnings.length}개`);
  }

  if (result.errors.length > 0) {
    console.log('\n🚨 오류:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  경고:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (result.stats.missingData.length > 0) {
    console.log('\n📋 누락된 데이터:');
    result.stats.missingData.slice(0, 10).forEach(missing => {
      console.log(`  - ${missing.country} ${missing.year}`);
    });
    if (result.stats.missingData.length > 10) {
      console.log(`  ... 및 ${result.stats.missingData.length - 10}개 더`);
    }
  }

  // 번역 권장사항 출력
  if (comprehensiveResult.translationCompleteness?.recommendations.length > 0) {
    console.log('\n💡 번역 권장사항:');
    comprehensiveResult.translationCompleteness.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
  }

  console.log('\n');
}