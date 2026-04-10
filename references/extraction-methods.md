# 文章提取方法

## 微信公众号文章（mp.weixin.qq.com）

### 首选：`wechat-article-extractor-skill`（已内嵌）

本 skill 已将 `wechat-article-extractor-skill` 打包在 `vendor/` 目录下，无需额外安装。

```bash
node /path/to/article-archivist/scripts/extract_wechat.js "https://mp.weixin.qq.com/s/XXXX" [output.json]
```

- 返回结构化数据：标题、公众号、发布时间、HTML 正文、封面图等
- 这是微信公众号文章的**第一选择**
- 如果需要直接调用模块：

```bash
node -e "
const path = require('path');
const skillDir = path.join('/path/to/article-archivist', 'vendor/wechat-article-extractor-skill');
const { extract } = require(path.join(skillDir, 'scripts/extract.js'));
extract('https://mp.weixin.qq.com/s/XXXX').then(r => {
  const d = r.data;
  console.log(JSON.stringify({
    title: d.msg_title,
    account: d.account_name,
    author: d.msg_author,
    publish_time: d.msg_publish_time_str,
    desc: d.msg_desc,
    type: d.msg_type,
    cover: d.msg_cover,
    content: d.msg_content
  }, null, 2));
});
"
```

### Fallback：curl + python 本地解析

当 `wechat-article-extractor-skill` 失败时（如链接过期、内容被删、请求频繁），使用以下备用方案：

```bash
curl -s -o /tmp/wechat_article.html -L --compressed \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml" \
  -H "Accept-Language: zh-CN,zh;q=0.9" \
  "https://mp.weixin.qq.com/s/XXXX"

python3 << 'PYEOF'
import re, html
with open('/tmp/wechat_article.html', 'r', encoding='utf-8') as f:
    c = f.read()
idx = c.find('id="js_content"')
if idx >= 0:
    section = c[idx:c.find('</div>', idx)+6]
    section = re.sub(r'<script[^>]*>.*?</script>', '', section, flags=re.DOTALL)
    section = re.sub(r'<style[^>]*>.*?</style>', '', section, flags=re.DOTALL)
    section = re.sub(r'<!--.*?-->', '', section, flags=re.DOTALL)
    section = re.sub(r'<img[^>]*?data-src="([^"]+)"[^>]*?>', r'\n![图片](\1)\n', section)
    section = re.sub(r'<img[^>]*?>', '\n[图片]\n', section)
    section = re.sub(r'<br\s*/?>', '\n', section)
    section = re.sub(r'<p[^>]*?>', '\n', section)
    section = re.sub(r'<strong[^>]*?>', '**', section)
    section = re.sub(r'</strong>', '**', section)
    section = re.sub(r'<[^>]+>', '', section)
    section = html.unescape(section)
    lines = [l.strip() for l in section.split('\n') if l.strip()]
    print('\n'.join(lines))
PYEOF
```

## 普通网页文章

### 首选：`web_fetch`（OpenClaw 内置工具）

使用 OpenClaw 的 `web_fetch` 工具，设置 `extractMode=markdown`。

### Fallback

如果 `web_fetch` 提取不到正文（例如页面用 JS 渲染、或者内容被 CSS hidden）， fallback 方案：
- 用 `curl` 下载 HTML
- 用 `readability-lxml`、`BeautifulSoup`、`html2text` 等做二次解析

## 提取后处理原则

1. 提取到正文后，**不要直接复制原文全篇**。要做结构化摘要：
   - 核心信息（2-3 句话）
   - 关键数据 / 表格
   - 价值判断（为什么值得归档）
   - 关联标签
2. 保留原文链接和发布时间
3. 将结果写入 `raw/YYYY-MM/YYYYMMDD-keyword.md`
