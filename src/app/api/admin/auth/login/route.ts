import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyPassword, 
  createSession, 
  generateJWT, 
  getClientIP, 
  getUserAgent,
  cleanupExpiredSessions 
} from '@/lib/auth-utils';

export interface AdminLoginRequest {
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 만료된 세션 정리 (백그라운드에서 실행)
    cleanupExpiredSessions().catch(console.error);
    
    const body: AdminLoginRequest = await request.json();
    const { password } = body;
    
    // 입력 검증
    if (!password) {
      return NextResponse.json<AdminLoginResponse>(
        { success: false, error: '패스워드를 입력해주세요.' },
        { status: 400 }
      );
    }
    
    // 패스워드 검증
    const isValidPassword = await verifyPassword(password);
    if (!isValidPassword) {
      // 보안을 위해 약간의 지연 추가
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json<AdminLoginResponse>(
        { success: false, error: '잘못된 패스워드입니다.' },
        { status: 401 }
      );
    }
    
    // 클라이언트 정보 추출
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);
    
    // 새 세션 생성
    const session = await createSession(ipAddress, userAgent);
    
    // JWT 토큰 생성
    const jwtToken = generateJWT(session.id);
    
    // 성공 응답
    const response: AdminLoginResponse = {
      success: true,
      sessionToken: jwtToken,
      expiresAt: session.expires_at
    };
    
    // HTTP-only 쿠키로 토큰 설정
    const nextResponse = NextResponse.json(response);
    nextResponse.cookies.set('admin-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24시간
      path: '/'
    });
    
    return nextResponse;
    
  } catch (error) {
    console.error('로그인 처리 오류:', error);
    
    return NextResponse.json<AdminLoginResponse>(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// OPTIONS 메서드 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}