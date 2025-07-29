import { NextRequest, NextResponse } from 'next/server';
import { loadHolidayData } from '@/lib/data-loader';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');
    const year = searchParams.get('year');
    const month = searchParams.get('month'); // 0-11 형식

    if (!countryCode || !year) {
      return NextResponse.json(
        { error: 'country와 year 파라미터가 필요합니다' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = month ? parseInt(month) : null;

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return NextResponse.json(
        { error: '유효하지 않은 연도입니다 (2020-2030)' },
        { status: 400 }
      );
    }

    // 공휴일 데이터 로드
    const holidays = await loadHolidayData(countryCode, yearNum);

    // 특정 월이 지정된 경우 해당 월의 공휴일만 필터링
    const filteredHolidays = monthNum !== null 
      ? holidays.filter(holiday => {
          const holidayDate = new Date(holiday.date);
          return holidayDate.getMonth() === monthNum;
        })
      : holidays;

    return NextResponse.json({
      success: true,
      data: filteredHolidays,
      country: countryCode,
      year: yearNum,
      month: monthNum,
      total: filteredHolidays.length
    });

  } catch (error) {
    console.error('공휴일 API 에러:', error);
    return NextResponse.json(
      { 
        error: '공휴일 데이터를 불러오는데 실패했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}