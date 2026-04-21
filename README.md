# build-your-llm-wiki

Build your own local LLM Wiki from zero to one.

`build-your-llm-wiki` is a starter kit for OpenClaw / Claude Code users who want more than a bookmark pile. Feed it articles, WeChat posts, blog posts, and long-form references, and it helps turn them into a durable local knowledge system.

## Why this exists
Most "save for later" flows stop at the link or a one-shot summary. This repo is opinionated about a stronger workflow:
- keep a durable raw archive
- leave a trace in daily logs and memory
- decide whether the material deserves entities, concepts, comparisons, syntheses, summaries, or insights
- keep the whole system navigable instead of letting notes rot into a folder dump

## What you get
When you feed in a URL, the starter kit can:
- extract article text from WeChat posts, blogs, and long-form web pages
- write raw archives with lint checks
- write `memory/`, daily logs, and total logs
- run six-bucket upgrade checks
- generate first-draft knowledge pages
- update index/navigation when the knowledge layer changes

## Quick start
### 1. Bootstrap your workspace
```bash
node /path/to/article-archivist/scripts/bootstrap.js [workspace-dir] [--vault /path/to/obsidian/vault]
```

If Obsidian is not installed yet, the bootstrap flow will try to install it, add the CLI path to your shell, and launch Obsidian for you. If the Obsidian CLI is still not enabled, the script now prints an explicit next-step guide telling the user to open:
- `Settings -> General -> Advanced`
- enable `Allow external apps to communicate with Obsidian`
- restart Obsidian if needed
- reload the shell and re-run `node scripts/doctor.js`

If automatic install fails, the starter kit falls back to plain filesystem mode instead of blocking initialization.

### 2. Run doctor
```bash
node /path/to/article-archivist/scripts/doctor.js
```

### 3. Enable stable WeChat extraction (recommended)
```bash
node /path/to/article-archivist/scripts/ensure_wechat_extractor.js
```

This will:
- check whether `skillhub` is installed
- install SkillHub CLI if needed
- install `wechat-article-extractor-skill`
- let `extract_wechat.js` prefer the installed extractor over the bundled fallback

### 4. Ingest your first article
```bash
node /path/to/article-archivist/scripts/run_ingest.js <url> [--workspace /path/to/workspace]
```

For day-to-day use, this is the only command you need to remember:
```bash
node /path/to/article-archivist/scripts/run_ingest.js <url>
```

## Current status
**Beta, but real and usable.**

Good fit for:
- internal users
- friends and early testers
- people already comfortable with AI workflows
- anyone who wants to build a local-first knowledge base instead of just collecting links

Not promising yet:
- zero-learning-curve onboarding for complete newcomers
- perfect extraction stability for every site on the web
- final-polish writing quality for every generated knowledge draft

## 当前脚本角色
- `bootstrap.js`：初始化目录和默认骨架
- `doctor.js`：检查依赖与配置状态
- `run_ingest.js`：统一日常归档入口
- `fetch_article.js`：内容抓取路由
- `fetch_generic_web.js`：普通网页正文抽取
- `archive_article.js`：workspace 级查重、raw、图片、lint
- `write_memory_log.js`：写 `memory/`、日记、总日志
- `check_upgrade_targets.js`：六目录检查与升级判断
- `upgrade_knowledge.js`：生成实体 / 概念 / 对比 / 综述 / 洞察初稿
- `update_index.js`：知识层变动时更新导航
- `regression_test.js`：多 URL 回归测试
- `ensure_wechat_extractor.js`：检查 SkillHub CLI 并安装 `wechat-article-extractor-skill`
- `extract_wechat.js`：微信主链
- `extract_wechat_fallback.py`：微信 fallback

## Beta 验收建议
至少用 3 类链接各试一篇：
1. 微信公众号文章（先跑 `ensure_wechat_extractor.js`）
2. 公司 / 产品博客
3. 普通技术长文网页

跑默认回归：
```bash
node /path/to/article-archivist/scripts/regression_test.js
```

## 当前已具备
- 初始化骨架
- 自检
- 统一归档入口
- 微信 / 普通网页双入口
- raw / memory / 中英双日志
- 六目录检查
- 升级候选判断
- 知识页初稿生成
- 索引自动更新
- workspace 私有状态与去重隔离
- 默认 beta 回归集合

## 还在重点优化
- 更强的普通网页正文抽取
- 更像知识页语言的初稿压缩
- 更多站点的回归稳定性
- 更顺滑的陌生用户试装体验

## 适合现在怎么推进
最推荐的方式不是等“完美版”，而是：
1. 先找 1-3 个熟人试装
2. 让他们各喂 3 类链接
3. 回收安装卡点、抽取异常和知识页粗糙感
4. 再继续磨平说明与体验

## 快速查阅
- 搭建说明：`references/setup.md`
- 决策树：`references/workflow-tree.md`
- 坑点：`references/gotchas.md`
- 护栏：`references/guardrails.md`
- Beta 试装说明：`references/beta-trial-guide.md`
- Beta 发布口径：`references/beta-release-note.md`
- skill 状态：`state/README.md`
