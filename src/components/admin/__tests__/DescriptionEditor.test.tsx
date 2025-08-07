import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DescriptionEditor from '../DescriptionEditor';

// Next.js 라우터 모킹
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDescription = {
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
};

describe('DescriptionEditor', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockPush.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('설명 데이터를 올바르게 로드하고 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDescription
    });

    render(<DescriptionEditor descriptionId="1" />);

    // 로딩 상태 확인
    expect(screen.getByRole('status')).toBeInTheDocument();

    // 데이터 로드 후 확인
    await waitFor(() => {
      expect(screen.getByDisplayValue('신정')).toBeInTheDocument();
      expect(screen.getByDisplayValue('대한민국')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ko')).toBeInTheDocument();
      expect(screen.getByText('AI 생성')).toBeInTheDocument();
    });

    // 설명 텍스트 확인
    const descriptionTextarea = screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.');
    expect(descriptionTextarea).toBeInTheDocument();
  });

  it('설명 편집 시 변경사항을 감지한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDescription
    });

    render(<DescriptionEditor descriptionId="1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.')).toBeInTheDocument();
    });

    // 설명 수정
    const textarea = screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.');
    fireEvent.change(textarea, { 
      target: { value: '새해 첫날을 기념하는 중요한 공휴일입니다.' } 
    });

    // 변경사항 감지 확인
    await waitFor(() => {
      expect(screen.getByText('변경사항이 있습니다')).toBeInTheDocument();
    });
  });

  it('자동 저장 기능이 올바르게 작동한다', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDescription
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockDescription,
          description: '새해 첫날을 기념하는 중요한 공휴일입니다.',
          modified_at: '2024-01-02T00:00:00Z'
        })
      });

    render(<DescriptionEditor descriptionId="1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.')).toBeInTheDocument();
    });

    // 설명 수정
    const textarea = screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.');
    fireEvent.change(textarea, { 
      target: { value: '새해 첫날을 기념하는 중요한 공휴일입니다.' } 
    });

    // 2초 후 자동 저장 트리거
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/descriptions/1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            description: '새해 첫날을 기념하는 중요한 공휴일입니다.',
            modified_by: 'admin'
          })
        })
      );
    });

    // 저장 완료 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('자동 저장되었습니다')).toBeInTheDocument();
    });
  });

  it('수동 저장 기능이 올바르게 작동한다', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDescription
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockDescription,
          description: '새해 첫날을 기념하는 중요한 공휴일입니다.',
          modified_at: '2024-01-02T00:00:00Z'
        })
      });

    render(<DescriptionEditor descriptionId="1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.')).toBeInTheDocument();
    });

    // 설명 수정
    const textarea = screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.');
    fireEvent.change(textarea, { 
      target: { value: '새해 첫날을 기념하는 중요한 공휴일입니다.' } 
    });

    await waitFor(() => {
      expect(screen.getByText('변경사항이 있습니다')).toBeInTheDocument();
    });

    // 저장 버튼 클릭
    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/descriptions/1',
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });
  });

  it('삭제 기능이 올바르게 작동한다', async () => {
    // confirm 모킹
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDescription
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

    render(<DescriptionEditor descriptionId="1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.')).toBeInTheDocument();
    });

    // 삭제 버튼 클릭
    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    // 확인 대화상자 확인
    expect(mockConfirm).toHaveBeenCalledWith('정말로 이 설명을 삭제하시겠습니까?');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/descriptions/1',
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include'
        })
      );
    });

    // 목록 페이지로 리다이렉트 확인
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/descriptions');
    });

    mockConfirm.mockRestore();
  });

  it('미리보기가 올바르게 업데이트된다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDescription
    });

    render(<DescriptionEditor descriptionId="1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.')).toBeInTheDocument();
    });

    // 미리보기 영역에서 원본 텍스트 확인
    expect(screen.getByText('새해 첫날을 기념하는 공휴일입니다.')).toBeInTheDocument();

    // 설명 수정
    const textarea = screen.getByDisplayValue('새해 첫날을 기념하는 공휴일입니다.');
    fireEvent.change(textarea, { 
      target: { value: '수정된 설명입니다.' } 
    });

    // 미리보기 업데이트 확인
    await waitFor(() => {
      expect(screen.getByText('수정된 설명입니다.')).toBeInTheDocument();
    });
  });

  it('에러 상태를 올바르게 처리한다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('설명을 불러오는데 실패했습니다'));

    render(<DescriptionEditor descriptionId="1" />);

    await waitFor(() => {
      expect(screen.getByText('설명을 불러오는데 실패했습니다')).toBeInTheDocument();
    });

    // 목록으로 돌아가기 링크 확인
    expect(screen.getByText('목록으로 돌아가기')).toBeInTheDocument();
  });

  it('존재하지 않는 설명에 대해 404 처리한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: '설명을 찾을 수 없습니다' })
    });

    render(<DescriptionEditor descriptionId="999" />);

    await waitFor(() => {
      expect(screen.getByText('설명을 불러오는데 실패했습니다')).toBeInTheDocument();
    });
  });
});