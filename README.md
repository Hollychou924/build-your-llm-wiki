# build-your-llm-wiki

一个面向 OpenClaw / Claude Code 用户的个人知识库 starter kit。

仓库定位：帮你从 0 到 1 搭建自己的本地 LLM Wiki。

目标不是“把链接存下来”，而是让用户安装完之后，就能开始喂文章，并逐步长出：
- 原始归档
- memory / 日记 / 总日志
- 实体 / 概念 / 对比 / 综述 / 主题总结 / 洞察
- 导航页与后续治理能力

## 当前状态
**Beta，可试装。**

这版已经适合：
- 内部用户
- 熟人
- 熟悉 AI workflow 的用户
- 想开始搭本地知识库的人

这版暂不承诺：
- 陌生用户零学习成本上手
- 所有网页类型都完全稳定
- 所有知识初稿都已经达到最终成稿质量

## 你装完会得到什么
当你喂一篇文章链接进来，starter kit 会自动：
- 抓正文
- 判断文章来源类型
- 写 raw 原始归档
- 跑 markdown lint
- 写 `memory/`
- 写日记 / 总日志
- 做六目录检查
- 生成知识层升级草稿 / 初稿
- 在知识层变化时更新首页索引

## 最短使用路径
### 1. 初始化
```bash
node /path/to/article-archivist/scripts/bootstrap.js [workspace-dir] [--vault /path/to/obsidian/vault]
```

### 2. 自检
```bash
node /path/to/article-archivist/scripts/doctor.js
```

### 3. 开启微信文章能力（推荐）
```bash
node /path/to/article-archivist/scripts/ensure_wechat_extractor.js
```

这一步会：
- 先检查是否已安装 `skillhub`
- 若未安装，则按 SkillHub 官方方式安装 **CLI only**
- 再通过 `skillhub install wechat-article-extractor-skill` 安装微信文章提取技能
- 安装后 `extract_wechat.js` 会优先使用这个已安装技能，而不是只依赖内嵌 vendor

### 4. 喂第一篇文章
```bash
node /path/to/article-archivist/scripts/run_ingest.js <url> [--workspace /path/to/workspace]
```

以后日常只需要记住一个入口：
```bash
node /path/to/article-archivist/scripts/run_ingest.js <url>
```

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
