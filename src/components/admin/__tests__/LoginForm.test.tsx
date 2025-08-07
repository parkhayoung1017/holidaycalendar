import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginForm from '../LoginForm';

describe('LoginForm', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    mockOnLogin.mockClear();
  });

  it('패스워드 입력 필드가 렌더링된다', () => {
    render(<LoginForm onLogin={mockOnLogin} />);
    
    const passwordInput = screen.getByPlaceholderText('관리자 패스워드를 입력하세요');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('로그인 버튼이 렌더링된다', () => {
    render(<LoginForm onLogin={mockOnLogin} />);
    
    const loginButton = screen.getByRole('button', { name: '로그인' });
    expect(loginButton).toBeInTheDocument();
  });

  it('패스워드가 비어있으면 로그인 버튼이 비활성화된다', () => {
    render(<LoginForm onLogin={mockOnLogin} />);
    
    const loginButton = screen.getByRole('button', { name: '로그인' });
    expect(loginButton).toBeDisabled();
  });

  it('패스워드를 입력하면 로그인 버튼이 활성화된다', async () => {
    render(<LoginForm onLogin={mockOnLogin} />);
    
    const passwordInput = screen.getByPlaceholderText('관리자 패스워드를 입력하세요');
    const loginButton = screen.getByRole('button', { name: '로그인' });
    
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    
    expect(loginButton).not.toBeDisabled();
  });

  it('패스워드 표시/숨김 버튼이 작동한다', () => {
    render(<LoginForm onLogin={mockOnLogin} />);
    
    const passwordInput = screen.getByPlaceholderText('관리자 패스워드를 입력하세요');
    const toggleButton = screen.getByRole('button', { name: '' }); // 아이콘 버튼
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('폼 제출 시 onLogin이 호출된다', async () => {
    mockOnLogin.mockResolvedValue({ success: true });
    
    render(<LoginForm onLogin={mockOnLogin} />);
    
    const passwordInput = screen.getByPlaceholderText('관리자 패스워드를 입력하세요');
    const form = screen.getByRole('form');
    
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('testpassword');
    });
  });

  it('로그인 실패 시 오류 메시지가 표시된다', async () => {
    mockOnLogin.mockResolvedValue({ 
      success: false, 
      error: '잘못된 패스워드입니다.' 
    });
    
    render(<LoginForm onLogin={mockOnLogin} />);
    
    const passwordInput = screen.getByPlaceholderText('관리자 패스워드를 입력하세요');
    const form = screen.getByRole('form');
    
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('잘못된 패스워드입니다.')).toBeInTheDocument();
    });
  });

  it('로딩 중에는 버튼이 비활성화되고 로딩 텍스트가 표시된다', async () => {
    mockOnLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<LoginForm onLogin={mockOnLogin} />);
    
    const passwordInput = screen.getByPlaceholderText('관리자 패스워드를 입력하세요');
    const form = screen.getByRole('form');
    
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('로그인 중...')).toBeInTheDocument();
    });
    
    const loginButton = screen.getByRole('button', { name: /로그인 중/ });
    expect(loginButton).toBeDisabled();
  });

  it('빈 패스워드로 제출 시 오류 메시지가 표시된다', async () => {
    render(<LoginForm onLogin={mockOnLogin} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('패스워드를 입력해주세요.')).toBeInTheDocument();
    });
    
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('차단 상태일 때 입력 필드와 버튼이 비활성화된다', () => {
    render(<LoginForm onLogin={mockOnLogin} isBlocked={true} />);
    
    const passwordInput = screen.getByPlaceholderText('차단된 상태입니다');
    const loginButton = screen.getByRole('button', { name: '로그인' });
    
    expect(passwordInput).toBeDisabled();
    expect(loginButton).toBeDisabled();
    expect(screen.getByText('접근 차단')).toBeInTheDocument();
    expect(screen.getByText('보안을 위해 5분간 로그인이 차단되었습니다.')).toBeInTheDocument();
  });

  it('차단 상태일 때 폼 제출이 차단된다', async () => {
    render(<LoginForm onLogin={mockOnLogin} isBlocked={true} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('너무 많은 로그인 시도로 인해 차단되었습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
    });
    
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('로그인 시도 횟수가 표시된다', () => {
    render(<LoginForm onLogin={mockOnLogin} loginAttempts={3} />);
    
    expect(screen.getByText('보안 경고')).toBeInTheDocument();
    expect(screen.getByText('로그인 실패 3회. 2회 더 실패하면 5분간 차단됩니다.')).toBeInTheDocument();
  });

  it('로그인 시도 횟수가 0이면 경고가 표시되지 않는다', () => {
    render(<LoginForm onLogin={mockOnLogin} loginAttempts={0} />);
    
    expect(screen.queryByText('보안 경고')).not.toBeInTheDocument();
  });

  it('로그인 시도 횟수가 5 이상이면 경고가 표시되지 않는다 (차단 상태)', () => {
    render(<LoginForm onLogin={mockOnLogin} loginAttempts={5} isBlocked={true} />);
    
    expect(screen.queryByText('보안 경고')).not.toBeInTheDocument();
    expect(screen.getByText('접근 차단')).toBeInTheDocument();
  });

  it('보안 메시지가 표시된다', () => {
    render(<LoginForm onLogin={mockOnLogin} />);
    
    expect(screen.getByText(/이 시스템은 관리자만 접근할 수 있습니다/)).toBeInTheDocument();
    expect(screen.getByText(/모든 로그인 시도는 보안을 위해 기록됩니다/)).toBeInTheDocument();
    expect(screen.getByText(/무단 접근 시 법적 책임을 질 수 있습니다/)).toBeInTheDocument();
    expect(screen.getByText(/5회 연속 실패 시 5분간 자동 차단됩니다/)).toBeInTheDocument();
  });
});