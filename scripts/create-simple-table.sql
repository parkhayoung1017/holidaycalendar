-- 간단한 holiday_descriptions 테이블 생성
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
  
  UNIQUE(holiday_name, country_name, locale)
);

-- RLS 비활성화 (테스트용)
ALTER TABLE holiday_descriptions DISABLE ROW LEVEL SECURITY;