import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { requireAuth, login, logout, checkAuthStatus } from '../auth-middleware';

// Mock auth-utils
vi.mock('../auth-utils', () => ({
  verifyJWT: vi.fn(),
  validateSession: vi.fn(),
  verifyPassword: vi.fn(),
  createSession: vi.fn(),
  generateJWT: vi.fn(),
  deleteSession: vi.fn(),
  getClientIP: vi.fn(),
  getUserAgent: vi.fn(),
  cleanupExpiredSessions: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('토큰이 없으면 401 오류를 반환한다', async () => {
      const request = new NextRequest('http://localhost:3000/admin/dashboard');
      
      const result = await requireAuth(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('인증 토큰이 없습니다.');
      expect(result.response?.status).toBe(401);
    });

    it('유효하지 않은 토큰이면 401 오류를 반환한다', async () => {
      const { verifyJWT } = await import('../auth-utils');
      (verifyJWT as any).mockReturnValue(null);
      
      const request = new NextRequest('http://localhost:3000/admin/dashboard');
      request.cookies.set('admin-token', 'invalid-token');
      
      const result = await requireAuth(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('유효하지 않은 토큰입니다.');
      expect(result.response?.status).toBe(401);
    });

    it('만료된 세션이면 401 오류를 반환한다', async () => {
      const { verifyJWT, validateSession } = await import('../auth-utils');
      (verifyJWT as any).mockReturnValue({ sessionId: 'test-session-id' });
      (validateSession as any).mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/admin/dashboard');
      request.cookies.set('admin-token', 'valid-token');
      
      const result = await requireAuth(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('세션이 만료되었습니다.');
      expect(result.response?.status).toBe(401);
    });

    it('유효한 토큰과 세션이면 성공을 반환한다', async () => {
      const { verifyJWT, validateSession } = await import('../auth-utils');
      const mockSession = {
        id: 'test-session-id',
        expires_at: '2025-08-05T00:00:00Z',
        created_at: '2025-08-04T00:00:00Z',
        last_accessed: '2025-08-04T12:00:00Z'
      };
      
      (verifyJWT as any).mockReturnValue({ sessionId: 'test-session-id' });
      (validateSession as any).mockResolvedValue(mockSession);
      
      const request = new NextRequest('http://localhost:3000/admin/dashboard');
      request.cookies.set('admin-token', 'valid-token');
      
      const result = await requireAuth(request);
      
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('test-session-id');
      expect(result.session).toEqual(mockSession);
    });
  });

  describe('login', () => {
    it('성공적인 로그인 시 토큰을 반환한다', async () => {
      const mockResponse = {
        success: true,
        sessionToken: 'test-token',
        expiresAt: '2025-08-05T00:00:00Z'
      };
      
      (global.fetch as any).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await login('correct-password');
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: 'correct-password' })
      });
    });

    it('잘못된 패스워드 시 오류를 반환한다', async () => {
      const mockResponse = {
        success: false,
        error: '잘못된 패스워드입니다.'
      };
      
      (global.fetch as any).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await login('wrong-password');
      
      expect(result).toEqual(mockResponse);
    });

    it('네트워크 오류 시 오류 메시지를 반환한다', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const result = await login('password');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인 중 오류가 발생했습니다.');
    });
  });

  describe('logout', () => {
    it('성공적인 로그아웃을 처리한다', async () => {
      const mockResponse = { success: true };
      
      (global.fetch as any).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await logout();
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    });

    it('네트워크 오류 시 오류 메시지를 반환한다', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const result = await logout();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('로그아웃 중 오류가 발생했습니다.');
    });
  });

  describe('checkAuthStatus', () => {
    it('인증된 상태를 올바르게 반환한다', async () => {
      const mockResponse = {
        success: true,
        valid: true,
        sessionId: 'test-session-id',
        expiresAt: '2025-08-05T00:00:00Z'
      };
      
      (global.fetch as any).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await checkAuthStatus();
      
      expect(result.isAuthenticated).toBe(true);
      expect(result.sessionId).toBe('test-session-id');
      expect(result.expiresAt).toBe('2025-08-05T00:00:00Z');
    });

    it('인증되지 않은 상태를 올바르게 반환한다', async () => {
      const mockResponse = {
        success: true,
        valid: false,
        error: '세션이 만료되었습니다.'
      };
      
      (global.fetch as any).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await checkAuthStatus();
      
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBe('세션이 만료되었습니다.');
    });

    it('네트워크 오류 시 인증되지 않은 상태를 반환한다', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const result = await checkAuthStatus();
      
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBe('인증 상태 확인 중 오류가 발생했습니다.');
    });
  });
});