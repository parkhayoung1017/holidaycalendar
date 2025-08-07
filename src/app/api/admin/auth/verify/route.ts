import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, validateSession } from '@/lib/auth-utils';

export interface AdminVerifyResponse {
  success: boolean;
  valid: boolean;
  sessionId?: string;
  expiresAt?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 토큰 가져오기
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json<AdminVerifyResponse>({
        success: true,
        valid: false,
        error: '인증 토큰이 없습니다.'
      });
    }
    
    // JWT 토큰 검증
    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json<AdminVerifyResponse>({
        success: true,
        valid: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }
    
    // 세션 검증
    const session = await validateSession(payload.sessionId);
    if (!session) {
      return NextResponse.json<AdminVerifyResponse>({
        success: true,
        valid: false,
        error: '세션이 만료되었습니다.'
      });
    }
    
    // 성공 응답
    return NextResponse.json<AdminVerifyResponse>({
      success: true,
      valid: true,
      sessionId: session.id,
      expiresAt: session.expires_at
    });
    
  } catch (error) {
    console.error('세션 검증 오류:', error);
    
    return NextResponse.json<AdminVerifyResponse>(
      { 
        success: false, 
        valid: false,
        error: '서버 오류가 발생했습니다.' 
      },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}