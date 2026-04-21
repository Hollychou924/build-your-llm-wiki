# article-archivist Beta 试装最短说明

适合：
- 已经在用 OpenClaw / Claude Code
- 愿意试 Beta
- 想把文章沉淀到本地知识库，而不是只存链接

## 你会得到什么
装完后，你可以直接喂文章链接，系统会自动做：
- 抓正文
- 写 raw 原始归档
- 写 memory / 日记 / 总日志
- 做六目录检查
- 在有足够信号时生成实体 / 概念 / 对比 / 综述 / 主题总结 / 洞察初稿

## 最短上手步骤
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
- 检查 `skillhub` 是否存在
- 若不存在，则只安装 SkillHub CLI
- 再安装 `wechat-article-extractor-skill`

### 4. 喂第一篇文章
```bash
node /path/to/article-archivist/scripts/run_ingest.js <url> [--workspace /path/to/workspace]
```

## 建议你先试这 3 类链接
1. 微信公众号文章
2. 公司 / 产品官方博客
3. 普通技术长文网页

## 你试装时重点看什么
- 能不能顺利初始化
- 微信文章能不能抓到正文
- raw / memory / 日志有没有写出来
- 生成的知识草稿是否可读
- 有没有哪里让你卡住或需要猜

## 当前定位
这是 Beta。
已经能真实使用，但还在继续打磨：
- 更多网页类型的抽取稳定性
- 知识页语言质量
- 更顺滑的陌生用户体验

## 如果你只记一个入口
日常只需要记住：
```bash
node /path/to/article-archivist/scripts/run_ingest.js <url>
```
