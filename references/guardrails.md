# Guardrails

## Do Not

- 不要在未确认 vault 路径的情况下随意创建 symlink 到陌生目录。
- 不要把 `memory/` 写入 Obsidian vault。
- 不要对同一个 URL 重复归档而不检查已有记录。
- 不要在微信文章场景中默认用 `web_fetch` 替代微信提取器。
- 不要因为 Obsidian 安装失败就中止整个流程；应直接切到纯文件系统模式。
- 不要在仅做阅读/总结的请求里默认执行文件写入。

## Must

- 只要决定归档，必须写：`raw/`、`daily/`、`memory/`。
- 只要 `wiki/`、`summaries/`、`insights/` 有变化，必须更新 `index.md`。
- 微信提取器返回后，必须检查成功状态再继续。
- 初始化时优先尝试 Obsidian；失败后要明确告知已回退到 plain filesystem。
- 在修改 shell rc 文件前，先检查是否已存在 PATH 注入，避免重复追加。

## Failure Handling

- 微信提取失败：切换到 `extract_wechat_fallback.py`。
- Obsidian 安装失败：回退到 plain filesystem。
- CLI 未启用：继续完成目录初始化，但打印清晰提示，不阻塞归档。
- 默认 vault 未找到：提示用户通过 `--vault` 显式传入，不要盲猜。
