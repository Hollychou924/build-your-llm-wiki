# State

这个目录用于 skill 自己的状态记忆，不是用户知识库的一部分。

- `config.json`：最近一次初始化/运行的关键状态，包括最近的 vault/workspace、最近提取器、最近失败原因、已见 URL 哈希
- `config.example.json`：公开仓库里的示例状态模板
- `archive-log.jsonl`：每次 bootstrap / extract 的追加日志（一行一个 JSON）

目标：让 skill 记住“上次做到哪一步”，并能识别重复 URL、最近失败模式，而不是每次都从零开始。
