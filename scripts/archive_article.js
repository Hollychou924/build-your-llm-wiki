#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node archive_article.js <article-json>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workspace = data.workspace || process.cwd();
const url = data.url || '';
const title = data.title || 'Untitled';
const source = data.source || 'unknown';
const dateStr = (data.publishDate || new Date().toISOString()).slice(0, 10);
const date = dateStr.replace(/-/g, '');
const slug = (data.slug || title)
  .replace(/[\s/]+/g, '-')
  .replace(/[^\w\-\u4e00-\u9fa5]/g, '')
  .slice(0, 80) || 'article';

const rawDir = path.join(workspace, 'raw', `${date.slice(0, 4)}-${date.slice(4, 6)}`);
const assetDir = path.join(rawDir, '图片素材', `${date}-${slug}.assets`);
const rawPath = path.join(rawDir, `${date}-${slug}.md`);
const workspaceStateDir = path.join(workspace, '.article-archivist', 'state');
const workspaceStateConfigPath = path.join(workspaceStateDir, 'config.json');
const dedupePath = path.join(workspaceStateDir, 'archive-log.jsonl');

fs.mkdirSync(rawDir, { recursive: true });
fs.mkdirSync(assetDir, { recursive: true });
fs.mkdirSync(workspaceStateDir, { recursive: true });
if (!fs.existsSync(workspaceStateConfigPath)) {
  fs.writeFileSync(workspaceStateConfigPath, JSON.stringify({
    version: 1,
    workspacePath: workspace,
    createdAt: new Date().toISOString(),
    lastArchiveAt: null,
    lastArchivedUrl: null
  }, null, 2) + '\n');
}
if (!fs.existsSync(dedupePath)) {
  fs.writeFileSync(dedupePath, '');
}

if (url && fs.existsSync(dedupePath)) {
  const lines = fs.readFileSync(dedupePath, 'utf8').split('\n').filter(Boolean).reverse();
  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (record.event === 'archive' && record.url === url) {
        console.log(JSON.stringify({
          ok: true,
          duplicate: true,
          url,
          rawPath: record.rawPath || '',
          assetDir: record.rawPath ? path.join(path.dirname(record.rawPath), '图片素材', `${path.basename(record.rawPath, '.md')}.assets`) : assetDir,
          lintOk: true,
          hash: record.hash || '',
          next: ['write memory/log', 'check upgrade targets']
        }, null, 2));
        process.exit(0);
      }
    } catch {}
  }
}

const body = data.markdown || data.content || data.text || data.html || '';
const rating = data.rating || { type: '未评级', knowledgeGain: 0, expressionValue: 0, actionValue: 0, verdict: '待补充' };
const content = [
  `# ${title}`,
  '',
  `- 来源: ${source}`,
  `- 原文链接: ${url}`,
  `- 发布时间: ${dateStr}`,
  `- 归档时间: ${new Date().toISOString()}`,
  '',
  '## 文章评级',
  `- 类型: ${rating.type}`,
  `- 知识增量: ${rating.knowledgeGain}`,
  `- 表达价值: ${rating.expressionValue}`,
  `- 行动价值: ${rating.actionValue}`,
  `- 一句话判断: ${rating.verdict}`,
  '',
  body,
  ''
].join('\n');

fs.writeFileSync(rawPath, content);

let lintOk = false;
try {
  execFileSync('python3', [path.join(__dirname, 'archive_markdown_lint.py'), rawPath], { stdio: 'pipe' });
  lintOk = true;
} catch {
  lintOk = false;
}

const hash = crypto.createHash('sha1').update(url || rawPath).digest('hex');
fs.appendFileSync(dedupePath, JSON.stringify({ time: new Date().toISOString(), event: 'archive', workspace, url, rawPath, hash }) + '\n');
fs.writeFileSync(workspaceStateConfigPath, JSON.stringify({
  version: 1,
  workspacePath: workspace,
  createdAt: JSON.parse(fs.readFileSync(workspaceStateConfigPath, 'utf8')).createdAt || new Date().toISOString(),
  lastArchiveAt: new Date().toISOString(),
  lastArchivedUrl: url || null
}, null, 2) + '\n');

if (data.knowledgeChanged) {
  try {
    execFileSync('node', [path.join(__dirname, 'update_index.js'), workspace], { stdio: 'pipe' });
  } catch {}
}

console.log(JSON.stringify({
  ok: true,
  duplicate: false,
  rawPath,
  assetDir,
  lintOk,
  hash,
  next: ['write memory/log', 'check upgrade targets']
}, null, 2));
