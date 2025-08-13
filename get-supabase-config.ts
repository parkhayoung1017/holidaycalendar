#!/usr/bin/env tsx

/**
 * 어드민 페이지에서 사용하는 Supabase 설정 추출 도구
 */

console.log('🔍 Supabase 설정 확인 도구\n');

console.log('📋 어드민 페이지에서 Supabase 설정을 확인하는 방법:');
console.log('');
console.log('1. 🌐 브라우저에서 어드민 페이지 접속:');
console.log('   http://localhost:3000/admin');
console.log('');
console.log('2. 🔧 개발자 도구 열기:');
console.log('   - Windows/Linux: F12 또는 Ctrl+Shift+I');
console.log('   - Mac: Cmd+Option+I');
console.log('');
console.log('3. 📡 Network 탭 선택');
console.log('');
console.log('4. 🎯 어드민 기능 사용:');
console.log('   - 공휴일 설명 조회 또는 저장 시도');
console.log('   - 로그인 시도');
console.log('');
console.log('5. 🔍 Supabase API 호출 찾기:');
console.log('   - "supabase.co"가 포함된 요청 찾기');
console.log('   - 요청 URL에서 프로젝트 URL 확인');
console.log('   - 요청 헤더에서 "apikey" 또는 "Authorization" 확인');
console.log('');
console.log('6. 📝 .env.local 파일에 설정 추가:');
console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
console.log('');
console.log('7. 🔄 개발 서버 재시작:');
console.log('   npm run dev');
console.log('');

// 현재 .env.local 파일 상태 확인
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');

console.log('📁 현재 .env.local 파일 상태:');
if (fs.existsSync(envPath)) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('✅ 파일 존재');
    console.log('📄 내용:');
    console.log(content);
  } catch (error) {
    console.log('❌ 파일 읽기 실패:', error);
  }
} else {
  console.log('❌ 파일 없음');
  
  // 템플릿 생성
  const template = `# Supabase 설정 (어드민에서 확인한 값으로 교체)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 서비스 역할 키 (선택사항 - 어드민 기능용)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI API (선택사항)
OPENAI_API_KEY=your-openai-key-here

# 개발 환경
NODE_ENV=development
`;
  
  try {
    fs.writeFileSync(envPath, template);
    console.log('✅ 템플릿 .env.local 파일 생성됨');
    console.log('⚠️  실제 Supabase 값으로 수정 필요');
  } catch (error) {
    console.log('❌ 템플릿 파일 생성 실패:', error);
  }
}

console.log('\n🚀 다음 단계:');
console.log('1. 위 방법으로 Supabase 설정 확인');
console.log('2. .env.local 파일에 실제 값 입력');
console.log('3. 개발 서버 재시작');
console.log('4. 공휴일 상세페이지에서 어드민 설명 확인');