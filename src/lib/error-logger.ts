// fs와 path는 서버 사이드에서만 사용
let fs: any;
let path: any;

if (typeof window === 'undefined') {
  fs = require('fs');
  path = require('path');
}

export interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

class ErrorLogger {
  private logDir: string = '';
  private logFile: string = '';

  constructor() {
    if (typeof window === 'undefined' && path) {
      this.logDir = path.join(process.cwd(), 'logs');
      this.logFile = path.join(this.logDir, 'error.log');
      this.ensureLogDirectory();
    }
  }

  private ensureLogDirectory() {
    if (typeof window === 'undefined') { // 서버 사이드에서만 실행
      try {
        if (!fs.existsSync(this.logDir)) {
          fs.mkdirSync(this.logDir, { recursive: true });
        }
      } catch (error) {
        console.error('Failed to create log directory:', error);
      }
    }
  }

  private formatLogEntry(entry: ErrorLogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  private writeToFile(entry: ErrorLogEntry) {
    if (typeof window === 'undefined') { // 서버 사이드에서만 파일 쓰기
      try {
        const logEntry = this.formatLogEntry(entry);
        fs.appendFileSync(this.logFile, logEntry);
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  private sendToConsole(entry: ErrorLogEntry) {
    const { level, message, error, context } = entry;
    const logMessage = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, error, context);
        break;
      case 'warn':
        console.warn(logMessage, context);
        break;
      case 'info':
        console.info(logMessage, context);
        break;
    }
  }

  log(level: ErrorLogEntry['level'], message: string, error?: Error, context?: Record<string, any>) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // 브라우저 환경에서 추가 정보 수집
    if (typeof window !== 'undefined') {
      entry.userAgent = navigator.userAgent;
      entry.url = window.location.href;
    }

    // 콘솔에 출력
    this.sendToConsole(entry);

    // 파일에 기록 (서버 사이드에서만)
    this.writeToFile(entry);

    // 프로덕션 환경에서는 외부 모니터링 서비스로 전송 (예: Sentry, LogRocket 등)
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: ErrorLogEntry) {
    // 실제 프로덕션에서는 Sentry, DataDog, LogRocket 등의 서비스 사용
    // 여기서는 기본 구현만 제공
    if (process.env.SENTRY_DSN) {
      // Sentry 연동 예시
      // Sentry.captureException(entry.error, { extra: entry.context });
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, error, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, undefined, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, undefined, context);
  }
}

// 싱글톤 인스턴스
const logger = new ErrorLogger();

// 편의 함수들
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, error, context);
}

export function logWarning(message: string, context?: Record<string, any>) {
  logger.warn(message, context);
}

export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(message, context);
}

// API 에러 전용 로깅 함수
export function logApiError(
  apiName: string, 
  error: Error, 
  requestData?: Record<string, any>
) {
  logger.error(`API Error: ${apiName}`, error, {
    api: apiName,
    requestData,
    timestamp: new Date().toISOString(),
  });
}

// 사용자 액션 에러 로깅
export function logUserActionError(
  action: string, 
  error: Error, 
  userContext?: Record<string, any>
) {
  logger.error(`User Action Error: ${action}`, error, {
    action,
    userContext,
    timestamp: new Date().toISOString(),
  });
}

export default logger;