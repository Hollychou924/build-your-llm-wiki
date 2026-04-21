#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node write_memory_log.js <article-json>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workspace = data.workspace || process.cwd();
const date = data.date || new Date().toISOString().slice(0, 10);
const memoryPath = path.join(workspace, 'memory', `${date}.md`);
const englishDailyPath = path.join(workspace, 'daily', `${date}.md`);
const zhDailyPath = path.join(workspace, '日志', '日记', `${date}.md`);
const totalLogPath = path.join(workspace, '日志', '总日志', '总日志.md');

fs.mkdirSync(path.dirname(memoryPath), { recursive: true });
fs.mkdirSync(path.dirname(englishDailyPath), { recursive: true });
fs.mkdirSync(path.dirname(zhDailyPath), { recursive: true });
fs.mkdirSync(path.dirname(totalLogPath), { recursive: true });

const title = data.title || 'Untitled';
const url = data.url || '';
const rawPath = data.rawPath || '';
const source = data.source || 'unknown';
const summary = (data.summaryPoints || []).map((x) => `- ${x}`).join('\n') || '- 待补充';
const upgradeHint = data.upgradeHint || '待做六目录检查';

const memoryBlock = `\n## ${title}\n- 来源: ${source}\n- 链接: ${url}\n- 归档: ${rawPath}\n- 升级提示: ${upgradeHint}\n${summary}\n`;
const englishDailyBlock = `\n## ${title}\n- Source: ${source}\n- Archive: ${rawPath}\n- URL: ${url}\n- Status: archived\n`;
const zhDailyBlock = `\n## ${title}\n- 来源: ${source}\n- 归档: ${rawPath}\n- 链接: ${url}\n- 处理状态: 已归档\n- 升级提示: ${upgradeHint}\n`;
const totalLogBlock = `\n- ${date}: ${title} -> ${rawPath || url}\n`;

fs.appendFileSync(memoryPath, memoryBlock);
fs.appendFileSync(englishDailyPath, englishDailyBlock);
fs.appendFileSync(zhDailyPath, zhDailyBlock);
fs.appendFileSync(totalLogPath, totalLogBlock);

console.log(JSON.stringify({ ok: true, memoryPath, englishDailyPath, zhDailyPath, totalLogPath }, null, 2));
