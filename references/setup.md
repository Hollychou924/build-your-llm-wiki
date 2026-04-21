# OpenClaw 文章归档体系搭建指南

本文档说明如何从零搭建与当前工作流一致的 Obsidian 优先的文章归档目录结构。

## 核心原则：Obsidian 优先

本 skill **首选 Obsidian** 作为知识库载体。运行初始化脚本时：

1. **检测 Obsidian 是否已安装**
2. **若未安装，尝试自动安装**（macOS 用 Homebrew 或 dmg；Linux 用 AppImage；Windows 用 winget 或提示）
3. **自动将 Obsidian CLI 加入系统 PATH**（写入 `~/.zshrc` 或 `~/.bashrc`，无需用户手动操作）
4. **安装后自动启动 Obsidian**，并提示用户开启 CLI（设置 → 通用 → 高级 → 允许外部应用通信）
5. **若自动安装失败**（例如无 GUI 环境），则回退到纯文件系统模式
6. **若 Obsidian 已安装但 CLI 未开启**，bootstrap 会在结束时打印明确引导，提示用户去 `Settings -> General -> Advanced` 开启 `Allow external apps to communicate with Obsidian`，然后重启 Obsidian、重新加载 shell，并执行 `node scripts/doctor.js`

## 一键初始化

```bash
node /path/to/article-archivist/scripts/bootstrap.js [工作目录] [--vault /path/to/obsidian/vault]
```

## 微信文章抓取（推荐额外安装）

如果要把微信公众号文章抓取做稳，推荐额外执行：

```bash
node /path/to/article-archivist/scripts/ensure_wechat_extractor.js
```

这一步会：
1. 检查是否已安装 `skillhub`
2. 若未安装，则按 SkillHub 官方方式安装 **CLI only**
3. 再执行 `skillhub install wechat-article-extractor-skill`

这样 starter kit 后续处理微信文章时，可以优先依赖专门的提取技能，而不是只靠内置 fallback。

- **默认行为**：检测/安装 Obsidian → 查找默认 vault → 在 vault 内创建目录 → 在工作目录创建符号链接
- **若不想用 Obsidian**（或无法安装），不传递 `--vault` 且脚本安装失败后，会自动在当前目录创建纯文件系统结构
- **手动指定 vault**：通过 `--vault` 参数强制使用某个 Obsidian vault 路径

## 目录结构（Obsidian Vault 内）

```
YourVault/
├── daily/               # 每日日志
├── raw/                 # 原始文章归档
├── wiki/
│   ├── entities/        # 实体卡片：公司、产品、人物、赛事
│   ├── concepts/        # 概念卡片：技术范式、方法论
│   ├── comparisons/     # 对比分析
│   └── syntheses/       # 专题综述
├── summaries/           # 主题摘要（比 wiki 更短，比 raw 更有结构）
├── insights/            # 个人洞察与判断
├── index.md             # 顶层索引
└── templates/           # 归档模板（可选）
```

## 每个目录的必要性

### `daily/`
- **作用**：记录“今天收到了什么、做了什么决策”。
- **为什么必须有**：没有 daily，你根本不知道自己哪天看过什么。
- **用法**：每天一个 `YYYY-MM-DD.md`，记录收到文章的时间、标题、归档路径、核心摘要和触发洞察。

### `raw/`
- **作用**：存放每篇文章的“原始+结构化”版本。
- **为什么必须有**：这是整个体系的事实来源（single source of truth）。
- **用法**：按 `raw/YYYY-MM/YYYYMMDD-keyword.md` 组织。文件头部必须包含：标题、来源、原文链接、归档时间。

### `wiki/entities/`
- **作用**：给具体实体建卡（公司 / 产品 / 人物 / 赛事 / 模型 / 协议）。
- **为什么需要**：当文章里出现值得反复引用的实体时，实体卡就是入口。
- **用法**：命名直接用通用名，如 `Claude Code.md`、`World Labs.md`。

### `wiki/concepts/`
- **作用**：抽象概念的长期沉淀。
- **为什么需要**：对方法论、设计范式、trade-off 做结构化总结。
- **用法**：命名用概念名，如 `Agent记忆系统.md`、`3D世界模型.md`。

### `wiki/comparisons/`
- **作用**：两个或多个对象的并排对比。
- **为什么需要**：不是每篇都要更，只有天然对比价值时才建。
- **用法**：如 `Hermes vs OpenClaw.md`。

### `wiki/syntheses/`
- **作用**：跨多篇、跨实体形成高层判断。
- **为什么需要**：单篇是事实，综述是趋势。
- **用法**：当某主题积累了 3-5 篇相关文章，值得收成专题时建。如 `Claude Code记忆系统全景.md`。

### `summaries/`
- **作用**：主题摘要，介于 raw 和 wiki 之间的中间层。
- **为什么需要**：后续高频回看时，summary 比 raw 短，比 wiki 容易更新。
- **用法**：单篇信息密度高、或同主题已积累多篇时建。如 `claude-code-memory-system.md`。

### `insights/`
- **作用**：个人判断，不是对文章的摘要，而是对未来的启发。
- **为什么需要**：提炼出“一句值得反复引用的话”。
- **用法**：只写有真实洞察的，禁止硬凑。如 `记忆系统的价值不在存储而在检索.md`。

### `index.md`
- **作用**：导航页，汇总实体、概念、对比、综述、摘要、洞察的入口。
- **为什么需要**：没有索引，知识库越大越难找。
- **用法**：只要 `wiki/`、`summaries/`、`insights/` 有新增/变动，就必须更新 `index.md`。

## 符号链接（推荐）

如果你希望 OpenClaw workspace 与 Obsidian vault 自动同步，`bootstrap.js` 会自动帮你创建符号链接：

```
workspace/
├── raw        -> /path/to/YourVault/raw
├── daily      -> /path/to/YourVault/daily
├── wiki       -> /path/to/YourVault/wiki
├── summaries  -> /path/to/YourVault/summaries
├── insights   -> /path/to/YourVault/insights
├── memory/    # workspace 本地（不同步到 Obsidian）
└── templates/ # workspace 本地（不同步到 Obsidian）
```

这样 OpenClaw 写入文件时，Obsidian 会实时看到。

## 纯文件系统回退方案

如果你的运行环境没有图形界面，Obsidian 无法安装，本 skill 会**自动回退**到纯文件系统模式：

- 所有目录直接创建在本地文件夹中
- 逻辑与 Obsidian 模式完全一致
- 只是缺少 Obsidian 的渲染、图谱、快速搜索等体验
