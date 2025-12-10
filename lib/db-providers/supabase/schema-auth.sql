-- AI Work Tracker - 用户认证数据库 Schema
-- 在 Supabase SQL Editor 中运行此文件

-- ==================== 用户表 ====================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户名索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ==================== 更新现有表添加 user_id ====================

-- 为 work_sessions 添加 user_id
ALTER TABLE work_sessions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sessions_user ON work_sessions(user_id);

-- 为 screenshots 添加 user_id (方便查询)
ALTER TABLE screenshots 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_screenshots_user ON screenshots(user_id);

-- 为 work_reports 添加 user_id (方便查询)
ALTER TABLE work_reports 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reports_user ON work_reports(user_id);

-- ==================== 会话 Token 表 ====================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

-- 清理过期会话的函数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ==================== Row Level Security (可选) ====================
-- 如果需要更严格的数据隔离，可以启用 RLS

-- ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE screenshot_analyses ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can only see their own sessions" 
--     ON work_sessions FOR ALL 
--     USING (user_id = current_setting('app.current_user_id')::uuid);

-- CREATE POLICY "Users can only see their own screenshots" 
--     ON screenshots FOR ALL 
--     USING (user_id = current_setting('app.current_user_id')::uuid);

-- CREATE POLICY "Users can only see their own reports" 
--     ON work_reports FOR ALL 
--     USING (user_id = current_setting('app.current_user_id')::uuid);

