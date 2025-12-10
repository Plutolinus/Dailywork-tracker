-- AI Work Tracker - Supabase Database Schema
-- Run this in Supabase SQL Editor

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 工作会话表
CREATE TABLE work_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    total_screenshots INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 截图记录表
CREATE TABLE screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000),
    image_hash VARCHAR(64),  -- MD5 hash，用于判断图片是否重复
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 分析结果表
CREATE TABLE screenshot_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screenshot_id UUID NOT NULL REFERENCES screenshots(id) ON DELETE CASCADE,
    app_name VARCHAR(200),
    activity_type VARCHAR(50) CHECK (activity_type IN (
        'coding', 'browsing', 'documentation', 'communication', 
        'meeting', 'design', 'entertainment', 'other'
    )),
    description TEXT,
    detailed_content TEXT,
    tags TEXT[] DEFAULT '{}',
    confidence FLOAT DEFAULT 0,
    raw_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工作报告表
CREATE TABLE work_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
    summary TEXT,
    highlights TEXT[] DEFAULT '{}',
    time_breakdown JSONB DEFAULT '{}',
    productivity_score INTEGER DEFAULT 0,
    suggestions TEXT[] DEFAULT '{}',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_screenshots_session ON screenshots(session_id);
CREATE INDEX idx_screenshots_captured ON screenshots(captured_at DESC);
CREATE INDEX idx_analyses_screenshot ON screenshot_analyses(screenshot_id);
CREATE INDEX idx_reports_session ON work_reports(session_id);
CREATE INDEX idx_sessions_status ON work_sessions(status);

-- 增加截图计数的函数
CREATE OR REPLACE FUNCTION increment_screenshot_count(session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE work_sessions 
    SET total_screenshots = total_screenshots + 1 
    WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- 创建存储桶（用于截图）
INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 存储桶策略：允许上传和读取
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'screenshots');
CREATE POLICY "Allow authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots');

-- RLS 策略（可选，如果需要用户隔离）
-- ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE screenshot_analyses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_reports ENABLE ROW LEVEL SECURITY;
