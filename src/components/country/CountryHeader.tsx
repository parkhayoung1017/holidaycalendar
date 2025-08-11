'use client';

import { Country } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import CountryFlag from '@/components/ui/CountryFlag';

interface CountryHeaderProps {
  country: Country;
  year: number;
  totalHolidays?: number;
}

export default function CountryHeader({ country, year, totalHolidays }: CountryHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <CountryFlag 
          countryCode={country.code} 
          size="lg" 
          className="text-4xl"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {country.name} {year}{t('time.year')} {t('navigation.holidays')}
          </h1>
          <p className="text-gray-600 mt-1">
            {country.region} • {totalHolidays ? `${t('common.total', '총')} ${totalHolidays}${t('common.count', '개의')} ${t('navigation.holidays')}` : t('navigation.holidays') + ' ' + t('common.info', '정보')}
          </p>
        </div>
      </div>
      
      {country.overview && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">{t('country.info', '국가 정보')}</h2>
          <p className="text-gray-700 leading-relaxed">{country.overview}</p>
        </div>
      )}
    </div>
  );
}