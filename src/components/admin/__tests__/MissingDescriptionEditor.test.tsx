import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MissingDescriptionEditor from '../MissingDescriptionEditor';

// fetch mock
global.fetch = vi.fn();

const mockHoliday = {
  holiday_id: 'us_2024_independence_day',
  holiday_name: 'Independence Day',
  country_name: 'United States',
  country_code: 'US',
  date: '2024-07-04',
  year: 2024
};

describe('MissingDescriptionEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('공휴일 정보를 올바르게 표시한다', () => {
    render(
      <MissingDescriptionEditor
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('새 설명 작성')).toBeInTheDocument();
    expect(screen.getByText('Independence Day (United States)')).toBeInTheDocument();
    expect(screen.getByText('Independence Day')).toBeInTheDocument();
    expect(screen.getByText('United States (US)')).toBeInTheDocument();
    expect(screen.getByText('2024년 7월 4일')).toBeInTheDocument();
    expect(screen.getByText('2024년')).toBeInTheDocument();
  });

  it('작성자 이름과 설명을 입력할 수 있다', () => {
    render(
      <MissingDescriptionEditor
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const authorInput = screen.getByLabelText('작성자 이름');
    const descriptionTextarea = screen.getByLabelText('공휴일 설명');

    fireEvent.change(authorInput, { target: { value: '관리자' } });
    fireEvent.change(descriptionTextarea, { target: { value: '미국의 독립기념일입니다.' } });

    expect(authorInput).toHaveValue('관리자');
    expect(descriptionTextarea).toHaveValue('미국의 독립기념일입니다.');
  });

  it('필수 필드가 비어있으면 저장 버튼이 비활성화된다', () => {
    render(
      <MissingDescriptionEditor
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('저장');
    expect(saveButton).toBeDisabled();

    // 작성자만 입력
    const authorInput = screen.getByLabelText('작성자 이름');
    fireEvent.change(authorInput, { target: { value: '관리자' } });
    expect(saveButton).toBeDisabled();

    // 설명도 입력
    const descriptionTextarea = screen.getByLabelText('공휴일 설명');
    fireEvent.change(descriptionTextarea, { target: { value: '미국의 독립기념일입니다.' } });
    expect(saveButton).not.toBeDisabled();
  });

  it('취소 버튼을 클릭하면 onClose가 호출된다', () => {
    render(
      <MissingDescriptionEditor
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('ESC 키를 누르면 onClose가 호출된다', () => {
    render(
      <MissingDescriptionEditor
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('성공적으로 저장되면 onSave가 호출된다', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} })
    });

    render(
      <MissingDescriptionEditor
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // 필수 필드 입력
    const authorInput = screen.getByLabelText('작성자 이름');
    const descriptionTextarea = screen.getByLabelText('공휴일 설명');
    
    fireEvent.change(authorInput, { target: { value: '관리자' } });
    fireEvent.change(descriptionTextarea, { target: { value: '미국의 독립기념일입니다.' } });

    // 저장 버튼 클릭
    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/descriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holiday_id: 'us_2024_independence_day',
          holiday_name: 'Independence Day',
          country_name: 'United States',
          locale: 'ko',
          description: '미국의 독립기념일입니다.',
          is_manual: true,
          modified_by: '관리자'
        })
      });
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  it('저장 실패 시 에러 메시지를 표시한다', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '저장에 실패했습니다.' })
    });

    render(
      <MissingDescriptionEditor
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // 필수 필드 입력
    const authorInput = screen.getByLabelText('작성자 이름');
    const descriptionTextarea = screen.getByLabelText('공휴일 설명');
    
    fireEvent.change(authorInput, { target: { value: '관리자' } });
    fireEvent.change(descriptionTextarea, { target: { value: '미국의 독립기념일입니다.' } });

    // 저장 버튼 클릭
    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('저장에 실패했습니다.')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('저장 중에는 로딩 상태를 표시한다', async () => {
    // fetch를 지연시켜 로딩 상태 테스트
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: {} })
      }), 100))
    );

    render(
      <MissingDescriptionEditor
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // 필수 필드 입력
    const authorInput = screen.getByLabelText('작성자 이름');
    const descriptionTextarea = screen.getByLabelText('공휴일 설명');
    
    fireEvent.change(authorInput, { target: { value: '관리자' } });
    fireEvent.change(descriptionTextarea, { target: { value: '미국의 독립기념일입니다.' } });

    // 저장 버튼 클릭
    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    // 로딩 상태 확인
    expect(screen.getByText('저장 중...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // 저장 완료 대기
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  it('글자 수를 올바르게 표시한다', () => {
    render(
      <MissingDescriptionEditor
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const descriptionTextarea = screen.getByLabelText('공휴일 설명');
    const testText = '미국의 독립기념일입니다.';
    
    fireEvent.change(descriptionTextarea, { target: { value: testText } });
    
    expect(screen.getByText(`${testText.length} / 2000자`)).toBeInTheDocument();
  });
});