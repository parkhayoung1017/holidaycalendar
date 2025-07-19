import { Country } from '@/types';

interface CountryHeaderProps {
  country: Country;
  year: number;
  totalHolidays?: number;
}

export default function CountryHeader({ country, year, totalHolidays }: CountryHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl" role="img" aria-label={`${country.name} flag`}>
          {country.flag}
        </span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {country.name} {year}년 공휴일
          </h1>
          <p className="text-gray-600 mt-1">
            {country.region} • {totalHolidays ? `총 ${totalHolidays}개의 공휴일` : '공휴일 정보'}
          </p>
        </div>
      </div>
      
      {country.overview && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">국가 정보</h2>
          <p className="text-gray-700 leading-relaxed">{country.overview}</p>
        </div>
      )}
    </div>
  );
}