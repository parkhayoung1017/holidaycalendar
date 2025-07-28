import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from '../SearchBar';
import { I18nProvider } from '@/lib/i18n-context';

// Mock the search utils
vi.mock('@/lib/search-utils', () => ({
  generateSearchResults: vi.fn().mockResolvedValue([
    {
      type: 'country-year',
      country: {
        code: 'US',
        name: '미국',
        flag: '🇺🇸',
        region: 'northAmerica'
      },
      year: 2025,
      url: '/ko/us-2025',
      title: '미국 2025',
      description: '2025년 미국 공휴일 보기'
    }
  ]),
  sortSearchResults: vi.fn().mockImplementation((results) => results)
}));

// Mock the translation loader
vi.mock('@/lib/translation-loader', () => ({
  loadTranslations: vi.fn().mockResolvedValue({
    common: {
      search: {
        placeholder: '국가명 또는 \'미국 2025\' 형태로 검색하세요',
        noResults: '검색 결과가 없습니다',
        noResultsHint: '다른 국가명이나 연도를 시도해보세요'
      },
      actions: {
        loading: '로딩 중...'
      }
    },
    countries: {
      countries: {
        US: '미국',
        KR: '대한민국'
      }
    }
  })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider initialLocale="ko">
    {children}
  </I18nProvider>
);

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('검색창이 올바르게 렌더링된다', async () => {
    render(
      <TestWrapper>
        <SearchBar />
      </TestWrapper>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/국가명 또는/);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('검색어 입력 시 검색 결과가 표시된다', async () => {
    render(
      <TestWrapper>
        <SearchBar />
      </TestWrapper>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/국가명 또는/);
      fireEvent.change(searchInput, { target: { value: '미국' } });
    });

    // 검색 결과가 나타날 때까지 기다림
    await waitFor(() => {
      expect(screen.getByText('미국 2025')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('검색어가 2글자 미만일 때는 검색 결과가 표시되지 않는다', async () => {
    render(
      <TestWrapper>
        <SearchBar />
      </TestWrapper>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/국가명 또는/);
      fireEvent.change(searchInput, { target: { value: '미' } });
    });

    // 검색 결과가 표시되지 않아야 함
    await waitFor(() => {
      expect(screen.queryByText('미국 2025')).not.toBeInTheDocument();
    });
  });

  it('onSearch 콜백이 호출된다', async () => {
    const onSearchMock = vi.fn();
    
    render(
      <TestWrapper>
        <SearchBar onSearch={onSearchMock} />
      </TestWrapper>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/국가명 또는/);
      fireEvent.change(searchInput, { target: { value: '미국' } });
    });

    await waitFor(() => {
      expect(onSearchMock).toHaveBeenCalledWith('미국');
    }, { timeout: 1000 });
  });
});