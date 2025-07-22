import { promises as fs } from 'fs';
import path from 'path';
import { Holiday, Country } from '@/types';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';
import { logError, logWarning, logInfo } from './error-logger';

interface HolidayDataFile {
  countryCode: string;
  year: number;
  totalHolidays: number;
  lastUpdated: string;
  holidays: Holiday[];
}

/**
 * 특정 국가와 연도의 공휴일 데이터를 로드합니다.
 * 요구사항 6.3: 데이터가 없으면 적절한 메시지와 함께 빈 배열 반환
 */
export async function loadHolidayData(
  countryCode: string, 
  year: number
): Promise<Holiday[]> {
  try {
    logInfo(`공휴일 데이터 로드 시작: ${countryCode}-${year}`);
    
    const dataPath = path.join(
      process.cwd(), 
      'data', 
      'holidays', 
      `${countryCode.toLowerCase()}-${year}.json`
    );
    
    // 파일 존재 여부 확인
    try {
      await fs.access(dataPath);
    } catch {
      // 요구사항 6.3: 데이터가 없는 경우 로그 기록
      logWarning(`공휴일 데이터 파일 없음: ${countryCode}-${year}`, {
        countryCode,
        year,
        dataPath
      });
      return [];
    }
    
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const data: HolidayDataFile = JSON.parse(fileContent);
    
    // 데이터 유효성 검증
    if (!data.holidays || !Array.isArray(data.holidays)) {
      logWarning(`공휴일 데이터 형식 오류: ${countryCode}-${year}`, {
        countryCode,
        year,
        dataStructure: Object.keys(data)
      });
      return [];
    }
    
    logInfo(`공휴일 데이터 로드 완료: ${countryCode}-${year} - ${data.holidays.length}개`);
    return data.holidays;
    
  } catch (error) {
    logError(error as Error, {
      operation: 'loadHolidayData',
      countryCode,
      year
    });
    return [];
  }
}

/**
 * 특정 국가 데이터를 로드합니다.
 */
export async function loadCountryData(countryCode: string): Promise<Country | null> {
  try {
    logInfo(`국가 데이터 로드 시작: ${countryCode}`);
    
    // SUPPORTED_COUNTRIES에서 국가 정보 찾기
    const country = SUPPORTED_COUNTRIES.find(c => 
      c.code.toLowerCase() === countryCode.toLowerCase()
    );
    
    if (!country) {
      logWarning(`지원하지 않는 국가 코드: ${countryCode}`, {
        countryCode,
        supportedCountries: SUPPORTED_COUNTRIES.map(c => c.code)
      });
      return null;
    }
    
    logInfo(`국가 데이터 로드 완료: ${country.name} (${country.code})`);
    return country;
  } catch (error) {
    logError(error as Error, {
      operation: 'loadCountryData',
      countryCode
    });
    return null;
  }
}

/**
 * 특정 국가의 사용 가능한 연도 목록을 가져옵니다.
 */
