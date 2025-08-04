import { createClient } from '@supabase/supabase-js';

// 환경 변수 검증 함수
function validateEnvironmentVariables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const missing = [];
  
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (missing.length > 0) {
    throw new Error(
      `다음 Supabase 환경 변수들이 설정되지 않았습니다: ${missing.join(', ')}\n` +
      '.env.local 파일을 생성하고 Supabase 프로젝트 설정을 추가해주세요.\n' +
      '자세한 내용은 .env.example 파일을 참고하세요.'
    );
  }
  
  return { supabaseUrl, supabaseAnonKey };
}

// 지연 초기화를 위한 변수들
let _supabase: any = null;
let _supabaseAdmin: any = null;

// 클라이언트용 Supabase 클라이언트 (브라우저에서 사용)
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!_supabase) {
      const { supabaseUrl, supabaseAnonKey } = validateEnvironmentVariables();
      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase[prop];
  }
});

// 서버용 Supabase 클라이언트 (관리자 권한, 서버에서만 사용)
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const { supabaseUrl } = validateEnvironmentVariables();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다. 서버 측 관리자 기능을 사용할 수 없습니다.');
    }
    
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  
  return _supabaseAdmin;
}

// Supabase 연결 상태 확인 함수
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('holiday_descriptions').select('count').limit(1);
    return !error;
  } catch (error) {
    console.warn('Supabase 연결 확인 실패:', error);
    return false;
  }
}