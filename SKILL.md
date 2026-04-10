---
name: article-archivist
description: Use when the user shares an article, WeChat post, blog post, or reference page and wants it archived into an Obsidian-first knowledge base with raw backups, daily logs, wiki cards, summaries, insights, and index maintenance. Also use when setting up or repairing an article archiving pipeline. NOT for simple one-off reading, casual summarization without file writes, code/document repo organization, or short translation tasks.
---

# Article Archivist

完整文章归档与知识库管理工作流。安装并按本 skill 执行后，可获得与当前实例一致的归档体验。

## 前置依赖

1. **OpenClaw 环境**：需要 OpenClaw 提供的 `web_fetch`、`write`、`edit` 等内置工具（任何标准安装都具备）
2. **Node.js**：用于运行微信公众号提取脚本和 `bootstrap.js`（任何 OpenClaw 安装环境都有 Node）
3. **Python 3**：仅当微信公众号提取失败并启用 fallback 时需要（大多数系统自带）
4. **Obsidian 可选**：不是必须的。纯文件系统可以直接使用。

> 注：微信公众号文章提取能力已内嵌在本 skill 的 `vendor/wechat-article-extractor-skill/` 中，`node_modules` 完整打包，无需联网或额外安装。

## 一键初始化（Obsidian 优先）

如果你还没有目录结构，运行：

```bash
node /path/to/article-archivist/scripts/bootstrap.js [你的工作目录] [--vault /path/to/obsidian/vault]
```

- **默认尝试自动安装并配置 Obsidian**：
  - 检测系统是否已装 Obsidian，未装则自动安装（macOS: Homebrew，Linux: AppImage，Windows: winget）
  - **自动将 Obsidian CLI 加入系统 PATH**（写入 `~/.zshrc` 或 `~/.bashrc`，无需用户手动操作）
  - 自动启动 Obsidian，并提示开启 CLI 权限（设置 → 通用 → 高级 → 允许外部应用通信）
- 如果自动安装失败（如服务器无图形界面），**自动回退**到纯文件系统模式。
- 目录创建完成后，即可开始归档。

## 核心目录与作用

详见 [references/setup.md](references/setup.md)：

- `daily/` — 每日日志
- `raw/` — 原始文章归档
- `wiki/entities/` — 实体卡
- `wiki/concepts/` — 概念卡
- `wiki/comparisons/` — 对比分析
- `wiki/syntheses/` — 专题综述
- `summaries/` — 主题摘要
- `insights/` — 个人洞察
- `index.md` — 顶层索引
- `templates/` — 流程模板（可选）

## 完整工作流程

### 第 1 步：提取文章内容

#### 微信公众号（mp.weixin.qq.com）
- **首选**：调用 `wechat-article-extractor-skill`（见 [references/extraction-methods.md](references/extraction-methods.md)）
- **Fallback**：用 `scripts/extract_wechat_fallback.py` 做 curl + python 本地解析

#### 普通网页
- **首选**：`web_fetch`（OpenClaw 内置）
- **Fallback**：curl + readability / html2text 二次解析

### 第 2 步：原始归档（raw/）

- 保存为 `raw/YYYY-MM/YYYYMMDD-关键词-关键词.md`
- 头部必须包含：标题、来源、原文链接、归档时间
- 正文结构化：核心信息、关键数据、价值判断、关联标签
- 命名规则见 [references/naming-conventions.md](references/naming-conventions.md)
- 模板参考 [assets/raw-template.md](assets/raw-template.md)

### 第 3 步：写入 Daily Log 与 memory

- 在 `daily/YYYY-MM-DD.md` 记录：收到时间、文章标题、raw 路径、核心摘要、触发洞察
- 在 `memory/YYYY-MM-DD.md` 做 workspace 本地备份

### 第 4 步：知识加工决策

严格按照 [references/workflow-tree.md](references/workflow-tree.md) 做 Yes/No 判断：

- **必更**：`raw/` + `daily/` + `memory/`
- **条件触发**：
  - `wiki/entities/` — 新实体或老实体重大进展
  - `wiki/concepts/` — 新概念/新方法/新 trade-off
  - `summaries/` — 同主题 3 篇以上或单篇密度极高
  - `wiki/comparisons/` — 天然对比价值
  - `wiki/syntheses/` — 跨 2-3 篇形成高层判断
  - `insights/` — 对当前项目有明确启发且能沉淀为可复用判断
- **不更**：只是新闻噪音、重复已有结论、无后续复用价值

### 第 5 步：维护索引

只要 `wiki/`、`summaries/`、`insights/` 有新增或异动，**必须同步更新 `index.md`**。

## 关键原则

1. **目录存在 ≠ 必须更新**
   - 是否写入 `wiki/comparisons/syntheses/insights`，取决于文章本身的价值，而不是目录存在。

2. **Skill 的价值在坑点，不在复述说明书**
   - 优先阅读 [references/gotchas.md](references/gotchas.md) 和 [references/guardrails.md](references/guardrails.md)。这里面是模型自己搜不到的高语境知识。

3. **微信公众号必须优先用 skill**
   - 不要一上来就用 `web_fetch` 或 curl 抓公众号，先跑内嵌微信提取器。

4. **专题收口**
   - 当同一系列积累到 3-5 篇时，不要继续零散补卡，应该收成 `wiki/syntheses/` 专题综述。

5. **index.md 是硬约束**
   - 知识层有变动就必须更新索引，否则后续检索会断链。

6. **Skill 也要有自己的记忆**
   - 运行时状态放在 `state/`，不要把 skill 自己的运行状态和用户知识库混在一起。

7. **Text > Brain**
   - 所有判断和更新都必须落盘到文件，不要依赖“这次先记在心里，下次再写”。

## 快速查阅

- 目录搭建原理 → [references/setup.md](references/setup.md)
- 决策树 → [references/workflow-tree.md](references/workflow-tree.md)
- 提取方法 → [references/extraction-methods.md](references/extraction-methods.md)
- 命名规范 → [references/naming-conventions.md](references/naming-conventions.md)
- 高价值坑点 → [references/gotchas.md](references/gotchas.md)
- 护栏 → [references/guardrails.md](references/guardrails.md)
- Skill 状态 → [state/README.md](state/README.md)
- raw 模板 → [assets/raw-template.md](assets/raw-template.md)
- wechat 提取脚本 → [scripts/extract_wechat.js](scripts/extract_wechat.js)
- wechat fallback 脚本 → [scripts/extract_wechat_fallback.py](scripts/extract_wechat_fallback.py)
