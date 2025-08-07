import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecentModifications from '../RecentModifications';
import { HolidayDescription } from '@/types/admin';

const mockModifications: HolidayDescription[] = [
  {
    id: '1',
    holiday_id: 'new_year_2024',
    holiday_name: 'New Year\'s Day',
    country_name: 'United States',
    locale: 'ko',
    description: '새해 첫날입니다.',
    confidence: 0.95,
    generated_at: '2024-01-01T00:00:00Z',
    last_used: '2024-01-01T00:00:00Z',
    modified_at: '2024-01-01T12:00:00Z',
    modified_by: 'admin',
    is_manual: true,
    ai_model: 'gpt-4',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T12:00:00Z'
  },
  {
    id: '2',
    holiday_id: 'christmas_2024',
    holiday_name: 'Christmas Day',
    country_name: 'United Kingdom',
    locale: 'ko',
    description: '크리스마스입니다.',
    confidence: 0.98,
    generated_at: '2024-12-25T00:00:00Z',
    last_used: '2024-12-25T00:00:00Z',
    modified_at: '2024-12-25T10:00:00Z',
    modified_by: 'system',
    is_manual: false,
    ai_model: 'gpt-4',
    created_at: '2024-12-25T00:00:00Z',
    updated_at: '2024-12-25T10:00:00Z'
  }
];

describe('RecentModifications', () => {
  it('최근 수정 내역을 올바르게 표시한다', () => {
    render(<RecentModifications modifications={mockModifications} />);
    
    // 제목 확인
    expect(screen.getByText('최근 수정 내역')).toBeInTheDocument();
    
    // 수정 항목들 확인
    expect(screen.getByText('New Year\'s Day')).toBeInTheDocument();
    expect(screen.getByText('Christmas Day')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  it('수동/AI 구분 태그를 올바르게 표시한다', () => {
    render(<RecentModifications modifications={mockModifications} />);
    
    // 수동 작성 태그
    expect(screen.getByText('수동')).toBeInTheDocument();
    
    // AI 생성 태그
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('수정자 정보를 표시한다', () => {
    render(<RecentModifications modifications={mockModifications} />);
    
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('빈 목록일 때 적절한 메시지를 표시한다', () => {
    render(<RecentModifications modifications={[]} />);
    
    expect(screen.getByText('최근 수정 내역이 없습니다.')).toBeInTheDocument();
  });

  it('로딩 상태를 올바르게 표시한다', () => {
    render(<RecentModifications modifications={[]} isLoading={true} />);
    
    // 로딩 스켈레톤이 표시되는지 확인
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});