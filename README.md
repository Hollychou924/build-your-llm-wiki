# build-your-llm-wiki

从 0 到 1 搭建你自己的本地 LLM Wiki。

`build-your-llm-wiki` 是一个面向 OpenClaw / Claude Code 用户的 starter kit。它的目标不是帮你再多存一堆链接，而是把公众号文章、博客文章、长文网页逐步沉淀成一个可检索、可升级、可长期复用的本地知识系统。

## 为什么做这个
大多数“先收藏一下”的流程，最后停在了链接，或者停在一次性的摘要。这套仓库想解决的是更强的一条链路：
- 保留可回溯的原始归档
- 在 daily / memory / 总日志里留下痕迹
- 判断一篇材料该不该升级成实体、概念、对比、综述、主题总结或洞察
- 让整个知识系统始终可导航，而不是慢慢烂成文件夹堆

## 你会得到什么
当你喂进一个 URL，这套 starter kit 可以自动：
- 抽取公众号、博客和长文网页正文
- 写 raw 原始归档并跑 lint
- 写 `memory/`、daily 和总日志
- 跑六目录升级检查
- 生成知识页初稿
- 在知识层变化时更新 index / 导航页

## 快速开始
### 1. 初始化你的 workspace
```bash
node /path/to/article-archivist/scripts/bootstrap.js [workspace-dir] [--vault /path/to/obsidian/vault]
```

如果用户还没安装 Obsidian，bootstrap 会尝试自动安装、把 CLI 路径写进 shell、并自动启动 Obsidian。

如果 Obsidian 已经装了，但 CLI 还没开启，脚本会明确打印下一步引导，提示用户去：
- `设置 -> 通用 -> 高级`
- 开启 `允许外部应用与 Obsidian 通信`
- 必要时重启 Obsidian
- 重新加载 shell 后再执行 `node scripts/doctor.js`

如果自动安装失败，starter kit 不会卡死，而是自动回退到 plain filesystem mode 继续初始化。

### 2. 运行 doctor
```bash
node /path/to/article-archivist/scripts/doctor.js
```

### 3. 开启稳定的微信公众号抓取能力（推荐）
```bash
node /path/to/article-archivist/scripts/ensure_wechat_extractor.js
```

这一步会：
- 检查是否已安装 `skillhub`
- 必要时安装 SkillHub CLI
- 安装 `wechat-article-extractor-skill`
- 让 `extract_wechat.js` 优先使用已安装提取器，而不是只依赖仓内 fallback

### 4. 喂第一篇文章
```bash
node /path/to/article-archivist/scripts/run_ingest.js <url> [--workspace /path/to/workspace]
```

日常使用时，你只需要记住这一个入口：
```bash
node /path/to/article-archivist/scripts/run_ingest.js <url>
```

## 当前状态
**Beta，但已经可真实使用。**

当前更适合：
- 内部用户
- 熟人试装
- 已经熟悉 AI workflow 的用户
- 想搭本地优先知识库，而不是只想存链接的人

当前还不承诺：
- 完全零学习成本的陌生用户上手体验
- 所有网站都完美稳定的正文抽取
- 每一篇生成知识页都已经达到最终成稿质量

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
