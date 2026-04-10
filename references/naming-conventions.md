# 命名规范

## raw/ 文件命名

格式：`YYYYMMDD-关键词-关键词.md`

- 必须包含日期
- 用短横线 `-` 连接关键词
- 不用空格，不用特殊符号
- 中英文关键词可以混合，以一眼能识别为准

示例：
- `20260410-李飞飞-marble-11-world-model.md`
- `20260410-claude-code-memory-system-design.md`
- `20260410-星动纪元-benjie-olympics-三项第一.md`

## wiki/entities/ 命名

- 用业内通用名
- 英文产品可直接用英文，如 `Claude Code.md`
- 中文实体用中文通用名，如 `星动纪元.md`
- 不要带日期、不要加版本号

## wiki/concepts/ 命名

- 用概念名本身作文件名
- 示例：`Agent记忆系统.md`、`3D世界模型.md`

## wiki/comparisons/ 命名

- 格式一般为 `A vs B.md`
- 示例：`Hermes vs OpenClaw.md`

## wiki/syntheses/ 命名

- 用专题名本身
- 示例：`Claude Code记忆系统全景.md`

## summaries/ 命名

- 用主题名，可带连字符
- 示例：`claude-code-memory-system.md`

## insights/ 命名

- 用一句判断或短主题
- 示例：`记忆系统的价值不在存储而在检索.md`
- 示例：`成长即护城河是Agent产品的另一条路.md`

## Obsidian Wikilink

- 统一使用 `[[文件名]]` 语法
- 如果有多义，可用 `[[文件名|显示文本]]`
