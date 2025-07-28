'use client';

import React from 'react';
import Link from 'next/link';
import { useCommonTranslation, useNavigationTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/navigation/LanguageSelector';

export default function Header() {
  const { t: tCommon, locale } = useCommonTranslation();
  const { t: tNav } = useNavigationTranslation();

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 사이트 제목 */}
          <Link href={`/${locale}`} className="text-lg font-semibold text-gray-900 flex-shrink-0">
            {tCommon('site.title')}
          </Link>
          
          {/* 데스크톱 내비게이션과 언어 선택기 */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex items-center space-x-6">
              <Link href={`/${locale}`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {tNav('menu.home')}
              </Link>
              <Link href={`/${locale}/today`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {tNav('menu.todayHolidays')}
              </Link>
              <Link href={`/${locale}/regions`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {tNav('menu.regionHolidays')}
              </Link>
            </nav>
            
            {/* 언어 선택기 */}
            <LanguageSelector 
              variant="toggle" 
              showLabel={false}
            />
          </div>

          {/* 모바일 언어 선택기 */}
          <div className="md:hidden">
            <LanguageSelector 
              variant="toggle" 
              showLabel={false}
            />
          </div>
        </div>

        {/* 모바일 내비게이션 (반응형) */}
        <nav className="md:hidden pb-4 pt-2">
          <div className="flex flex-wrap items-center justify-center space-x-6">
            <Link href={`/${locale}`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {tNav('menu.home')}
            </Link>
            <Link href={`/${locale}/today`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {tNav('menu.todayHolidays')}
            </Link>
            <Link href={`/${locale}/regions`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {tNav('menu.regionHolidays')}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}