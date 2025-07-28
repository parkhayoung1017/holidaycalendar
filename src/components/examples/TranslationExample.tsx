'use client';

import React from 'react';
import { LanguageSelector } from '@/components/navigation/LanguageSelector';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * 언어 선택기와 번역 시스템의 사용 예제 컴포넌트
 */
export function TranslationExample() {
  const { t, locale, tDate, tPlural } = useTranslation();

  const currentDate = new Date();
  const itemCount = 5;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {t('site.title')}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t('site.description')}
        </p>

        {/* 언어 선택기 예제들 */}
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              언어 선택기 스타일
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 드롭다운 스타일 */}
              <div className="space-y-3">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                  드롭다운 스타일
                </h3>
                <div className="w-48">
                  <LanguageSelector variant="dropdown" />
                </div>
              </div>

              {/* 토글 스타일 */}
              <div className="space-y-3">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                  토글 스타일
                </h3>
                <LanguageSelector variant="toggle" />
              </div>
            </div>
          </section>

          {/* 번역 기능 예제 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              번역 기능 예제
            </h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  현재 언어:
                </span>
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  {t(`language.${locale}`)}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  환영 메시지:
                </span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {t('site.welcome', { name: '사용자' })}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  현재 날짜:
                </span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {tDate(currentDate)}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  복수형 처리:
                </span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {tPlural(itemCount, 'items')}
                </span>
              </div>
            </div>
          </section>

          {/* 액션 버튼 예제 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              액션 버튼 예제
            </h2>
            
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                {t('actions.search')}
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                {t('actions.viewMore')}
              </button>
              <button className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
                {t('actions.close')}
              </button>
            </div>
          </section>

          {/* 상태 메시지 예제 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              상태 메시지 예제
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-center">
                {t('status.success')}
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md text-center">
                {t('status.error')}
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md text-center">
                {t('actions.loading')}
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-center">
                {t('status.notFound')}
              </div>
            </div>
          </section>

          {/* 컴팩트 언어 선택기 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              컴팩트 언어 선택기 (라벨 없음)
            </h2>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector 
                variant="toggle" 
                showLabel={false}
                className="border rounded-lg p-2"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                헤더나 푸터에 적합한 컴팩트 버전
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TranslationExample;