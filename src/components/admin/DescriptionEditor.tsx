'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HolidayDescription } from '@/types/admin';
import { getCountrySlugFromCode, createHolidaySlug, getCountrySlugFromName } from '@/lib/country-utils';

interface DescriptionEditorProps {
  descriptionId: string;
}

export default function DescriptionEditor({ descriptionId }: DescriptionEditorProps) {
  const router = useRouter();
  const [description, setDescription] = useState<HolidayDescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // 편집 상태
  const [editedDescription, setEditedDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // 실시간 저장 타이머
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // 설명 데이터 로드
  useEffect(() => {
    const loadDescription = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/descriptions/${descriptionId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('설명을 찾을 수 없습니다');
          }
          throw new Error('설명을 불러오는데 실패했습니다');
        }

        const result = await response.json();
        
        // API 응답이 success 형식인지 확인
        const data: HolidayDescription = result.success ? result.data : result;
        setDescription(data);
        setEditedDescription(data.description || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    loadDescription();
  }, [descriptionId]);

  // 설명 변경 감지
  useEffect(() => {
    if (description && editedDescription !== description.description) {
      setHasChanges(true);
      
      // 기존 타이머 취소
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      
      // 2초 후 자동 저장
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000);
      
      setSaveTimer(timer);
    } else {
      setHasChanges(false);
    }

    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  }, [editedDescription, description]);

  // 자동 저장 함수
  const handleAutoSave = async () => {
    if (!hasChanges || saving) return;

    try {
      setSaving(true);
      setSaveMessage(null);

      const response = await fetch(`/api/admin/descriptions/${descriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          description: editedDescription,
          modified_by: 'admin' // 실제로는 로그인한 사용자 정보를 사용
        }),
      });

      if (!response.ok) {
        throw new Error('저장에 실패했습니다');
      }

      const result = await response.json();
      const updatedDescription: HolidayDescription = result.success ? result.data : result;
      setDescription(updatedDescription);
      setHasChanges(false);
      setSaveMessage('자동 저장되었습니다');
      
      // 3초 후 메시지 제거
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  // 수동 저장
  const handleManualSave = async () => {
    await handleAutoSave();
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!confirm('정말로 이 설명을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/descriptions/${descriptionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다');
      }

      router.push('/admin/descriptions');
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    if (!dateString) return '정보 없음';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '잘못된 날짜';
      }
      return date.toLocaleString('ko-KR');
    } catch {
      return '잘못된 날짜';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status" aria-label="로딩 중"></div>
      </div>
    );
  }

  if (error && !description) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
        <div className="mt-4">
          <Link
            href="/admin/descriptions"
            className="text-blue-600 hover:text-blue-800"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!description) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">설명을 찾을 수 없습니다.</div>
        <div className="mt-4">
          <Link
            href="/admin/descriptions"
            className="text-blue-600 hover:text-blue-800"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 네비게이션 */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/admin/descriptions" className="hover:text-gray-700">
          설명 목록
        </Link>
        <span>/</span>
        <span className="text-gray-900">편집</span>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* 저장 상태 메시지 */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{saveMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 편집 영역 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  공휴일명
                </label>
                <input
                  type="text"
                  value={description.holiday_name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  국가
                </label>
                <input
                  type="text"
                  value={description.country_name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  언어
                </label>
                <input
                  type="text"
                  value={description.locale}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작성 방식
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  description.is_manual 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {description.is_manual ? '수동 작성' : 'AI 생성'}
                </span>
              </div>
            </div>
          </div>

          {/* 설명 편집 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">설명 편집</h2>
              <div className="flex items-center space-x-2">
                {saving && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    저장 중...
                  </div>
                )}
                {hasChanges && !saving && (
                  <div className="text-sm text-orange-600">
                    변경사항이 있습니다
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  설명 내용
                </label>
                <textarea
                  id="description"
                  value={editedDescription || ''}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical text-gray-900 placeholder-gray-400"
                  placeholder="공휴일에 대한 설명을 입력하세요..."
                />
                <div className="mt-1 text-sm text-gray-500">
                  {editedDescription?.length || 0} 글자
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={handleManualSave}
                  disabled={!hasChanges || saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 사이드바 - 미리보기 및 메타데이터 */}
        <div className="space-y-6">
          {/* 미리보기 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">미리보기</h3>
            <div className="prose prose-sm max-w-none">
              <h4 className="text-base font-medium text-gray-900 mb-2">
                {description.holiday_name}
              </h4>
              <div className="text-gray-700 whitespace-pre-wrap">
                {editedDescription || '설명이 없습니다.'}
              </div>
            </div>
          </div>

          {/* 메타데이터 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">메타데이터</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">생성일:</span>
                <div className="text-gray-600">{formatDate(description.created_at)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">수정일:</span>
                <div className="text-gray-600">{formatDate(description.modified_at)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">수정자:</span>
                <div className="text-gray-600">{description.modified_by}</div>
              </div>
              {description.ai_model && (
                <div>
                  <span className="font-medium text-gray-700">AI 모델:</span>
                  <div className="text-gray-600">{description.ai_model}</div>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">신뢰도:</span>
                <div className="text-gray-600">{(description.confidence * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">마지막 사용:</span>
                <div className="text-gray-600">{formatDate(description.last_used)}</div>
              </div>
            </div>
          </div>

          {/* 작업 버튼 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">작업</h3>
            <div className="space-y-2">
              <Link
                href="/admin/descriptions"
                className="block w-full px-4 py-2 text-center bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                목록으로 돌아가기
              </Link>
              <button
                onClick={() => {
                  // country_name에서 country slug 생성
                  const countrySlug = getCountrySlugFromName(description.country_name) || 
                                    description.country_name.toLowerCase().replace(/\s+/g, '-');
                  const holidaySlug = createHolidaySlug(description.holiday_name);
                  const locale = description.locale === 'ko' ? 'ko' : 'en';
                  const url = `/${locale}/holiday/${countrySlug}/${holidaySlug}`;
                  window.open(url, '_blank');
                }}
                className="block w-full px-4 py-2 text-center bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                웹사이트에서 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}