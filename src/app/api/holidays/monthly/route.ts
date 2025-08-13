import { NextRequest, NextResponse } from 'next/server';
import { getHolidaysByMonth } from '@/lib/data-loader';

/**
 * 특정 연도와 월의 모든 국가 공휴일을 반환하는 API
 * GET /api/holidays/monthly?year=2025&month=8
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    // 파라미터 검증
    if (!yearParam || !monthParam) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'year와 month 파라미터가 필요합니다' 
        },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam);
    const month = parseInt(monthParam) - 1; // 1-12를 0-11로 변환

    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 year 또는 month 값입니다' 
        },
        { status: 400 }
      );
    }

    if (year < 2020 || year > 2030) {
      return NextResponse.json(
        { 
          success: false, 
          error: '지원하는 연도 범위는 2020-2030년입니다' 
        },
        { status: 400 }
      );
    }

    // 월별 공휴일 데이터 로드
    const holidays = await getHolidaysByMonth(year, month);

    return NextResponse.json({
      success: true,
      data: holidays,
      total: holidays.length,
      year,
      month: month + 1, // 다시 1-12로 변환하여 반환
      message: `${year}년 ${month + 1}월의 전세계 공휴일 ${holidays.length}개를 조회했습니다`
    });

  } catch (error) {
    console.error('월별 공휴일 API 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 내부 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

/**
 * POST 요청도 지원 (더 복잡한 필터링을 위해)
 * POST /api/holidays/monthly
 * Body: { year: 2025, month: 9, countries?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, countries } = body;

    // 파라미터 검증
    if (!year || !month) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'year와 month가 필요합니다' 
        },
        { status: 400 }
      );
    }

    const monthIndex = month - 1; // 1-12를 0-11로 변환

    if (year < 2020 || year > 2030 || monthIndex < 0 || monthIndex > 11) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 year 또는 month 값입니다' 
        },
        { status: 400 }
      );
    }

    // 월별 공휴일 데이터 로드
    let holidays = await getHolidaysByMonth(year, monthIndex);

    // 특정 국가들만 필터링 (countries 파라미터가 있는 경우)
    if (countries && Array.isArray(countries) && countries.length > 0) {
      holidays = holidays.filter(holiday => 
        countries.includes(holiday.countryCode)
      );
    }

    return NextResponse.json({
      success: true,
      data: holidays,
      total: holidays.length,
      year,
      month,
      countries: countries || 'all',
      message: `${year}년 ${month}월의 ${countries ? `${countries.length}개 국가` : '전세계'} 공휴일 ${holidays.length}개를 조회했습니다`
    });

  } catch (error) {
    console.error('월별 공휴일 POST API 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 내부 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}