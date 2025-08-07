'use client';

import { useState, useEffect } from 'react';

interface MissingHoliday {
  holiday_id: string;
  holiday_name: string;
  country_name: string;
  country_code: string;
  date: string;
  year: number;
}

interface MissingDescriptionEditorProps {
  holiday: MissingHoliday;
  onClose: () => void;
  onSave: () => void;
}

// 지원하는 로케일 정의
const SUPPORTED_LOCALES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

// 로케일별 플레이스홀더 텍스트
const getPlaceholderText = (locale: 'ko' | 'en'): string => {
  if (locale === 'en') {
    return `Please provide detailed information about this holiday, including its meaning, historical background, and how it is celebrated.

Examples:
• Origin and history of the holiday
• Traditional ways of celebration
• Cultural significance and importance`;
  }

  return `이 공휴일의 의미, 역사적 배경, 기념하는 방법 등을 자세히 설명해주세요.

예시:
• 공휴일의 유래와 역사
• 기념하는 방법이나 전통  
• 문화적 의미와 중요성`;
};

// 로케일별 도움말 텍스트
const getHelpText = (locale: 'ko' | 'en'): string => {
  if (locale === 'en') {
    return 'Please write detailed and accurate information that users can easily understand.';
  }

  return '사용자들이 이해하기 쉽도록 자세하고 정확한 정보를 작성해주세요.';
};

// 로케일별 UI 텍스트
const getUIText = (locale: 'ko' | 'en') => {
  if (locale === 'en') {
    return {
      title: 'Write New Description',
      languageSelection: '🌐 Language Selection',
      languageHelp: 'You can write descriptions for each language. If a description already exists, you can edit it.',
      authorName: '📝 Author Name',
      authorPlaceholder: 'e.g., Administrator, John Doe',
      authorHelp: 'Please enter the name of the administrator writing the description.',
      descriptionLabel: '📖 Holiday Description',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      written: '✅ Written',
      notWritten: '📝 Not Written',
      errorRequired: 'Please enter a description.',
      errorAuthorRequired: 'Please enter the author name.',
      errorGeneral: 'An error occurred while creating the description.'
    };
  }

  return {
    title: '새 설명 작성',
    languageSelection: '🌐 언어 선택',
    languageHelp: '각 언어별로 설명을 작성할 수 있습니다. 이미 작성된 설명이 있는 경우 수정할 수 있습니다.',
    authorName: '📝 작성자 이름',
    authorPlaceholder: '예: 관리자, 홍길동',
    authorHelp: '설명을 작성하는 관리자의 이름을 입력해주세요.',
    descriptionLabel: '📖 공휴일 설명',
    cancel: '취소',
    save: '저장',
    saving: '저장 중...',
    written: '✅ 작성됨',
    notWritten: '📝 미작성',
    errorRequired: '설명을 입력해주세요.',
    errorAuthorRequired: '작성자 이름을 입력해주세요.',
    errorGeneral: '설명 생성 중 오류가 발생했습니다.'
  };
};

