---
name: article-archivist
description: Use when the user wants a personal knowledge-base starter kit that can archive WeChat posts, blog posts, and reference pages into a durable local system. Also use when initializing, repairing, or operating an article-ingestion workflow with raw archives, logs, memory, six-bucket checks, and knowledge-layer upgrades. NOT for simple read-only summarization, casual link saving, code repo organization, or translation-only tasks.
---

# Article Archivist

把文章归档、知识升级、索引维护和后续治理打包成一个可安装的 starter kit。

## 这个 skill 适合什么场景
- 用户想从 0 到 1 搭一个本地知识库
- 用户已经装了 OpenClaw / Claude Code，想装完 skill 就开始喂文章
- 用户要归档公众号、博客、长文网页，并长期沉淀成可检索知识
- 用户要修已有归档系统的目录、规则或提取链路

## 第一次使用
先运行：

```bash
node /path/to/article-archivist/scripts/bootstrap.js [workspace-dir] [--vault /path/to/obsidian/vault]
```

然后运行：

```bash
node /path/to/article-archivist/scripts/doctor.js
```

## 日常使用
用户发来文章链接后，统一走这个入口：

```bash
node /path/to/article-archivist/scripts/run_ingest.js <url> [--workspace /path/to/workspace]
```

这个入口会自动串起：
1. `fetch_article.js`
2. `archive_article.js`
3. `write_memory_log.js`
4. `check_upgrade_targets.js`

## 关键执行规则
1. 只要决定归档，必须写：`raw/`、`daily/`、`memory/`
2. 每篇都必须做六目录检查：实体 / 概念 / 对比 / 综述 / 主题总结 / 洞察
3. 满足触发条件时，默认升级知识层；不升级也必须写明原因
4. 只有知识层有变化时才更新 `index.md`
5. 去重必须按 workspace 隔离，不能跨知识库串 URL / rawPath
6. 微信公众号文章优先走已安装的 `wechat-article-extractor-skill`；若用户尚未安装，则引导或自动执行 `ensure_wechat_extractor.js`
7. `memory/` 必须留在 workspace，本地独立，不写进 vault

## 触发升级的强条件
满足任一条，至少升级 1 个知识层页面：
- 同一主题 7 天内新增 >= 3 篇高相关 raw
- 同一判断被 2 篇及以上材料互证
- 已经能清楚写出“这批材料真正说明了什么”

## 快速查阅
- 安装与目录说明：`references/setup.md`
- 决策树：`references/workflow-tree.md`
- 提取方法：`references/extraction-methods.md`
- 坑点：`references/gotchas.md`
- 护栏：`references/guardrails.md`
- Beta 试装说明：`references/beta-trial-guide.md`
- Beta 发布口径：`references/beta-release-note.md`
- skill 状态：`state/README.md`

## 当前版本定位
当前 Beta 目标是让用户装完后就能：
- 初始化系统骨架
- 直接喂第一篇文章
- 跑通完整归档主链
- 开始积累可升级的知识层
- 在熟人 / 内部试装场景里完成第一轮真实反馈闭环
