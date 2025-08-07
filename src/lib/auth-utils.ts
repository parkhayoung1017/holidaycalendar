import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from './supabase';

// JWT 토큰 관련 타입
export interface AdminTokenPayload {
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AdminSession {
  id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  last_accessed: string;
  ip_address?: string;
  user_agent?: string;
}

// 환경 변수에서 설정 가져오기
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Gkdud1017!@';
const JWT_SECRET = process.env.ADMIN_SESSION_SECRET || 'default-secret-key';
const SESSION_DURATION = parseInt(process.env.ADMIN_SESSION_DURATION || '86400000'); // 24시간

/**
 * 패스워드 검증
 */
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  try {
    // 개발 환경에서는 평문 비교, 프로덕션에서는 해시 비교
    if (process.env.NODE_ENV === 'development') {
      return inputPassword === ADMIN_PASSWORD;
    }
    
    // 프로덕션에서는 bcrypt 해시 비교
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    return await bcrypt.compare(inputPassword, hashedPassword);
  } catch (error) {
    console.error('패스워드 검증 오류:', error);
    return false;
  }
}

/**
 * JWT 토큰 생성
 */
export function generateJWT(sessionId: string): string {
  const payload: Omit<AdminTokenPayload, 'iat' | 'exp'> = {
    sessionId
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: Math.floor(SESSION_DURATION / 1000) // 초 단위로 변환
  });
}

/**
 * JWT 토큰 검증
 */
export function verifyJWT(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    return decoded;
  } catch (error) {
    console.error('JWT 토큰 검증 실패:', error);
    return null;
  }
}

/**
 * 새 세션 생성
 */
export async function createSession(ipAddress?: string, userAgent?: string): Promise<AdminSession> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const sessionToken = generateRandomToken();
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .insert({
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`세션 생성 실패: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('세션 생성 오류:', error);
    throw error;
  }
}

/**
 * 세션 검증
 */
export async function validateSession(sessionId: string): Promise<AdminSession | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('*')
      .eq('id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // 마지막 접근 시간 업데이트
    await supabaseAdmin
      .from('admin_sessions')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', sessionId);
    
    return data;
  } catch (error) {
    console.error('세션 검증 오류:', error);
    return null;
  }
}

/**
 * 세션 삭제 (로그아웃)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('id', sessionId);
  } catch (error) {
    console.error('세션 삭제 오류:', error);
    throw error;
  }
}

/**
 * 만료된 세션 정리
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());
  } catch (error) {
    console.error('만료된 세션 정리 오류:', error);
  }
}

/**
 * 랜덤 토큰 생성 (최소 32자 이상)
 */
function generateRandomToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart1 = Math.random().toString(36).substring(2);
  const randomPart2 = Math.random().toString(36).substring(2);
  const randomPart3 = Math.random().toString(36).substring(2);
  
  return `${timestamp}-${randomPart1}-${randomPart2}-${randomPart3}`;
}

/**
 * 클라이언트 IP 주소 추출
 */
export function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return undefined;
}

/**
 * User Agent 추출
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}