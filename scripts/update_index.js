#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workspace = process.argv[2] || process.cwd();
const indexPath = path.join(workspace, 'index.md');

function listMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((x) => x.endsWith('.md'))
    .map((x) => `- [[${path.basename(dir)}/${x.replace(/\.md$/, '')}]]`);
}

const sections = {
  entities: listMd(path.join(workspace, 'wiki', 'entities')),
  concepts: listMd(path.join(workspace, 'wiki', 'concepts')),
  comparisons: listMd(path.join(workspace, 'wiki', 'comparisons')),
  syntheses: listMd(path.join(workspace, 'wiki', 'syntheses')),
  summaries: listMd(path.join(workspace, 'summaries')),
  insights: listMd(path.join(workspace, 'insights'))
};

const content = [
  '# 个人知识库首页',
  '',
  '## 实体',
  ...(sections.entities.length ? sections.entities : ['- （暂无）']),
  '',
  '## 概念',
  ...(sections.concepts.length ? sections.concepts : ['- （暂无）']),
  '',
  '## 对比',
  ...(sections.comparisons.length ? sections.comparisons : ['- （暂无）']),
  '',
  '## 综述',
  ...(sections.syntheses.length ? sections.syntheses : ['- （暂无）']),
  '',
  '## 主题总结',
  ...(sections.summaries.length ? sections.summaries : ['- （暂无）']),
  '',
  '## 洞察',
  ...(sections.insights.length ? sections.insights : ['- （暂无）']),
  ''
].join('\n');

fs.writeFileSync(indexPath, content);
console.log(JSON.stringify({ ok: true, indexPath }, null, 2));
