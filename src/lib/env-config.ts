/**
 * 환경 변수 설정 및 검증 유틸리티
 */

// 환경 변수 타입 정의
interface EnvironmentConfig {
  // Supabase 설정
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  
  // 어드민 설정
  admin: {
    password: string;
    sessionSecret: string;
    sessionDuration: number;
  };
  
  // 기존 API 설정
  apis: {
    openai?: string;
    calendarific?: string;
  };
  
  // 환경 설정
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * 환경 변수를 검증하고 설정 객체를 반환
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // 필수 환경 변수 검증
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ADMIN_PASSWORD',
    'ADMIN_SESSION_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `다음 환경 변수들이 설정되지 않았습니다: ${missingVars.join(', ')}\n` +
      '.env.local 파일을 생성하고 필요한 환경 변수를 설정해주세요.'
    );
  }

  // 세션 시크릿 길이 검증
  const sessionSecret = process.env.ADMIN_SESSION_SECRET!;
  if (sessionSecret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET은 최소 32자 이상이어야 합니다.');
  }

  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    admin: {
      password: process.env.ADMIN_PASSWORD!,
      sessionSecret,
      sessionDuration: parseInt(process.env.ADMIN_SESSION_DURATION || '86400000') // 기본 24시간
    },
    apis: {
      openai: process.env.OPENAI_API_KEY,
      calendarific: process.env.CALENDARIFIC_API_KEY
    },
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production'
  };
}

/**
 * 개발 환경에서 환경 변수 설정 상태를 확인
 */
export function validateEnvironmentSetup(): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const config = getEnvironmentConfig();
    
    // Supabase 서비스 역할 키 확인
    if (!config.supabase.serviceRoleKey) {
      warnings.push('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. 어드민 기능이 제한될 수 있습니다.');
    }
    
    // API 키 확인
    if (!config.apis.openai) {
      warnings.push('OPENAI_API_KEY가 설정되지 않았습니다. AI 콘텐츠 생성 기능이 작동하지 않습니다.');
    }
    
    if (!config.apis.calendarific) {
      warnings.push('CALENDARIFIC_API_KEY가 설정되지 않았습니다. 공휴일 데이터 수집 기능이 제한될 수 있습니다.');
    }

    // 개발 환경에서 기본 패스워드 사용 경고
    if (config.isDevelopment && config.admin.password === 'Gkdud1017!@') {
      warnings.push('기본 어드민 패스워드를 사용하고 있습니다. 보안을 위해 변경을 권장합니다.');
    }

  } catch (error) {
    if (error instanceof Error) {
      errors.push(error.message);
    } else {
      errors.push('환경 변수 검증 중 알 수 없는 오류가 발생했습니다.');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * 환경 설정 정보를 콘솔에 출력 (개발 환경에서만)
 */
export function logEnvironmentInfo(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const validation = validateEnvironmentSetup();
  
  console.log('\n🔧 환경 설정 상태:');
  
  if (validation.isValid) {
    console.log('✅ 모든 필수 환경 변수가 설정되었습니다.');
  } else {
    console.log('❌ 환경 설정에 문제가 있습니다:');
    validation.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  경고사항:');
    validation.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log(''); // 빈 줄 추가
}