export default function MissingDescriptionEditor({
  holiday,
  onClose,
  onSave
}: MissingDescriptionEditorProps) {
  const [description, setDescription] = useState('');
  const [selectedLocale, setSelectedLocale] = useState<'ko' | 'en'>('ko');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('admin');
  const [existingDescriptions, setExistingDescriptions] = useState<Record<string, string>>({});

  // 모달이 열릴 때 body 스크롤 방지 및 기존 설명 로드
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    loadExistingDescriptions();
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // 로케일 변경 시 해당 로케일의 설명 로드
  useEffect(() => {
    const existingDesc = existingDescriptions[selectedLocale];
    if (existingDesc) {
      setDescription(existingDesc);
    } else {
      setDescription('');
    }
  }, [selectedLocale, existingDescriptions]);

  // 기존 설명들을 로드하는 함수
  const loadExistingDescriptions = async () => {
    console.log('🔍 기존 설명 로드 시작:', {
      holidayName: holiday.holiday_name,
      countryName: holiday.country_name,
      countryCode: holiday.country_code
    });

    try {
      const promises = SUPPORTED_LOCALES.map(async (locale) => {
        // 다양한 국가명 형식으로 시도
        const countryVariations = [
          holiday.country_name,
          holiday.country_code,
          holiday.country_code.toLowerCase(),
          // 특별한 경우들
          ...(holiday.country_name === 'United States' ? ['US', 'USA', 'America'] : []),
          ...(holiday.country_name === 'United Kingdom' ? ['GB', 'UK', 'Britain'] : []),
          ...(holiday.country_name === 'South Korea' ? ['KR', 'Korea'] : [])
        ].filter((v, i, arr) => arr.indexOf(v) === i); // 중복 제거

        for (const countryVariation of countryVariations) {
          try {
            const response = await fetch(
              `/api/admin/descriptions?holidayName=${encodeURIComponent(holiday.holiday_name)}&countryName=${encodeURIComponent(countryVariation)}&locale=${locale.code}&isManual=true&limit=1`
            );

            if (response.ok) {
              const data = await response.json();
              if (data.descriptions && data.descriptions.length > 0) {
                const desc = data.descriptions[0];

                // 매우 엄격한 검증: 확실히 관리자가 작성한 설명만 인정
                const isReallyManual = desc.is_manual === true &&
                  desc.modified_by &&
                  desc.modified_by !== 'system' &&
                  desc.modified_by !== 'hybrid_cache' &&
                  desc.modified_by !== 'ai_generator' &&
                  desc.modified_by !== 'auto';

                // 의심스러운 콘텐츠 패턴 감지
                const suspiciousPatterns = [
                  '한번 더 테스트',
                  '제발',
                  'AI 생성',
                  'generated',
                  'test',
                  '테스트',
                  /(.{20,})\1{2,}/, // 20자 이상 반복 패턴
                  /^(.{1,10})\s*\1\s*\1/, // 짧은 반복 패턴
                ];

                const hasSuspiciousContent = suspiciousPatterns.some(pattern => {
                  if (typeof pattern === 'string') {
                    return desc.description.toLowerCase().includes(pattern.toLowerCase());
                  } else {
                    return pattern.test(desc.description);
                  }
                });

                // 추가 검증: 설명이 너무 짧거나 의미없는 내용인지 확인
                const isTooShort = desc.description.trim().length < 50;
                const isValidContent = desc.description.includes('공휴일') ||
                  desc.description.includes('holiday') ||
                  desc.description.includes('기념') ||
                  desc.description.includes('celebrate');

                if (isReallyManual && !hasSuspiciousContent && !isTooShort && isValidContent) {
                  console.log(`✅ 유효한 수동 설명 발견: ${holiday.holiday_name} (${countryVariation}, ${locale.code})`);
                  return { locale: locale.code, description: desc.description };
                } else {
                  console.log(`⚠️ 무효한 설명 제외: ${holiday.holiday_name} (${countryVariation}, ${locale.code})`, {
                    isManual: desc.is_manual,
                    modifiedBy: desc.modified_by,
                    isReallyManual,
                    hasSuspiciousContent,
                    isTooShort,
                    isValidContent,
                    preview: desc.description.substring(0, 50)
                  });
                }
              }
            }
          } catch (error) {
            console.warn(`설명 조회 실패: ${countryVariation} (${locale.code})`, error);
          }
        }

        return { locale: locale.code, description: '' };
      });

      const results = await Promise.all(promises);
      const descriptionsMap: Record<string, string> = {};

      results.forEach(result => {
        descriptionsMap[result.locale] = result.description;
      });

      console.log('로드된 기존 설명들:', descriptionsMap);
      setExistingDescriptions(descriptionsMap);
    } catch (error) {
      console.error('기존 설명 로드 실패:', error);
    }
  };

  const handleSave = async () => {
    const uiText = getUIText(selectedLocale);

    if (!description.trim()) {
      setError(uiText.errorRequired);
      return;
    }

    if (!authorName.trim()) {
      setError(uiText.errorAuthorRequired);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const requestData = {
        holiday_id: holiday.holiday_id,
        holiday_name: holiday.holiday_name,
        country_name: holiday.country_name,
        locale: selectedLocale,
        description: description.trim(),
        is_manual: true,
        modified_by: authorName.trim()
      };

      console.log('설명 저장 요청 데이터:', requestData);

      const response = await fetch('/api/admin/descriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('API 오류 응답:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: 설명 저장에 실패했습니다.`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ 설명 저장 완료, UI 상태 업데이트 중...');

        // 저장된 설명을 현재 상태에 즉시 반영
        const updatedDescriptions = {
          ...existingDescriptions,
          [selectedLocale]: description.trim()
        };

        setExistingDescriptions(updatedDescriptions);

        console.log('💾 저장 완료 - 현재 언어별 상태:', {
          ko: updatedDescriptions.ko || '',
          en: updatedDescriptions.en || '',
          currentLocale: selectedLocale,
          savedDescription: description.trim()
        });

        // 두 언어 모두 작성되었는지 확인
        const hasKorean = updatedDescriptions.ko && updatedDescriptions.ko.trim().length > 0;
        const hasEnglish = updatedDescriptions.en && updatedDescriptions.en.trim().length > 0;
        const bothCompleted = hasKorean && hasEnglish;

        console.log('📊 완료 상태 확인:', {
          hasKorean,
          hasEnglish,
          bothCompleted,
          shouldRemoveFromList: bothCompleted
        });

        // 저장 완료 후 모달 닫기
        console.log('✅ 저장 완료, 모달 닫기');
        onSave();
      } else {
        throw new Error(result.error || '설명 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('설명 저장 오류:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(uiText.errorGeneral);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {getUIText(selectedLocale).title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {holiday.holiday_name} ({holiday.country_name})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 공휴일 정보 */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">공휴일명:</span>
              <span className="ml-2 text-gray-900">{holiday.holiday_name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">국가:</span>
              <span className="ml-2 text-gray-900">{holiday.country_name} ({holiday.country_code})</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">날짜:</span>
              <span className="ml-2 text-gray-900">{formatDate(holiday.date)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">연도:</span>
              <span className="ml-2 text-gray-900">{holiday.year}년</span>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 로케일 선택 */}
        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            {getUIText(selectedLocale).languageSelection}
          </label>
          <div className="flex space-x-3">
            {SUPPORTED_LOCALES.map((locale) => {
              const hasExisting = existingDescriptions[locale.code]?.trim().length > 0;
              return (
                <button
                  key={locale.code}
                  onClick={() => setSelectedLocale(locale.code)}
                  className={`
                    flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-200
                    ${selectedLocale === locale.code
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }
                  `}
                >
                  <span className="text-lg mr-2">{locale.flag}</span>
                  <div className="text-left">
                    <div className="font-medium">{locale.name}</div>
                    <div className="text-xs opacity-75">
                      {hasExisting ? getUIText(selectedLocale).written : getUIText(selectedLocale).notWritten}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {getUIText(selectedLocale).languageHelp}
          </p>
        </div>

        {/* 작성자 입력 */}
        <div className="mt-6">
          <label htmlFor="author-name" className="block text-sm font-semibold text-gray-800 mb-2">
            {getUIText(selectedLocale).authorName}
          </label>
          <input
            type="text"
            id="author-name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={getUIText(selectedLocale).authorPlaceholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            {getUIText(selectedLocale).authorHelp}
          </p>
        </div>

        {/* 설명 입력 */}
        <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
            {getUIText(selectedLocale).descriptionLabel} ({SUPPORTED_LOCALES.find(l => l.code === selectedLocale)?.name})
          </label>
          <div className="relative">
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={getPlaceholderText(selectedLocale)}
              rows={10}
              maxLength={2000}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical text-base leading-relaxed text-gray-900 bg-white placeholder:text-gray-400"
              style={{ minHeight: '200px' }}
            />
          </div>
          <div className="mt-2 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {getHelpText(selectedLocale)}
            </p>
            <p className="text-xs text-gray-500">
              <span className={description.length > 1800 ? 'text-orange-600 font-medium' : ''}>{description.length}</span> / 2000자
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {getUIText(selectedLocale).cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !description.trim() || !authorName.trim()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSaving ? getUIText(selectedLocale).saving : getUIText(selectedLocale).save}
          </button>
        </div>
      </div>
    </div>
  );
}