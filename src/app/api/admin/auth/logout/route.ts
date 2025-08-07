import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, deleteSession } from '@/lib/auth-utils';

export interface AdminLogoutResponse {
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 토큰 가져오기
    const token = request.cookies.get('admin-token')?.value;
    
    if (token) {
      try {
        // JWT 토큰 검증하여 세션 ID 추출
        const payload = verifyJWT(token);
        if (payload && payload.sessionId) {
          // 세션 삭제
          await deleteSession(payload.sessionId);
        }
      } catch (error) {
        console.error('세션 삭제 중 오류:', error);
        // 세션 삭제 실패해도 쿠키는 삭제
      }
    }
    
    // 성공 응답
    const response = NextResponse.json<AdminLogoutResponse>({
      success: true
    });
    
    // 쿠키 삭제
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 즉시 만료
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('로그아웃 처리 오류:', error);
    
    // 오류가 발생해도 쿠키는 삭제
    const response = NextResponse.json<AdminLogoutResponse>({
      success: true // 클라이언트 관점에서는 성공으로 처리
    });
    
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });
    
    return response;
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