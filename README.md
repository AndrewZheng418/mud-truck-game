# 泥头车游戏 · 人生选择器

一个完整的「投胎选择器」全栈应用。前端是交互式人生配置页面，后端连接 LLM 自动生成基于配置的人生故事。

## 项目结构

```
mud_truck_game/
├── api/
│   └── generate-story.js    # Vercel Serverless Function：调用 LLM API 生成故事
├── public/
│   └── index.html           # 前端页面（单文件 HTML，含 CSS/JS）
├── package.json             # 项目配置（ESM）
├── vercel.json              # Vercel 路由配置
├── .env.example             # 环境变量模板
└── README.md                # 本文件
```

## 快速部署到 Vercel

### 1. 准备代码

将本项目文件夹 `mud_truck_game` 推送到你的 GitHub/GitLab 仓库，或者留在本地用 Vercel CLI 部署。

### 2. 获取阿里云百炼 API Key

1. 访问 [阿里云百炼](https://bailian.aliyun.com/)
2. 登录后进入「模型服务」→「API Key 管理」
3. 创建一个新的 API Key
4. 确认你已有可用模型额度（deepseek-v3 等）

### 3. 部署到 Vercel

**方式 A：通过 Vercel 网站（推荐新手）**

1. 访问 [vercel.com](https://vercel.com)，用 GitHub 账号登录
2. 点击「Add New Project」，导入你的仓库
3. 在「Environment Variables」中添加：
   - `LLM_API_KEY` = 你的阿里云百炼 API Key
   - `LLM_BASE_URL` = `https://dashscope.aliyuncs.com/compatible-mode/v1`
   - `LLM_MODEL` = `deepseek-v3`（或你购买的其他模型）
4. 点击「Deploy」，等待 1-2 分钟即可完成

**方式 B：通过 Vercel CLI**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入项目目录
cd mud_truck_game

# 登录并部署
vercel login
vercel --prod

# 部署完成后，在 Vercel Dashboard 里添加环境变量
```

### 4. 部署后配置环境变量（如果步骤 3 没配）

1. 进入 Vercel Dashboard → 你的项目 → Settings → Environment Variables
2. 添加以下三个变量：
   - `LLM_API_KEY`
   - `LLM_BASE_URL`
3. 添加后需要重新部署一次（Redeploy）才能生效

### 5. 访问使用

部署完成后，Vercel 会提供一个 `.vercel.app` 域名。打开即可使用全部功能：

- 勾选人生选项，凑成 0 分配置单
- 点击「开始新的人生」查看配置清单
- 点击「生成人生故事」让 AI 根据配置写一份完整的人生小说

## 本地开发

如果你只想在本地运行前端（不调用 AI 生成故事）：

直接用浏览器打开 `public/index.html` 即可，所有勾选、计分、随机、保存图片功能都能正常使用。AI 故事生成功能需要部署后端后才能工作。

## 自定义 API 地址（高级）

如果你不想用 Vercel，或想把后端部署在其他地方，可以在前端页面加载前设置：

```javascript
window.STORY_API_URL = 'https://你的后端地址/api/generate-story';
```

加在 `public/index.html` 的 `<script>` 标签最前面即可。

## 技术说明

- **前端**：纯原生 HTML/CSS/JS，单文件部署，使用 html2canvas 生成配置单图片
- **后端**：Vercel Serverless Function (Node.js ESM)，兼容 OpenAI API 格式
- **LLM 服务**：阿里云百炼（DashScope）兼容模式，支持 deepseek-v3、qwen-max 等模型

## 许可证

MIT
