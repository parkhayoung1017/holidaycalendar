import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DescriptionList from '../DescriptionList';

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDescriptions = [
  {
    id: '1',
    holiday_id: 'new-year',
    holiday_name: '신정',
    country_name: '대한민국',
    locale: 'ko',
    description: '새해 첫날을 기념하는 공휴일입니다.',
    confidence: 0.95,
    generated_at: '2024-01-01T00:00:00Z',
    last_used: '2024-01-01T00:00:00Z',
    modified_at: '2024-01-01T00:00:00Z',
    modified_by: 'system',
    is_manual: false,
    ai_model: 'gpt-4',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    holiday_id: 'christmas',
    holiday_name: '크리스마스',
    country_name: '미국',
    locale: 'ko',
    description: '예수 그리스도의 탄생을 기념하는 기독교 축일입니다.',
    confidence: 0.98,
    generated_at: '2024-01-01T00:00:00Z',
    last_used: '2024-01-01T00:00:00Z',
    modified_at: '2024-01-01T00:00:00Z',
    modified_by: 'admin',
    is_manual: true,
    ai_model: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockPaginationResponse = {
  descriptions: mockDescriptions,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 2,
    itemsPerPage: 20
  }
};

describe('DescriptionList', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('설명 목록을 올바르게 렌더링한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginationResponse
    });

    render(<DescriptionList />);

    // 로딩 상태 확인
    expect(screen.getByRole('status')).toBeInTheDocument();

    // 데이터 로드 후 확인
    await waitFor(() => {
      expect(screen.getByText('신정')).toBeInTheDocument();
      expect(screen.getByText('크리스마스')).toBeInTheDocument();
    });

    expect(screen.getByText('대한민국')).toBeInTheDocument();
    expect(screen.getByText('미국')).toBeInTheDocument();
    expect(screen.getAllByText('AI 생성')).toHaveLength(2); // 필터 옵션과 테이블 셀
    expect(screen.getAllByText('수동 작성')).toHaveLength(2); // 필터 옵션과 테이블 셀
  });

  it('검색 기능이 올바르게 작동한다', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginationResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginationResponse
      });

    render(<DescriptionList />);

    await waitFor(() => {
      expect(screen.getByText('신정')).toBeInTheDocument();
    });

    // 검색어 입력
    const searchInput = screen.getByPlaceholderText('공휴일명 또는 국가명으로 검색');
    fireEvent.change(searchInput, { target: { value: '신정' } });

    // 디바운스 대기 (실제 타이머 사용)
    await new Promise(resolve => setTimeout(resolve, 600));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=%EC%8B%A0%EC%A0%95'), // URL 인코딩된 '신정'
        expect.any(Object)
      );
    });
  });

  it('필터링 기능이 올바르게 작동한다', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginationResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginationResponse
      });

    render(<DescriptionList />);

    await waitFor(() => {
      expect(screen.getByText('신정')).toBeInTheDocument();
    });

    // 언어 필터 선택 (ID로 선택)
    const localeSelect = screen.getByLabelText('언어');
    fireEvent.change(localeSelect, { target: { value: 'ko' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('locale=ko'),
        expect.any(Object)
      );
    });
  });

  it('페이지네이션이 올바르게 작동한다', async () => {
    const multiPageResponse = {
      descriptions: mockDescriptions,
      pagination: {
        currentPage: 1,
        totalPages: 3,
        totalItems: 50,
        itemsPerPage: 20
      }
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => multiPageResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...multiPageResponse,
          pagination: { ...multiPageResponse.pagination, currentPage: 2 }
        })
      });

    render(<DescriptionList />);

    await waitFor(() => {
      expect(screen.getByText('신정')).toBeInTheDocument();
    });

    // 페이지네이션 버튼 확인 (getAllByText 사용)
    expect(screen.getAllByText('다음')).toHaveLength(2); // 모바일과 데스크톱 버전
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // 2번 페이지 클릭
    fireEvent.click(screen.getByText('2'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });

  it('에러 상태를 올바르게 처리한다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('네트워크 오류'));

    render(<DescriptionList />);

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    });
  });

  it('빈 결과를 올바르게 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        descriptions: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 20
        }
      })
    });

    render(<DescriptionList />);

    await waitFor(() => {
      expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
    });
  });

  it('편집 링크가 올바르게 생성된다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginationResponse
    });

    render(<DescriptionList />);

    await waitFor(() => {
      expect(screen.getByText('신정')).toBeInTheDocument();
    });

    const editLinks = screen.getAllByText('편집');
    expect(editLinks).toHaveLength(2);
    expect(editLinks[0].closest('a')).toHaveAttribute('href', '/admin/descriptions/1/edit');
    expect(editLinks[1].closest('a')).toHaveAttribute('href', '/admin/descriptions/2/edit');
  });
});