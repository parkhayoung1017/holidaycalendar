import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/auth-middleware';
import { SupabaseHolidayDescriptionService } from '../../../../../lib/supabase-client';
import { 
  createSuccessResponse, 
  createServerErrorResponse, 
  logApiError 
} from '../../../../../lib/api-response';
import fs from 'fs';
import path from 'path';

/**
 * 설명 없는 공휴일 목록 조회 API
 * GET /api/admin/descriptions/missing
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || undefined;
    const year = searchParams.get('year') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 기존 공휴일 데이터에서 설명이 없는 항목들을 찾기
    const result = await findMissingDescriptions(country, year, page, limit);

    return createSuccessResponse(
      result.data,
      '설명 없는 공휴일 목록을 성공적으로 조회했습니다.',
      {
        total: result.total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(result.total / limit)
      }
    );

  } catch (error) {
    logApiError('/api/admin/descriptions/missing', 'GET', error);
    return createServerErrorResponse('설명 없는 공휴일 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 설명이 없는 공휴일을 찾는 함수
 */
async function findMissingDescriptions(
  country?: string, 
  year?: string, 
  page: number = 1,
  limit: number = 50
): Promise<{
  data: Array<{
    holiday_id: string;
    holiday_name: string;
    country_name: string;
    country_code: string;
    date: string;
    year: number;
  }>;
  total: number;
}> {
  try {
    const service = new SupabaseHolidayDescriptionService();
    
    // AI 캐시에서 기존 설명 확인
    const fs = require('fs');
    const path = require('path');
    
    const existingKeys = new Set<string>();
    
    // 1. Supabase에서 기존 설명 확인 (우선순위)
    try {
      const supabaseDescriptions = await service.getDescriptions({
        page: 1,
        limit: 10000, // 모든 설명을 가져오기 위해 큰 값 설정
        locale: 'ko'
      });
      
      supabaseDescriptions.data.forEach(desc => {
        // 다양한 키 형식으로 저장하여 매칭률 향상
        existingKeys.add(`${desc.holiday_name}_${desc.country_name}_ko`);
        existingKeys.add(`${desc.holiday_name}_${desc.country_name}_en`);
        // 국가 코드도 함께 확인
        const countryCode = getCountryCodeFromName(desc.country_name);
        if (countryCode) {
          existingKeys.add(`${desc.holiday_name}_${countryCode}_ko`);
          existingKeys.add(`${desc.holiday_name}_${countryCode}_en`);
        }
      });
      
      console.log('Supabase에서 가져온 설명 개수:', supabaseDescriptions.data.length);
    } catch (error) {
      console.warn('Supabase 설명 조회 실패:', error);
    }
    
    // 2. AI 캐시 파일에서 기존 설명 확인 (더 정확한 파싱)
    try {
      const aiCachePath = path.join(process.cwd(), 'public', 'ai-cache.json');
      if (fs.existsSync(aiCachePath)) {
        const aiCache = JSON.parse(fs.readFileSync(aiCachePath, 'utf-8'));
        Object.entries(aiCache).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            // 새로운 형식: 객체 형태의 캐시 데이터
            if (value.holidayName && value.countryName) {
              existingKeys.add(`${value.holidayName}_${value.countryName}_ko`);
              existingKeys.add(`${value.holidayName}_${value.countryName}_en`);
            }
          } else {
            // 기존 형식: 키 기반 파싱
            const parts = key.split('-');
            if (parts.length >= 3) {
              const holidayName = parts.slice(0, -2).join('-');
              const countryName = parts[parts.length - 2];
              existingKeys.add(`${holidayName}_${countryName}_ko`);
              existingKeys.add(`${holidayName}_${countryName}_en`);
            }
          }
        });
      }
    } catch (error) {
      console.warn('AI 캐시 파일 읽기 실패:', error);
    }
    
    // 3. 수동 생성된 설명 파일들 확인
    try {
      const descriptionsDir = path.join(process.cwd(), 'data', 'descriptions');
      if (fs.existsSync(descriptionsDir)) {
        const files = fs.readdirSync(descriptionsDir);
        files.forEach(file => {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(descriptionsDir, file);
              const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              if (data.holiday_name && data.country_name) {
                existingKeys.add(`${data.holiday_name}_${data.country_name}_ko`);
                existingKeys.add(`${data.holiday_name}_${data.country_name}_en`);
              }
            } catch (error) {
              console.warn(`설명 파일 읽기 실패: ${file}`, error);
            }
          }
        });
      }
    } catch (error) {
      console.warn('설명 디렉토리 읽기 실패:', error);
    }
    
    // 4. 하이브리드 캐시에서도 확인 (추가 보완)
    try {
      const { getCachedDescription } = await import('../../../../lib/hybrid-cache');
      // 이미 위에서 Supabase와 로컬 캐시를 확인했으므로 여기서는 스킵
    } catch (error) {
      console.warn('하이브리드 캐시 확인 실패:', error);
    }
    
    console.log('총 기존 설명 개수:', existingKeys.size);

    // 로컬 공휴일 데이터 파일들 스캔 - 먼저 모든 설명 없는 공휴일을 찾기
    const dataDir = path.join(process.cwd(), 'data', 'holidays');
    const allMissingHolidays: Array<{
      holiday_id: string;
      holiday_name: string;
      country_name: string;
      country_code: string;
      date: string;
      year: number;
    }> = [];

    if (!fs.existsSync(dataDir)) {
      console.warn('공휴일 데이터 디렉토리가 존재하지 않습니다:', dataDir);
      return { data: [], total: 0 };
    }

    const files = fs.readdirSync(dataDir);

    // 모든 파일을 처리해서 설명 없는 공휴일을 찾기
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      // 파일명에서 국가 코드와 연도 추출 (예: us-2024.json)
      const match = file.match(/^([a-z]{2})-(\d{4})\.json$/);
      if (!match) continue;
      
      const [, countryCode, fileYear] = match;
      
      // 필터링 조건 확인
      if (year && fileYear !== year) continue;
      if (country && country.toLowerCase() !== countryCode.toLowerCase()) continue;

      try {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const holidayData = JSON.parse(fileContent);

        if (holidayData.holidays && Array.isArray(holidayData.holidays)) {
          for (const holiday of holidayData.holidays) {
            const countryName = holidayData.country || getCountryName(countryCode);
            
            // 다양한 키 형식으로 확인하여 매칭률 향상
            const possibleKeys = [
              `${holiday.name}_${countryName}_ko`,
              `${holiday.name}_${countryName}_en`,
              `${holiday.name}_${countryCode.toUpperCase()}_ko`,
              `${holiday.name}_${countryCode.toUpperCase()}_en`,
              `${holiday.name}_${getCountryName(countryCode)}_ko`,
              `${holiday.name}_${getCountryName(countryCode)}_en`
            ];
            
            // 모든 가능한 키를 확인해서 하나라도 존재하면 설명이 있는 것으로 간주
            const hasDescription = possibleKeys.some(key => existingKeys.has(key));
            
            if (!hasDescription) {
              allMissingHolidays.push({
                holiday_id: `${countryCode}_${fileYear}_${holiday.date}_${holiday.name.replace(/\s+/g, '_')}`,
                holiday_name: holiday.name,
                country_name: countryName,
                country_code: countryCode.toUpperCase(),
                date: holiday.date,
                year: parseInt(fileYear)
              });
            }
          }
        }
      } catch (fileError) {
        console.warn(`파일 처리 실패: ${file}`, fileError);
        continue;
      }
    }

    // 페이지네이션 적용
    const total = allMissingHolidays.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = allMissingHolidays.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total: total
    };

  } catch (error) {
    console.error('설명 없는 공휴일 검색 실패:', error);
    return { data: [], total: 0 };
  }
}

