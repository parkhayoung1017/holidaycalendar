import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MissingDescriptionsList from '../MissingDescriptionsList';

// Mock MissingDescriptionEditor 컴포넌트
vi.mock('../MissingDescriptionEditor', () => ({
  default: ({ holiday, onClose, onSave }: any) => (
    <div data-testid="missing-description-editor">
      <div>편집 중: {holiday.holiday_name}</div>
      <button onClick={onClose}>닫기</button>
      <button onClick={onSave}>저장</button>
    </div>
  )
}));

const mockHolidays = [
  {
    holiday_id: 'us_2024_independence_day',
    holiday_name: 'Independence Day',
    country_name: 'United States',
    country_code: 'US',
    date: '2024-07-04',
    year: 2024
  },
  {
    holiday_id: 'kr_2024_chuseok',
    holiday_name: '추석',
    country_name: 'South Korea',
    country_code: 'KR',
    date: '2024-09-17',
    year: 2024
  }
];

describe('MissingDescriptionsList', () => {
  const mockOnDescriptionCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 상태를 올바르게 표시한다', () => {
    render(
      <MissingDescriptionsList
        holidays={[]}
        isLoading={true}
        onDescriptionCreated={mockOnDescriptionCreated}
      />
    );

    // 로딩 상태에서는 animate-pulse 클래스가 있는 요소가 있어야 함
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('설명 없는 공휴일 목록을 올바르게 표시한다', () => {
    render(
      <MissingDescriptionsList
        holidays={mockHolidays}
        isLoading={false}
        onDescriptionCreated={mockOnDescriptionCreated}
      />
    );

    expect(screen.getByText('설명 없는 공휴일 (2개)')).toBeInTheDocument();
    expect(screen.getByText('Independence Day')).toBeInTheDocument();
    expect(screen.getByText('추석')).toBeInTheDocument();
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('KR')).toBeInTheDocument();
  });

  it('공휴일이 없을 때 빈 상태를 표시한다', () => {
    render(
      <MissingDescriptionsList
        holidays={[]}
        isLoading={false}
        onDescriptionCreated={mockOnDescriptionCreated}
      />
    );

    expect(screen.getByText('설명 없는 공휴일이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('모든 공휴일에 설명이 있거나, 필터 조건에 맞는 공휴일이 없습니다.')).toBeInTheDocument();
  });

  it('설명 작성 버튼을 클릭하면 편집기가 열린다', async () => {
    render(
      <MissingDescriptionsList
        holidays={mockHolidays}
        isLoading={false}
        onDescriptionCreated={mockOnDescriptionCreated}
      />
    );

    const createButtons = screen.getAllByText('설명 작성');
    fireEvent.click(createButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('missing-description-editor')).toBeInTheDocument();
      expect(screen.getByText('편집 중: Independence Day')).toBeInTheDocument();
    });
  });

  it('편집기에서 닫기 버튼을 클릭하면 편집기가 닫힌다', async () => {
    render(
      <MissingDescriptionsList
        holidays={mockHolidays}
        isLoading={false}
        onDescriptionCreated={mockOnDescriptionCreated}
      />
    );

    const createButtons = screen.getAllByText('설명 작성');
    fireEvent.click(createButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('missing-description-editor')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('닫기');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('missing-description-editor')).not.toBeInTheDocument();
    });
  });

  it('편집기에서 저장 버튼을 클릭하면 콜백이 호출된다', async () => {
    render(
      <MissingDescriptionsList
        holidays={mockHolidays}
        isLoading={false}
        onDescriptionCreated={mockOnDescriptionCreated}
      />
    );

    const createButtons = screen.getAllByText('설명 작성');
    fireEvent.click(createButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('missing-description-editor')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnDescriptionCreated).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('missing-description-editor')).not.toBeInTheDocument();
    });
  });

  it('날짜를 올바르게 포맷한다', () => {
    render(
      <MissingDescriptionsList
        holidays={mockHolidays}
        isLoading={false}
        onDescriptionCreated={mockOnDescriptionCreated}
      />
    );

    expect(screen.getByText('2024년 7월 4일')).toBeInTheDocument();
    expect(screen.getByText('2024년 9월 17일')).toBeInTheDocument();
  });
});