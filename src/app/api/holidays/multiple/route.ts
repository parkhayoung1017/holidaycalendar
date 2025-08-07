import { NextRequest, NextResponse } from 'next/server';
import { loadHolidayData } from '@/lib/data-loader';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { countries, year, month } = body;

    if (!countries || !Array.isArray(countries) || !year) {
      return NextResponse.json(
        { error: 'countries 배열과 year 파라미터가 필요합니다' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = month !== null && month !== undefined ? parseInt(month) : null;

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return NextResponse.json(
        { error: '유효하지 않은 연도입니다 (2020-2030)' },
        { status: 400 }
      );
    }

    // 모든 국가의 공휴일 데이터를 병렬로 로드
    const holidayPromises = countries.map(async (countryCode: string) => {
      try {
        const holidays = await loadHolidayData(countryCode, yearNum, 'ko');
        
        // 특정 월이 지정된 경우 해당 월의 공휴일만 필터링
        const filteredHolidays = monthNum !== null 
          ? holidays.filter(holiday => {
              const holidayDate = new Date(holiday.date);
              return holidayDate.getMonth() === monthNum;
            })
          : holidays;

        return {
          country: countryCode,
          holidays: filteredHolidays,
          success: true
        };
      } catch (error) {
        console.warn(`Failed to load holidays for ${countryCode}:`, error);
        return {
          country: countryCode,
          holidays: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(holidayPromises);
    
    // 모든 공휴일을 하나의 배열로 합치기
    const allHolidays = results
      .filter(result => result.success)
      .flatMap(result => result.holidays);

    return NextResponse.json({
      success: true,
      data: allHolidays,
      year: yearNum,
      month: monthNum,
      countries: countries,
      total: allHolidays.length,
      results: results // 개별 국가별 결과도 포함
    });

  } catch (error) {
    console.error('다중 공휴일 API 에러:', error);
    return NextResponse.json(
      { 
        error: '공휴일 데이터를 불러오는데 실패했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}