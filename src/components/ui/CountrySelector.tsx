import React, { useState, useEffect } from 'react';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';
import { supportsFlagEmojis, displayFlag } from '@/lib/flag-utils';
import CountryFlag from './CountryFlag';

interface CountrySelectorProps {
  onCountrySelect: (countryCode: string) => void;
  selectedCountry?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ 
  onCountrySelect, 
  selectedCountry 
}) => {
  const [flagSupport, setFlagSupport] = useState(true);

  useEffect(() => {
    // 클라이언트 사이드에서만 국기 지원 여부 확인
    setFlagSupport(supportsFlagEmojis());
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {SUPPORTED_COUNTRIES
        .filter(country => country.popular)
        .map(country => (
          <button
            key={country.code}
            onClick={() => onCountrySelect(country.code)}
            className={`
              flex items-center gap-2 p-3 rounded-lg border transition-all duration-200
              ${selectedCountry === country.code 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {flagSupport ? (
              <span className="flag-emoji text-lg">
                {country.flag}
              </span>
            ) : (
              <CountryFlag 
                countryCode={country.code} 
                size="sm" 
              />
            )}
            <span className="text-sm font-medium truncate">
              {country.name}
            </span>
          </button>
        ))
      }
    </div>
  );
};

export default CountrySelector;