import { promises as fs } from 'fs';
import path from 'path';
import { Holiday, Country } from '@/types';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';

interface HolidayDataFile {
  countryCode: string;
  year: number;
  totalHolidays: number;
  lastUpdated: string;
  holidays: Holiday[];
}

/**
 * 특정 국가와 연도의 공휴일 데이터를 로드합니다.
 */
export async function loadHolidayData(
  countryCode: string, 
  year: number
): Promise<Holiday[]> {
  try {
    const dataPath = path.join(
      process.cwd(), 
      'data', 
      'holidays', 
      `${countryCode.toLowerCase()}-${year}.json`
    );
    
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const data: HolidayDataFile = JSON.parse(fileContent);
    
    return data.holidays || [];
  } catch (error) {
    console.error(`Failed to load holiday data for ${countryCode}-${year}:`, error);
    return [];
  }
}

/**
 * 특정 국가 데이터를 로드합니다.
 */
export async function loadCountryData(countryCode: string): Promise<Country | null> {
  try {
    // SUPPORTED_COUNTRIES에서 국가 정보 찾기
    const country = SUPPORTED_COUNTRIES.find(c => 
      c.code.toLowerCase() === countryCode.toLowerCase()
    );
    
    if (!country) {
      console.error(`Country not found: ${countryCode}`);
      return null;
    }
    
    return country;
  } catch (error) {
    console.error(`Failed to load country data for ${countryCode}:`, error);
    return null;
  }
}

/**
 * 특정 국가의 사용 가능한 연도 목록을 가져옵니다.
 */
export async function getAvailableYears(countryCode: string): Promise<number[]> {
  try {
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    const files = await fs.readdir(holidaysDir);
    
    const years = files
      .filter(file => file.startsWith(`${countryCode.toLowerCase()}-`) && file.endsWith('.json'))
      .map(file => {
        const match = file.match(/-(\d{4})\.json$/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((year): year is number => year !== null)
      .sort((a, b) => b - a); // 최신 연도부터 정렬
    
    return years;
  } catch (error) {
    console.error(`Failed to get available years for ${countryCode}:`, error);
    return [];
  }
}

/**
 * 모든 국가의 사용 가능한 데이터를 확인합니다.
 */
export async function getAllAvailableData(): Promise<Record<string, number[]>> {
  try {
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
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
    
    return dataMap;
  } catch (error) {
    console.error('Failed to get all available data:', error);
    return {};
  }
}

/**
 * 특정 날짜의 공휴일을 모든 국가에서 찾습니다.
 */
export async function getHolidaysByDate(date: string): Promise<Holiday[]> {
  try {
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    const files = await fs.readdir(holidaysDir);
    const holidays: Holiday[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(holidaysDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: HolidayDataFile = JSON.parse(fileContent);
        
        const matchingHolidays = data.holidays.filter(holiday => holiday.date === date);
        holidays.push(...matchingHolidays);
      } catch (error) {
        console.error(`Failed to process file ${file}:`, error);
      }
    }
    
    return holidays;
  } catch (error) {
    console.error(`Failed to get holidays for date ${date}:`, error);
    return [];
  }
}