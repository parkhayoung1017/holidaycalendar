-- Supabase 데이터베이스 스키마 설정 스크립트 (수정된 버전)
-- 이 스크립트는 Supabase 대시보드의 SQL 에디터에서 실행해야 합니다.

-- 1. holiday_descriptions 테이블 생성
CREATE TABLE IF NOT EXISTS holiday_descriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  holiday_id VARCHAR(255) NOT NULL,
  holiday_name VARCHAR(255) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  locale VARCHAR(10) NOT NULL DEFAULT 'ko',
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.95,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_by VARCHAR(100) DEFAULT 'system',
  is_manual BOOLEAN DEFAULT FALSE,
  ai_model VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 중복 방지를 위한 유니크 제약조건
  UNIQUE(holiday_name, country_name, locale)
);

-- 2. admin_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_holiday_descriptions_lookup 
ON holiday_descriptions(holiday_name, country_name, locale);

CREATE INDEX IF NOT EXISTS idx_holiday_descriptions_holiday_id 
ON holiday_descriptions(holiday_id);

CREATE INDEX IF NOT EXISTS idx_holiday_descriptions_modified_at 
ON holiday_descriptions(modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_holiday_descriptions_is_manual 
ON holiday_descriptions(is_manual);

CREATE INDEX IF NOT EXISTS idx_holiday_descriptions_country 
ON holiday_descriptions(country_name);

CREATE INDEX IF NOT EXISTS idx_holiday_descriptions_locale 
ON holiday_descriptions(locale);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token 
ON admin_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires 
ON admin_sessions(expires_at);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE holiday_descriptions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "holiday_descriptions_select_policy" ON holiday_descriptions
FOR SELECT USING (true);

-- 서비스 역할만 쓰기 가능
CREATE POLICY "holiday_descriptions_insert_policy" ON holiday_descriptions
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "holiday_descriptions_update_policy" ON holiday_descriptions
FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "holiday_descriptions_delete_policy" ON holiday_descriptions
FOR DELETE USING (auth.role() = 'service_role');

-- admin_sessions 테이블 RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_sessions_policy" ON admin_sessions
FOR ALL USING (auth.role() = 'service_role');

-- 5. 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_holiday_descriptions_updated_at 
BEFORE UPDATE ON holiday_descriptions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 데이터 검증 제약조건
ALTER TABLE holiday_descriptions 
ADD CONSTRAINT check_confidence_range 
CHECK (confidence >= 0.0 AND confidence <= 1.0);

ALTER TABLE holiday_descriptions 
ADD CONSTRAINT check_locale_format 
CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$');

ALTER TABLE holiday_descriptions 
ADD CONSTRAINT check_description_length 
CHECK (LENGTH(description) >= 10);

-- 7. 유틸리티 함수들
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- 통계 조회 함수
CREATE OR REPLACE FUNCTION get_holiday_descriptions_stats()
RETURNS TABLE(
    total_descriptions BIGINT,
    ai_generated_count BIGINT,
    manual_count BIGINT,
    completion_rate DECIMAL(5,2),
    countries_count BIGINT,
    locales_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_descriptions,
        COUNT(*) FILTER (WHERE NOT is_manual) as ai_generated_count,
        COUNT(*) FILTER (WHERE is_manual) as manual_count,
        ROUND((COUNT(*) * 100.0 / NULLIF(COUNT(*), 0)), 2) as completion_rate,
        COUNT(DISTINCT country_name) as countries_count,
        COUNT(DISTINCT locale) as locales_count
    FROM holiday_descriptions;
END;
$$ language 'plpgsql';

-- 국가별 통계 함수
CREATE OR REPLACE FUNCTION get_country_stats()
RETURNS TABLE(
    country_name TEXT,
    total_holidays BIGINT,
    ai_generated BIGINT,
    manual_created BIGINT,
    completion_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hd.country_name::TEXT,
        COUNT(*) as total_holidays,
        COUNT(*) FILTER (WHERE NOT hd.is_manual) as ai_generated,
        COUNT(*) FILTER (WHERE hd.is_manual) as manual_created,
        ROUND((COUNT(*) * 100.0 / NULLIF(COUNT(*), 0)), 2) as completion_rate
    FROM holiday_descriptions hd
    GROUP BY hd.country_name
    ORDER BY total_holidays DESC;
END;
$$ language 'plpgsql';

-- 8. 캐시 키 파싱 함수
CREATE OR REPLACE FUNCTION parse_cache_key(cache_key TEXT)
RETURNS TABLE(
    holiday_name TEXT,
    country_name TEXT,
    locale TEXT
) AS $$
DECLARE
    parts TEXT[];
BEGIN
    parts := string_to_array(cache_key, '-');
    
    IF array_length(parts, 1) >= 3 THEN
        RETURN QUERY SELECT 
            array_to_string(parts[1:array_length(parts, 1)-2], '-') as holiday_name,
            parts[array_length(parts, 1)-1] as country_name,
            parts[array_length(parts, 1)] as locale;
    END IF;
END;
$$ language 'plpgsql';

-- 9. 보안 제약조건
ALTER TABLE admin_sessions 
ADD CONSTRAINT check_session_token_length 
CHECK (LENGTH(session_token) >= 32);

ALTER TABLE admin_sessions 
ADD CONSTRAINT check_expires_at_future 
CHECK (expires_at > created_at);

-- 10. 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_holiday_descriptions_country_locale 
ON holiday_descriptions(country_name, locale);

CREATE INDEX IF NOT EXISTS idx_holiday_descriptions_manual_only 
ON holiday_descriptions(modified_at DESC) WHERE is_manual = true;

CREATE INDEX IF NOT EXISTS idx_holiday_descriptions_ai_only 
ON holiday_descriptions(confidence DESC) WHERE is_manual = false;

-- 완료 메시지
SELECT 'Supabase 스키마 설정이 완료되었습니다!' as message;