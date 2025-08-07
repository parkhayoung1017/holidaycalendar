#!/usr/bin/env tsx

/**
 * 어드민 인증 시스템 테스트 스크립트
 */

import dotenv from 'dotenv';
import { 
  verifyPassword, 
  createSession, 
  generateJWT, 
  verifyJWT, 
  validateSession,
  deleteSession,
  cleanupExpiredSessions 
} from '../src/lib/auth-utils';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

async function testAuthSystem() {
  console.log('🔐 어드민 인증 시스템 테스트를 시작합니다...\n');

  try {
    // 1. 패스워드 검증 테스트
    console.log('1️⃣ 패스워드 검증 테스트');
    const correctPassword = process.env.ADMIN_PASSWORD || 'Gkdud1017!@';
    const wrongPassword = 'wrong-password';

    const validResult = await verifyPassword(correctPassword);
    const invalidResult = await verifyPassword(wrongPassword);

    console.log(`✅ 올바른 패스워드 검증: ${validResult ? '성공' : '실패'}`);
    console.log(`✅ 잘못된 패스워드 거부: ${!invalidResult ? '성공' : '실패'}\n`);

    // 2. 세션 생성 테스트
    console.log('2️⃣ 세션 생성 테스트');
    const session = await createSession('127.0.0.1', 'Test User Agent');
    console.log(`✅ 세션 생성 성공: ${session.id}`);
    console.log(`   - 만료 시간: ${session.expires_at}`);
    console.log(`   - IP 주소: ${session.ip_address}`);
    console.log(`   - User Agent: ${session.user_agent}\n`);

    // 3. JWT 토큰 생성 및 검증 테스트
    console.log('3️⃣ JWT 토큰 테스트');
    const jwtToken = generateJWT(session.id);
    console.log(`✅ JWT 토큰 생성: ${jwtToken.substring(0, 50)}...`);

    const payload = verifyJWT(jwtToken);
    console.log(`✅ JWT 토큰 검증: ${payload ? '성공' : '실패'}`);
    if (payload) {
      console.log(`   - 세션 ID: ${payload.sessionId}`);
      console.log(`   - 발급 시간: ${new Date(payload.iat * 1000).toISOString()}`);
      console.log(`   - 만료 시간: ${new Date(payload.exp * 1000).toISOString()}`);
    }
    console.log();

    // 4. 세션 검증 테스트
    console.log('4️⃣ 세션 검증 테스트');
    const validatedSession = await validateSession(session.id);
    console.log(`✅ 세션 검증: ${validatedSession ? '성공' : '실패'}`);
    if (validatedSession) {
      console.log(`   - 세션 ID: ${validatedSession.id}`);
      console.log(`   - 마지막 접근: ${validatedSession.last_accessed}`);
    }
    console.log();

    // 5. 유효하지 않은 토큰 테스트
    console.log('5️⃣ 유효하지 않은 토큰 테스트');
    const invalidToken = 'invalid.jwt.token';
    const invalidPayload = verifyJWT(invalidToken);
    console.log(`✅ 유효하지 않은 토큰 거부: ${!invalidPayload ? '성공' : '실패'}\n`);

    // 6. 존재하지 않는 세션 테스트
    console.log('6️⃣ 존재하지 않는 세션 테스트');
    const nonExistentSession = await validateSession('non-existent-session-id');
    console.log(`✅ 존재하지 않는 세션 거부: ${!nonExistentSession ? '성공' : '실패'}\n`);

    // 7. 세션 삭제 테스트
    console.log('7️⃣ 세션 삭제 테스트');
    await deleteSession(session.id);
    const deletedSession = await validateSession(session.id);
    console.log(`✅ 세션 삭제 확인: ${!deletedSession ? '성공' : '실패'}\n`);

    // 8. 만료된 세션 정리 테스트
    console.log('8️⃣ 만료된 세션 정리 테스트');
    await cleanupExpiredSessions();
    console.log('✅ 만료된 세션 정리 완료\n');

    console.log('🎉 모든 인증 시스템 테스트가 완료되었습니다!');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  testAuthSystem();
}