-- 迁移脚本：为 screenshot_analyses 表添加详细内容字段
-- 在 Supabase SQL Editor 中运行此脚本

ALTER TABLE screenshot_analyses 
ADD COLUMN IF NOT EXISTS detailed_content TEXT;
