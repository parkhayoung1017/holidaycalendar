import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, validateSession } from './auth-utils';

export interface AuthenticatedRequest extends NextRequest {
  sessionId?: string;
  session?: {
    id: string;
    expires_at: string;
    created_at: string;
    last_accessed: string;
  };
}

/**
 * 어드민 인증 미들웨어
 * API 라우트에서 사용할 수 있는 인증 검증 함수
 */
export async function requireAuth(request: NextRequest): Promise<{
  success: boolean;
  sessionId?: string;
  session?: any;
  error?: string;
  response?: NextResponse;
}> {
  try {
    // 쿠키에서 토큰 가져오기
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return {
        success: false,
        error: '인증 토큰이 없습니다.',
        response: NextResponse.json(
          { success: false, error: '로그인이 필요합니다.' },
          { status: 401 }
        )
      };
    }
    
    // JWT 토큰 검증
    const payload = verifyJWT(token);
    if (!payload) {
      return {
        success: false,
        error: '유효하지 않은 토큰입니다.',
        response: NextResponse.json(
          { success: false, error: '유효하지 않은 인증 토큰입니다.' },
          { status: 401 }
        )
      };
    }
    
    // 세션 검증
    const session = await validateSession(payload.sessionId);
    if (!session) {
      return {
        success: false,
        error: '세션이 만료되었습니다.',
        response: NextResponse.json(
          { success: false, error: '세션이 만료되었습니다. 다시 로그인해주세요.' },
          { status: 401 }
        )
      };
    }
    
    return {
      success: true,
      sessionId: session.id,
      session: session
    };
    
  } catch (error) {
    console.error('인증 미들웨어 오류:', error);
    
    return {
      success: false,
      error: '인증 처리 중 오류가 발생했습니다.',
      response: NextResponse.json(
        { success: false, error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    };
  }
}

/**
 * API 라우트 핸들러를 인증으로 래핑하는 고차 함수
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await requireAuth(request);
    
    if (!authResult.success) {
      return authResult.response!;
    }
    
    // 인증된 요청에 세션 정보 추가
    (request as AuthenticatedRequest).sessionId = authResult.sessionId;
    (request as AuthenticatedRequest).session = authResult.session;
    
    return handler(request, ...args);
  };
}

/**
 * 클라이언트 사이드에서 사용할 인증 상태 확인 함수
 */
export async function checkAuthStatus(): Promise<{
  isAuthenticated: boolean;
  sessionId?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/admin/auth/verify', {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success && data.valid) {
      return {
        isAuthenticated: true,
        sessionId: data.sessionId,
        expiresAt: data.expiresAt
      };
    }
    
    return {
      isAuthenticated: false,
      error: data.error
    };
    
  } catch (error) {
    console.error('인증 상태 확인 오류:', error);
    return {
      isAuthenticated: false,
      error: '인증 상태 확인 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 로그인 함수
 */
export async function login(password: string): Promise<{
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password })
    });
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('로그인 오류:', error);
    return {
      success: false,
      error: '로그인 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 로그아웃 함수
 */
export async function logout(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return {
      success: false,
      error: '로그아웃 중 오류가 발생했습니다.'
    };
  }
}