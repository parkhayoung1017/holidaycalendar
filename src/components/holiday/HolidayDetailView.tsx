import { Holiday, Country } from '@/types';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface HolidayDetailViewProps {
  holiday: Holiday;
  country: Country;
  countryOverview: string;
}

export default function HolidayDetailView({ 
  holiday, 
  country, 
  countryOverview 
}: HolidayDetailViewProps) {
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return {
        full: format(date, 'yyyy년 M월 d일 EEEE', { locale: ko }),
        short: format(date, 'M월 d일', { locale: ko }),
        weekday: format(date, 'EEEE', { locale: ko }),
        month: format(date, 'M월', { locale: ko }),
        year: format(date, 'yyyy년', { locale: ko })
      };
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      return {
        full: dateString,
        short: dateString,
        weekday: '',
        month: '',
        year: ''
      };
    }
  };

  const dateInfo = formatDate(holiday.date);
  
  // 공휴일 타입 한글 변환
  const getHolidayTypeText = (type: Holiday['type']) => {
    const typeMap = {
      'public': '공휴일',
      'bank': '은행 휴무일',
      'school': '학교 휴무일',
      'optional': '선택적 휴일'
    };
    return typeMap[type] || '기타';
  };

  // 공휴일 타입별 색상
  const getTypeColor = (type: Holiday['type']) => {
    const colorMap = {
      'public': 'bg-blue-100 text-blue-800',
      'bank': 'bg-green-100 text-green-800',
      'school': 'bg-purple-100 text-purple-800',
      'optional': 'bg-gray-100 text-gray-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* 국가 정보 */}
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{country.flag}</span>
              <div>
                <Link 
                  href={`/${country.code.toLowerCase()}-${new Date().getFullYear()}`}
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  {country.name}
                </Link>
                <div className="text-blue-200 text-sm">{country.region}</div>
              </div>
            </div>
            
            {/* 공휴일 이름 */}
            <h1 className="text-4xl font-bold mb-2">{holiday.name}</h1>
            
            {/* 날짜 정보 */}
            <div className="text-xl text-blue-100 mb-4">
              {dateInfo.full}
            </div>
            
            {/* 공휴일 타입 */}
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(holiday.type)}`}>
                {getHolidayTypeText(holiday.type)}
              </span>
              {holiday.global && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  전국 공휴일
                </span>
              )}
            </div>
          </div>
          
          {/* 날짜 카드 */}
          <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center min-w-[120px]">
            <div className="text-3xl font-bold">{dateInfo.short.split(' ')[1]}</div>
            <div className="text-sm opacity-90">{dateInfo.month}</div>
            <div className="text-sm opacity-75">{dateInfo.weekday}</div>
          </div>
        </div>
      </div>
      
      {/* 본문 섹션 */}
      <div className="p-8">
        {/* 공휴일 설명 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">공휴일 소개</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed text-lg">
              {holiday.description}
            </p>
          </div>
        </section>
        
        {/* 지역 정보 (지역별 공휴일인 경우) */}
        {holiday.counties && holiday.counties.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">적용 지역</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {holiday.counties.map((county, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {county}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
        
        {/* 국가별 공휴일 제도 설명 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {country.name}의 공휴일 제도
          </h2>
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed">
              {countryOverview}
            </p>
          </div>
        </section>
        
        {/* 추가 정보 */}
        <section className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">추가 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">공휴일 유형</h4>
              <p className="text-gray-600 text-sm">
                {getHolidayTypeText(holiday.type)}으로 분류되며, 
                {holiday.global ? ' 전국적으로 적용됩니다.' : ' 일부 지역에서 적용됩니다.'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">날짜 정보</h4>
              <p className="text-gray-600 text-sm">
                {dateInfo.year} {dateInfo.weekday}에 해당하며, 
                매년 같은 날짜에 기념됩니다.
              </p>
            </div>
          </div>
        </section>
        
        {/* 네비게이션 */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/${country.code.toLowerCase()}-${new Date().getFullYear()}`}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
            >
              {country.name} 전체 공휴일 보기
            </Link>
            
            <Link
              href="/"
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}