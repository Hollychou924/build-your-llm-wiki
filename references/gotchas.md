# Gotchas

这份文件只写高语境知识：模型自己搜不到，但实际使用时最容易踩坑的东西。

## 公众号文章提取

- **不要先用 `web_fetch` 抓微信公众号文章**。很多文章正文在隐藏容器里，`web_fetch` 常常只能拿到标题空壳。
- **首选** `scripts/extract_wechat.js`。
- 只有在内嵌微信提取器失败时，才用 `scripts/extract_wechat_fallback.py`。
- 使用微信提取器后，必须检查返回值里的 `done` / `code`，不要默认认为抓取一定成功。

## Obsidian / Workspace 边界

- `memory/` **必须留在 workspace 本地**，不要写进 Obsidian vault。
- `templates/` **也保持 workspace 本地**，不要和 vault 里的内容混在一起。
- vault 里应该只放：`raw/`、`daily/`、`wiki/`、`summaries/`、`insights/`、`index.md`。
- workspace 通过 symlink 指向 vault，这样既能被 Obsidian 看到，也保留本地编排层。

## index.md 更新条件

- **只有** `wiki/`、`summaries/`、`insights/` 有新增或内容变化时，才更新 `index.md`。
- 如果只是 `raw/`、`daily/`、`memory/` 有变化，不要碰 `index.md`。
- 否则 index 会越来越噪音化。

## Obsidian CLI

- Obsidian CLI **不是单独安装一个包**，而是：
  1. 安装 Obsidian 应用
  2. 把应用二进制加入 PATH
  3. 在应用设置中开启“Allow external apps to communicate with Obsidian”
- 即使脚本已经把 PATH 配好了，只要这个开关没打开，`obsidian` 命令仍然可能不可用。

## 归档判断

- 目录存在，不代表每篇文章都要写进去。
- `wiki/comparisons/`、`wiki/syntheses/`、`insights/` 都是**条件触发**，不是流水线必经步骤。
- 同一主题积累到 3-5 篇后，优先做 `synthesis`，不要无止境堆单篇补丁。

## 安装与回退

- Obsidian 是首选体验，但不是唯一运行模式。
- 如果环境没有 GUI、没有 brew/winget、或安装失败，必须直接回退到纯文件系统模式，不要卡死在安装阶段。
- Linux 的 AppImage 下载链接会过期，失效时要允许回退，而不是让整个 skill 失效。

## 文件命名

- `raw/` 文件名必须带日期，否则后续很难按时间检索。
- wiki 文件名不要带日期和版本号，保持长期稳定。
- `insights/` 用一句判断命名，比“某文章读后感”这类弱标题更可复用。
