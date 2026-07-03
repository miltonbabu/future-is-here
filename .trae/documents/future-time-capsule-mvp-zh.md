# 未来时间胶囊 — MVP 实施计划（2026年7月更新）

> **黑客马拉松背景：** TRAE Friends 郑州。在原始开发窗口之外持续迭代。现已成为一个功能齐全的双语 AI 报纸生成器，具备持久化存储、分享功能和局域网访问能力。

**目标：** 一个 Web 应用——用户输入姓名 + 团队 + 成就，上传照片，选择未来日期，即可获得一张精美的复古"未来报纸"头版——包含 AI 生成的文章、AI 生成的插图、二维码分享、双语支持（中/英），以及已保存报纸的归档视图。

---

## 当前状态

- **工作目录：** `d:\TRAE FRINEDS PROJECT\FUTURE TIME CAPSULE`
- **线上部署：** Vercel（`future-is-here.vercel.app`）
- **GitHub 仓库：** `github.com/miltonbabu/future-is-here`
- **局域网访问：** 通过 `npm start -H 0.0.0.0` 自托管 — 同一 WiFi 下的手机可访问

---

## 技术栈

- Next.js 16.2.9（App Router, Turbopack）+ React 19.2 + TypeScript 5.5
- Tailwind CSS 3.4 + Google Fonts（Special Elite, Courier Prime, Libre Caslon Display, Lora, Noto Serif SC, ZCOOL KuHei）
- 智谱 GLM-4-Flash（文章 + 成就生成，服务端）+ CogView-3-Flash（图片生成，免费，**服务端**）
- `qrcode.react` 4.2 用于二维码
- **Upstash Redis**（生产环境）/ 基于文件的 JSON（本地开发）用于服务端分享存储
- `@upstash/redis` 用于跨实例持久化分享令牌存储
- localStorage（客户端，最多 20 份报纸）+ 服务端分享令牌
- Vercel 部署（从 git 自动部署）或自托管（`npm start -H 0.0.0.0`）

---

## 分阶段实施（已完成）

### 第一阶段：基础设施 ✅
1. 使用 `create-next-app` 脚手架搭建 — TypeScript, Tailwind, App Router, Turbopack
2. 安装 `qrcode.react`
3. 在 `layout.tsx` 中加载 Google Fonts
4. Tailwind 配置自定义字体（报纸 + 落地页 + 中文）和颜色
5. `lib/types.ts` — Language, ArticleData（7 个字段）, CapsuleInput（6 个字段）
6. `lib/i18n.ts` — 完整中/英翻译, `formatDate()`, `t()`
7. `app/globals.css` — 纸张纹理、拍立得相框（`#f4ead5` 背景）、首字下沉、分栏线
8. `package.json` 脚本使用 `-H 0.0.0.0` 实现局域网访问

### 第二阶段：核心 AI 生成 ✅
1. `app/api/generate-article/route.ts` — GLM-4-Flash（主要）→ 预置模板（备用）。环境感知超时：Vercel 上 5 秒，自托管 30 秒。不使用 OpenAI（在中国超时）。
2. `app/api/generate-achievement/route.ts` — GLM 按分类 + 语言生成 3 个搞笑成就。失败时回退到预定义池。
3. `app/api/generate-image/route.ts` — 服务端图片生成，使用免费 CogView-3-Flash（约 3-5 秒）。始终自动生成，无需手动选择。文章响应缓存 5 分钟避免重复调用。
4. `app/form/page.tsx` — **服务端图片生成** via `/api/generate-image` — 使用免费 `cogview-3-flash` 模型。无客户端 API 密钥暴露。
5. `components/CapsuleForm.tsx` — 表单含照片上传（相机 + 图库）、照片压缩（400×500px JPEG @ 0.7）、4 个成就分类 + 吐槽池、"惊喜一下"按钮（AI 驱动）、语言切换同步
6. `handleGenerate()` 流程：文章 API → 服务端图片 → 分享令牌 → localStorage + 数据库 → 显示报纸

