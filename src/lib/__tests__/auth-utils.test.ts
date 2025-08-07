import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  verifyPassword, 
  generateJWT, 
  verifyJWT, 
  getClientIP, 
  getUserAgent 
} from '../auth-utils';

// 환경 변수 설정
process.env.NODE_ENV = 'development';
process.env.ADMIN_PASSWORD = 'test-password';
process.env.ADMIN_SESSION_SECRET = 'test-secret-key-minimum-32-characters';
process.env.ADMIN_SESSION_DURATION = '3600000';

// Supabase 클라이언트 모킹
vi.mock('../supabase-client', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-session-id',
              session_token: 'test-token',
              expires_at: new Date(Date.now() + 3600000).toISOString(),
              created_at: new Date().toISOString(),
              last_accessed: new Date().toISOString()
            },
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gt: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-session-id',
                expires_at: new Date(Date.now() + 3600000).toISOString(),
                created_at: new Date().toISOString(),
                last_accessed: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
        lt: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyPassword', () => {
    it('개발 환경에서 올바른 패스워드를 검증해야 함', async () => {
      const result = await verifyPassword('Gkdud1017!@'); // 실제 환경 변수 값 사용
      expect(result).toBe(true);
    });

    it('개발 환경에서 잘못된 패스워드를 거부해야 함', async () => {
      const result = await verifyPassword('wrong-password');
      expect(result).toBe(false);
    });

    it('빈 패스워드를 거부해야 함', async () => {
      const result = await verifyPassword('');
      expect(result).toBe(false);
    });
  });

  describe('JWT 토큰 관리', () => {
    it('JWT 토큰을 생성하고 검증해야 함', () => {
      const sessionId = 'test-session-id';
      const token = generateJWT(sessionId);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      const payload = verifyJWT(token);
      expect(payload).toBeTruthy();
      expect(payload?.sessionId).toBe(sessionId);
    });

    it('유효하지 않은 JWT 토큰을 거부해야 함', () => {
      const invalidToken = 'invalid.jwt.token';
      const payload = verifyJWT(invalidToken);
      
      expect(payload).toBeNull();
    });

    it('만료된 JWT 토큰을 거부해야 함', () => {
      // 이미 만료된 토큰 (과거 시간으로 설정)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJ0ZXN0LXNlc3Npb24taWQiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid';
      const payload = verifyJWT(expiredToken);
      
      expect(payload).toBeNull();
    });
  });

  describe('클라이언트 정보 추출', () => {
    it('X-Forwarded-For 헤더에서 IP 주소를 추출해야 함', () => {
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            return null;
          })
        }
      } as unknown as Request;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe('192.168.1.1');
    });

    it('X-Real-IP 헤더에서 IP 주소를 추출해야 함', () => {
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'x-real-ip') return '192.168.1.2';
            return null;
          })
        }
      } as unknown as Request;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe('192.168.1.2');
    });

    it('User-Agent를 추출해야 함', () => {
      const testUserAgent = 'Mozilla/5.0 (Test Browser)';
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'user-agent') return testUserAgent;
            return null;
          })
        }
      } as unknown as Request;

      const userAgent = getUserAgent(mockRequest);
      expect(userAgent).toBe(testUserAgent);
    });

    it('헤더가 없을 때 undefined를 반환해야 함', () => {
      const mockRequest = {
        headers: {
          get: vi.fn(() => null)
        }
      } as unknown as Request;

      const ip = getClientIP(mockRequest);
      const userAgent = getUserAgent(mockRequest);
      
      expect(ip).toBeUndefined();
      expect(userAgent).toBeUndefined();
    });
  });
});