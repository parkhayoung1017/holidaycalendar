#!/usr/bin/env node

/**
 * 개발 서버 연결 테스트
 */

async function testServerConnection() {
  console.log('🔍 개발 서버 연결 테스트 중...');
  
  try {
    // fetch polyfill for older Node.js versions
    if (typeof fetch === 'undefined') {
      try {
        const { default: fetch } = await import('node-fetch');
        global.fetch = fetch;
      } catch (error) {
        console.error('❌ fetch를 사용할 수 없습니다. Node.js 18+ 또는 node-fetch 패키지가 필요합니다.');
        process.exit(1);
      }
    }

    const response = await fetch('http://localhost:3000/api/admin/descriptions/missing?limit=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 서버 연결 성공!');
      console.log(`📊 응답 상태: ${response.status}`);
      console.log(`📋 데이터 샘플:`, result);
      return true;
    } else {
      console.log(`❌ 서버 응답 오류: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('오류 내용:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ 서버 연결 실패:', error.message);
    console.log('\n💡 해결 방법:');
    console.log('1. 개발 서버가 실행 중인지 확인: npm run dev');
    console.log('2. 포트 3000이 사용 중인지 확인');
    console.log('3. 방화벽 설정 확인');
    return false;
  }
}

if (require.main === module) {
  testServerConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testServerConnection };