### 第三阶段：优化与分享 ✅
1. `app/api/share/route.ts` + `app/api/share/[token]/route.ts` — 服务端分享令牌（9 字符），Next.js 16 异步参数（`Promise<{ token: string }>`）。**Upstash Redis** 用于生产存储（30 天 TTL，通过环境变量自动检测）。本地开发回退到文件 JSON。**图片持久化：** POST 下载 CogView 插图 URL → 转为 base64 后存储 → 分享的报纸永远不会丢失插图。
2. `app/share/[token]/page.tsx` — 分享报纸视图，从 Redis/文件读取
3. `components/Landing.tsx` — 首页含二维码（→ /form，通过 useEffect 避免水合不匹配）、CTA 按钮
4. `components/Newspaper.tsx` — 报纸版式布局、拍立得照片、AI 插图、二维码（→ /share/token，≤300 字符）、复制链接、下载 PNG
5. `app/api/capsules/route.ts` — 用于客户端归档同步的 CRUD（GET/POST/DELETE）。通过 `lib/db.ts` 使用文件 JSON。
6. `lib/storage.ts` — localStorage CRUD（最多 20 条）+ 数据库同步，3 级配额回退
7. `lib/db.ts` — 使用 `fs` 模块的文件 JSON（Vercel 上用 `/tmp/.data/`）
8. 归档视图（"我的报纸"）— 悬浮按钮、已保存报纸网格、删除选项
9. 局域网访问 — `-H 0.0.0.0` 绑定，手机通过 `http://<PC-IP>:3000` 访问

---

## 项目结构

```
future-time-capsule/
├── app/
│   ├── api/
│   │   ├── capsules/route.ts            # CRUD 持久化（GET/POST/DELETE）
│   │   ├── generate-achievement/route.ts # AI 成就建议（GLM）
│   │   ├── generate-article/route.ts    # 文章生成（GLM → 备用模板）
│   │   ├── generate-image/route.ts      # 图片生成（免费 CogView-3-Flash）
│   │   └── share/
│   │       ├── route.ts                 # POST 创建分享令牌（Redis/文件）
│   │       └── [token]/route.ts         # GET 按令牌获取报纸
│   ├── form/page.tsx                    # 表单 + 客户端图片生成 + 归档
│   ├── share/[token]/page.tsx           # 分享报纸视图
│   ├── globals.css                      # 所有样式、纹理、字体
│   ├── layout.tsx                       # 根布局、Google Fonts
│   └── page.tsx                         # 落地页 + 分享报纸 hash 路由
├── components/
│   ├── CapsuleForm.tsx                  # 表单、照片上传、AI 惊喜一下
│   ├── Landing.tsx                      # 首页、二维码 → /form、CTA
│   └── Newspaper.tsx                    # 报纸渲染、二维码 → /share/token
├── lib/
│   ├── db.ts                            # 文件 JSON 数据库（fs, Vercel 用 /tmp）
│   ├── i18n.ts                          # 中/英翻译 + 日期格式化
│   ├── storage.ts                       # localStorage CRUD（最多 20 条）+ 数据库同步
│   └── types.ts                         # TypeScript 类型
├── .env.example                         # API 密钥占位符
├── .env.local                           # 真实 API 密钥（已 gitignore）
├── HACKATHON-SPEECH.md                  # 演讲稿
├── MF.md                                # 主文件（复现指南）
├── package.json                         # dev: -H 0.0.0.0, start: -H 0.0.0.0
├── tailwind.config.ts                   # 主题（字体、颜色）
└── tsconfig.json
```

---

## 关键决策（已锁定）

1. **框架 = Next.js 16 App Router。** 路由：`/`（落地页 + 分享）、`/form`（表单 + 生成）、`/share/<token>`（分享视图）。
2. **GLM 优先，文章不用 OpenAI。** GLM 在中国可访问；OpenAI 超时。已完全移除 OpenAI 回退。
3. **服务端图片生成（免费模型）。** 从付费 CogView-3-Plus 切换到免费 CogView-3-Flash（约 3-5 秒）。始终自动生成。服务端 API 路由 — 无客户端 API 密钥暴露。
4. **图片无 SVG 回退。** 如果图片生成失败，报纸不显示插图 — 没有空槽位。
5. **服务端分享令牌 + Upstash Redis。** `/share/abc123xyz` URL 将完整报纸（文章 + base64 图片）存储在 Redis 中。30 天 TTL。本地开发自动回退到文件 JSON。
6. **AI 插图持久化为 base64。** 保存分享时，服务端下载 CogView 图片 URL 并转为 base64。分享的报纸永远不会丢失插图 — CogView URL 会过期，base64 数据 URL 不会。
7. **照片压缩。** 400×500px JPEG @ 0.7（约 50-100KB）通过 canvas 处理。防止 localStorage 溢出。
8. **文章响应缓存。** 5 分钟 TTL LRU 缓存（最多 100 条）防止相同输入重复调用 GLM API。
9. **系统提示词缩短约 50%。** 减少每次文章生成调用的 token 消耗。
10. **本地开发用文件 JSON，生产用 Upstash Redis。** 无原生编译。Redis 通过环境变量自动检测。
11. **环境感知超时。** Vercel 上 5 秒（10 秒函数限制），自托管 30 秒（无限制）。
12. **Next.js 16 异步参数。** 路由处理器的 `params` 是 `Promise<{}>`，必须 await。
13. **水合安全的二维码。** 在 `useEffect` 中计算 `window.location.origin`，不在渲染期间计算。
14. **独立字体系统。** 落地页：衬线体（Caslon/Lora）。报纸：打字机体（Special Elite/Courier Prime）。
15. **局域网访问。** `dev` 和 `start` 脚本均使用 `-H 0.0.0.0`。

