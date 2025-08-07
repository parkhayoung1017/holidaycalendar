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

export default function MissingDescriptionEditor({
  holiday,
  onClose,
  onSave
}: MissingDescriptionEditorProps) {
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('admin');

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSave = async () => {
    if (!description.trim()) {
      setError('설명을 입력해주세요.');
      return;
    }

    if (!authorName.trim()) {
      setError('작성자 이름을 입력해주세요.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const requestData = {
        holiday_id: holiday.holiday_id,
        holiday_name: holiday.holiday_name,
        country_name: holiday.country_name,
        locale: 'ko',
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
        onSave();
      } else {
        throw new Error(result.error || '설명 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('설명 저장 오류:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('설명 생성 중 오류가 발생했습니다.');
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
              새 설명 작성
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

        {/* 작성자 입력 */}
        <div className="mt-6">
          <label htmlFor="author-name" className="block text-sm font-semibold text-gray-800 mb-2">
            📝 작성자 이름
          </label>
          <input
            type="text"
            id="author-name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="예: 관리자, 홍길동"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            설명을 작성하는 관리자의 이름을 입력해주세요.
          </p>
        </div>

        {/* 설명 입력 */}
        <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
            📖 공휴일 설명
          </label>
          <div className="relative">
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 공휴일의 의미, 역사적 배경, 기념하는 방법 등을 자세히 설명해주세요.

예시:
• 공휴일의 유래와 역사
• 기념하는 방법이나 전통  
• 문화적 의미와 중요성"
              rows={10}
              maxLength={2000}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical text-base leading-relaxed text-gray-900 bg-white placeholder:text-gray-400"
              style={{ minHeight: '200px' }}
            />
          </div>
          <div className="mt-2 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              사용자들이 이해하기 쉽도록 자세하고 정확한 정보를 작성해주세요.
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
            취소
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
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}