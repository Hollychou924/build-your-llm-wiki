# State

这个目录现在只用于 **skill 全局状态**，不是用户知识库的一部分。

- `config.json`：最近一次初始化/运行的关键状态，包括最近的 vault/workspace、最近失败原因、最近一次 workspace state 路径
- `config.example.json`：公开仓库里的示例状态模板
- `archive-log.jsonl`：skill 级事件日志（如 bootstrap）

## 重要变化

**去重与归档日志不再使用 skill 全局状态。**

每个知识库 workspace 会在自己的目录里维护私有状态：

- `.article-archivist/state/config.json`
- `.article-archivist/state/archive-log.jsonl`

这样不同 workspace 之间不会互相串 URL、串 rawPath、串运行历史。

目标：
- skill 全局状态负责诊断与最近一次使用信息
- workspace 私有状态负责本库 dedupe、归档日志、后续治理基础设施
