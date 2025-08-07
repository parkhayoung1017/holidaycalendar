'use client';

import React, { useState, FormEvent } from 'react';

interface LoginFormProps {
  onLogin: (password: string) => Promise<{ success: boolean; error?: string }>;
  isBlocked?: boolean;
  loginAttempts?: number;
}

export default function LoginForm({ onLogin, isBlocked = false, loginAttempts = 0 }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Caps Lock 감지
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError('너무 많은 로그인 시도로 인해 차단되었습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    if (!password.trim()) {
      setError('패스워드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await onLogin(password);
      
      if (!result.success) {
        setError(result.error || '로그인에 실패했습니다.');
        setPassword(''); // 실패 시 패스워드 필드 초기화
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError('로그인 중 오류가 발생했습니다.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit} role="form">
      <div>
        <label htmlFor="password" className="sr-only">
          패스워드
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 sm:text-sm ${
              isBlocked 
                ? 'border-red-300 bg-red-50 cursor-not-allowed' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder={isBlocked ? "차단된 상태입니다" : "관리자 패스워드를 입력하세요"}
            disabled={isLoading || isBlocked}
            aria-describedby={`${error ? 'password-error' : ''} ${capsLockOn ? 'caps-lock-warning' : ''} password-help`}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Caps Lock 경고 */}
        {capsLockOn && (
          <div id="caps-lock-warning" className="mt-2 text-sm text-yellow-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Caps Lock이 켜져 있습니다
          </div>
        )}
        
        <div id="password-help" className="sr-only">
          관리자 패스워드를 입력하세요. 5회 연속 실패 시 5분간 차단됩니다.
        </div>
      </div>

      {/* 차단 상태 경고 */}
      {isBlocked && (
        <div className="rounded-md bg-red-100 border border-red-300 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                접근 차단
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>보안을 위해 5분간 로그인이 차단되었습니다.</p>
                <p className="mt-1">잠시 후 다시 시도해주세요.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 시도 횟수 경고 */}
      {!isBlocked && loginAttempts > 0 && loginAttempts < 5 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                보안 경고
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>로그인 실패 {loginAttempts}회. {5 - loginAttempts}회 더 실패하면 5분간 차단됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div id="password-error" className="rounded-md bg-red-50 p-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                로그인 오류
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading || !password.trim() || isBlocked}
          className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isBlocked 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </button>
      </div>

      <div className="text-center">
        <div className="text-xs text-gray-500 space-y-1">
          <p>🔒 이 시스템은 관리자만 접근할 수 있습니다</p>
          <p>📝 모든 로그인 시도는 보안을 위해 기록됩니다</p>
          <p>⚖️ 무단 접근 시 법적 책임을 질 수 있습니다</p>
          <p>🛡️ 5회 연속 실패 시 5분간 자동 차단됩니다</p>
          <p className="mt-2 text-gray-400">
            IP: {typeof window !== 'undefined' ? '기록됨' : '확인 중'} | 
            시간: {new Date().toLocaleString('ko-KR')}
          </p>
        </div>
      </div>
    </form>
  );
}