---

## 环境变量

| 变量 | 是否必需 | 说明 |
|---|---|---|
| `GLM_API_KEY` | 是 | 智谱 GLM API 密钥（服务端：文章 + 图片 + 成就生成）。图片使用免费 CogView-3-Flash。|
| `UPSTASH_REDIS_REST_URL` | 仅生产 | Upstash Redis REST URL — Vercel 自动设置。无则回退到文件 JSON。|
| `UPSTASH_REDIS_REST_TOKEN` | 仅生产 | Upstash Redis REST 令牌 — Vercel 自动设置。|

---

## API 端点

| 方法 | 路由 | 请求体 | 响应 |
|---|---|---|---|
| POST | `/api/generate-article` | `{ name, team, achievement, futureDate, language, category }` | `{ article: ArticleData, provider }` |
| POST | `/api/generate-achievement` | `{ category, language }` | `{ achievements: string[] \| null }` |
| POST | `/api/share` | `SharedNewspaper`（imageUrl 下载 → base64）| `{ token: string }` — 存入 Redis（生产）或文件（开发）|
| GET | `/api/share/<token>` | — | `SharedNewspaper` — 从 Redis（生产）或文件（开发）读取 |
| GET | `/api/capsules` | — | `DbCapsule[]` |
| POST | `/api/capsules` | `DbCapsule` | `{ success: true }` |
| DELETE | `/api/capsules` | `{ id }` | `{ success: true }` |

---

## 验证清单（最终）

1. ✅ `npm run dev` 启动无错误；所有 Google Fonts 加载正常
2. ✅ 表单验证：姓名 + 团队 + 成就 + 照片 + 日期均为必填
3. ✅ 照片上传：相机 + 图库按钮可用；照片显示复古棕褐色拍立得相框
4. ✅ 照片压缩至约 50-100KB（400×500px JPEG @ 0.7）
5. ✅ 文章生成：GLM 返回 7 字段 JSON；失败时回退到模板
6. ✅ 图片生成：CogView URL 客户端返回；失败时报纸不显示插图
7. ✅ 报纸渲染全部 7 个字段 + 照片 + 插图 + 二维码 + 分享链接
8. ✅ 二维码：首页 → /form，报纸 → /share/<token>（≤300 字符）
9. ✅ 复制链接：复制 /share/<token> URL
10. ✅ 分享链接打开完整报纸含所有图片（文章 + 照片 + 插图）
11. ✅ 分享插图持久化（CogView URL 下载 → 保存时转 base64）
12. ✅ Upstash Redis：分享跨 Vercel 实例持久化（生产环境）
13. ✅ 文件回退：本地无 Redis 环境变量时分享正常工作
14. ✅ 语言切换：切换所有 UI + 成就 + 报纸字体
15. ✅ 归档："我的报纸"显示已保存报纸缩略图 + 删除
16. ✅ 局域网：同一 WiFi 下手机可访问并生成（文章 + 图片）
17. ✅ 控制台无水合警告
18. ✅ 环境感知超时（Vercel 5 秒，自托管 30 秒）
19. ✅ 路由处理器中 Next.js 16 异步参数

---

## 未来增强

- [ ] 用户账号（认证）
- [ ] 下载报纸为 PDF
- [ ] 社交分享（Twitter、微信）
- [ ] 更多成就分类
- [ ] 自定义报纸名称
- [ ] 多种报纸版式
- [ ] 定时邮件发送到未来日期
- [ ] 永久服务端存储（用数据库替代 /tmp JSON）

---

*本 MVP 计划反映了未来时间胶囊应用截至 2026 年 7 月的实际实施状态。*
