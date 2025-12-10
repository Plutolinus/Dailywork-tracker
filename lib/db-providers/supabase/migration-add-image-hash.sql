-- 迁移脚本：为 screenshots 表添加 image_hash 字段
-- 用于判断截图是否重复，跳过相同图片的 AI 分析

ALTER TABLE screenshots 
ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64);

-- 可选：为 image_hash 添加索引，加速查询
CREATE INDEX IF NOT EXISTS idx_screenshots_image_hash ON screenshots(image_hash);