/**
 * 국가 코드에서 국가명을 가져오는 함수
 */
function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'us': 'United States',
    'kr': 'South Korea',
    'jp': 'Japan',
    'cn': 'China',
    'gb': 'United Kingdom',
    'de': 'Germany',
    'fr': 'France',
    'ca': 'Canada',
    'au': 'Australia',
    'in': 'India',
    'br': 'Brazil',
    'mx': 'Mexico',
    'it': 'Italy',
    'es': 'Spain',
    'ru': 'Russia',
    'nl': 'Netherlands',
    'se': 'Sweden',
    'no': 'Norway',
    'dk': 'Denmark',
    'fi': 'Finland'
  };
  
  return countryNames[countryCode.toLowerCase()] || countryCode.toUpperCase();
}

/**
 * 국가명에서 국가 코드를 가져오는 함수
 */
function getCountryCodeFromName(countryName: string): string | null {
  const countryCodeMap: Record<string, string> = {
    'United States': 'US',
    'South Korea': 'KR',
    'Korea': 'KR',
    'Japan': 'JP',
    'China': 'CN',
    'United Kingdom': 'GB',
    'Britain': 'GB',
    'Germany': 'DE',
    'France': 'FR',
    'Canada': 'CA',
    'Australia': 'AU',
    'India': 'IN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Italy': 'IT',
    'Spain': 'ES',
    'Russia': 'RU',
    'Netherlands': 'NL',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI'
  };
  
  return countryCodeMap[countryName] || null;
}

// 인증 미들웨어로 래핑
export const GET = withAuth(handler);