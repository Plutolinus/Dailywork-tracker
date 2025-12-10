# 🎯 AI Work Tracker

AI 驱动的工作行为监控与日志生成系统。通过定时截屏和 AI 分析，自动追踪你的工作内容并生成详细的工作日报。

## ✨ 功能特性

- **📸 自动截屏** - 每 5 秒自动截取屏幕
- **🤖 AI 分析** - 使用 OpenAI GPT-4o 分析截图内容
- **📊 时间追踪** - 自动识别和统计各类活动时间
- **📋 智能报告** - 工作结束后自动生成详细工作日报
- **⏸️ 智能暂停** - 屏幕无变化时自动跳过分析，节省 API 费用

## 🛠️ 技术栈

- **前端框架**: Next.js 14 + React 18
- **桌面应用**: Electron
- **数据库**: Supabase (PostgreSQL)
- **AI 服务**: OpenAI GPT-4o Vision
- **样式**: CSS Modules

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件并填写以下配置：

```bash
# OpenAI API (必需 - 用于截图分析)
# 获取地址: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase 配置 (必需 - 数据存储)
# 获取地址: https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_SECRET=your-service-role-key
```

### 3. 初始化数据库

在 Supabase SQL Editor 中依次运行：

1. `lib/db-providers/supabase/schema.sql` - 基础表结构
2. `lib/db-providers/supabase/schema-auth.sql` - 用户认证表
3. `lib/db-providers/supabase/migration-add-detailed-fields.sql` - 添加详细内容字段
4. `lib/db-providers/supabase/migration-add-image-hash.sql` - 添加图片 hash 字段

### 4. 启动开发服务器

```bash
# 仅 Web 开发
pnpm dev

# Electron 桌面应用开发
pnpm electron:dev
```

### 5. 构建生产版本

```bash
# 构建 Electron 应用
pnpm electron:build
```

## 📁 项目结构

```
ai-work-tracker/
├── components/           # React 组件
│   ├── dashboard/       # 仪表盘组件
│   ├── timeline/        # 时间线组件
│   └── report/          # 报告组件
├── electron/            # Electron 主进程
│   ├── main.ts         # 主进程入口
│   └── preload.ts      # 预加载脚本
├── lib/                 # 核心业务逻辑
│   ├── ai/             # AI 分析模块 (OpenAI GPT-4o)
│   ├── auth/           # 用户认证
│   ├── db-providers/   # 数据库适配器
│   └── types.ts        # 类型定义
├── pages/               # Next.js 页面
│   ├── api/            # API 路由
│   ├── reports/        # 报告页面
│   └── timeline.tsx    # 时间线页面
└── styles/              # 样式文件
```

## 📱 使用说明

1. **注册/登录** - 首次使用需要注册账号
2. **开始记录** - 点击"开始记录"按钮开始工作追踪
3. **自动截屏** - 系统每 5 秒自动截取屏幕
4. **实时分析** - AI 自动分析截图内容和活动类型
5. **查看时间线** - 在时间线页面查看每个时间点的活动
6. **结束工作** - 点击"结束工作"生成工作日报
7. **查看报告** - 在报告页面查看详细的工作分析

## ⚙️ 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `OPENAI_API_KEY` | ✅ | OpenAI API 密钥，用于 GPT-4o 图片分析 |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名访问密钥 |
| `SUPABASE_SERVICE_ROLE_SECRET` | ✅ | Supabase 服务角色密钥（服务端使用） |

## 🔒 隐私说明

- 所有截图数据存储在你配置的 Supabase 项目中
- AI 分析通过 OpenAI API 进行，截图会发送到 OpenAI 服务器
- 建议用于个人工作追踪，避免截取敏感信息

## 📄 License

MIT