export async function getAvailableYears(countryCode: string): Promise<number[]> {
  try {
    logInfo(`사용 가능한 연도 조회 시작: ${countryCode}`);
    
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    
    // 디렉토리 존재 여부 확인
    try {
      await fs.access(holidaysDir);
    } catch {
      logWarning(`공휴일 데이터 디렉토리 없음: ${holidaysDir}`, {
        countryCode,
        holidaysDir
      });
      return [];
    }
    
    const files = await fs.readdir(holidaysDir);
    
    const years = files
      .filter(file => file.startsWith(`${countryCode.toLowerCase()}-`) && file.endsWith('.json'))
      .map(file => {
        const match = file.match(/-(\d{4})\.json$/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((year): year is number => year !== null)
      .sort((a, b) => b - a); // 최신 연도부터 정렬
    
    logInfo(`사용 가능한 연도 조회 완료: ${countryCode} - ${years.length}개 연도`);
    return years;
  } catch (error) {
    logError(error as Error, {
      operation: 'getAvailableYears',
      countryCode
    });
    return [];
  }
}

/**
 * 모든 국가의 사용 가능한 데이터를 확인합니다.
 */
export async function getAllAvailableData(): Promise<Record<string, number[]>> {
  try {
    logInfo('전체 사용 가능한 데이터 조회 시작');
    
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    
    // 디렉토리 존재 여부 확인
    try {
      await fs.access(holidaysDir);
    } catch {
      logWarning(`공휴일 데이터 디렉토리 없음: ${holidaysDir}`, {
        holidaysDir
      });
      return {};
    }
    
    const files = await fs.readdir(holidaysDir);
    const dataMap: Record<string, number[]> = {};
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const match = file.match(/^([a-z]{2})-(\d{4})\.json$/);
      if (match) {
        const [, countryCode, yearStr] = match;
        const year = parseInt(yearStr);
        
        if (!dataMap[countryCode.toUpperCase()]) {
          dataMap[countryCode.toUpperCase()] = [];
        }
        dataMap[countryCode.toUpperCase()].push(year);
      }
    }
    
    // 각 국가의 연도를 정렬
    Object.keys(dataMap).forEach(country => {
      dataMap[country].sort((a, b) => b - a);
    });
    
    const totalCountries = Object.keys(dataMap).length;
    const totalFiles = Object.values(dataMap).reduce((sum, years) => sum + years.length, 0);
    
    logInfo(`전체 사용 가능한 데이터 조회 완료: ${totalCountries}개 국가, ${totalFiles}개 파일`);
    return dataMap;
  } catch (error) {
    logError(error as Error, {
      operation: 'getAllAvailableData'
    });
    return {};
  }
}

/**
 * 특정 월의 모든 공휴일을 가져옵니다.
 */
export async function getHolidaysByMonth(year: number, month: number): Promise<Holiday[]> {
  try {
    logInfo(`월별 공휴일 조회 시작: ${year}-${month + 1}`);
    
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    
    // 디렉토리 존재 여부 확인
    try {
      await fs.access(holidaysDir);
    } catch {
      logWarning(`공휴일 데이터 디렉토리 없음: ${holidaysDir}`, {
        year,
        month,
        holidaysDir
      });
      return [];
    }
    
    const files = await fs.readdir(holidaysDir);
    const holidays: Holiday[] = [];
    let processedFiles = 0;
    let errorFiles = 0;
    
    // 해당 연도의 파일들만 필터링
    const yearFiles = files.filter(file => 
      file.endsWith('.json') && file.includes(`-${year}.json`)
    );
    
    for (const file of yearFiles) {
      try {
        const filePath = path.join(holidaysDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: HolidayDataFile = JSON.parse(fileContent);
        
        // 데이터 유효성 검증
        if (!data.holidays || !Array.isArray(data.holidays)) {
          logWarning(`파일 데이터 형식 오류: ${file}`, {
            year,
            month,
            file,
            dataStructure: Object.keys(data)
          });
          errorFiles++;
          continue;
        }
        
        // 해당 월의 공휴일만 필터링
        const monthHolidays = data.holidays.filter(holiday => {
          const holidayDate = new Date(holiday.date);
          return holidayDate.getFullYear() === year && holidayDate.getMonth() === month;
        });
        
        holidays.push(...monthHolidays);
        processedFiles++;
        
      } catch (error) {
        logError(error as Error, {
          operation: 'getHolidaysByMonth - file processing',
          year,
          month,
          file
        });
        errorFiles++;
      }
    }
    
    // 날짜순으로 정렬
    holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    logInfo(`월별 공휴일 조회 완료: ${year}-${month + 1} - ${holidays.length}개 공휴일 (${processedFiles}개 파일 처리, ${errorFiles}개 파일 오류)`);
    return holidays;
    
  } catch (error) {
    logError(error as Error, {
      operation: 'getHolidaysByMonth',
      year,
      month
    });
    return [];
  }
}

/**
 * 특정 날짜의 공휴일을 모든 국가에서 찾습니다.
 * 요구사항 5.2: 오늘 공휴일이 없으면 빈 배열 반환
 */
export async function getHolidaysByDate(date: string): Promise<Holiday[]> {
  try {
    logInfo(`특정 날짜 공휴일 조회 시작: ${date}`);
    
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    
    // 디렉토리 존재 여부 확인
    try {
      await fs.access(holidaysDir);
    } catch {
      logWarning(`공휴일 데이터 디렉토리 없음: ${holidaysDir}`, {
        date,
        holidaysDir
      });
      return [];
    }
    
    const files = await fs.readdir(holidaysDir);
    const holidays: Holiday[] = [];
    let processedFiles = 0;
    let errorFiles = 0;
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(holidaysDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: HolidayDataFile = JSON.parse(fileContent);
        
        // 데이터 유효성 검증
        if (!data.holidays || !Array.isArray(data.holidays)) {
          logWarning(`파일 데이터 형식 오류: ${file}`, {
            date,
            file,
            dataStructure: Object.keys(data)
          });
          errorFiles++;
          continue;
        }
        
        const matchingHolidays = data.holidays.filter(holiday => holiday.date === date);
        holidays.push(...matchingHolidays);
        processedFiles++;
        
      } catch (error) {
        logError(error as Error, {
          operation: 'getHolidaysByDate - file processing',
          date,
          file
        });
        errorFiles++;
      }
    }
    
    logInfo(`특정 날짜 공휴일 조회 완료: ${date} - ${holidays.length}개 공휴일 (${processedFiles}개 파일 처리, ${errorFiles}개 파일 오류)`);
    return holidays;
    
  } catch (error) {
    logError(error as Error, {
      operation: 'getHolidaysByDate',
      date
    });
    return [];
  }
}