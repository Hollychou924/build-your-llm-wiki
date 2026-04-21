#!/usr/bin/env node
const path = require('path');
const { execFileSync } = require('child_process');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node fetch_article.js <url>');
  process.exit(1);
}

function isWechat(u) {
  return /https?:\/\/(mp\.)?weixin\.qq\.com\//.test(u) || /https?:\/\/mp\.weixin\.qq\.com\//.test(u);
}

function run(bin, args) {
  return execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 20 * 1024 * 1024 });
}

function extractJson(output) {
  const trimmed = String(output || '').trim();
  if (!trimmed) throw new Error('empty output');
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {}
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    JSON.parse(candidate);
    return candidate;
  }
  throw new Error('no json payload found');
}

function decodeEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<img[^>]*data-src=["']([^"']+)["'][^>]*>/gi, '\n![图片]($1)\n')
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '\n![图片]($1)\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|main|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function summarizeText(text, limit = 12) {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .filter((line) => !/^原标题|^微信扫一扫|^继续滑动看下一个|^分享收藏点赞/.test(line));
  return lines.slice(0, limit);
}

function normalizeWechat(raw, sourceUrl) {
  const payload = raw && raw.data ? raw.data : raw;
  const html = payload.msg_content || '';
  const text = stripHtml(html);
  const summaryPoints = summarizeText(text, 8);
  const title = payload.msg_title || 'Untitled';
  const source = payload.account_name || '微信公众号';
  const author = payload.msg_author || payload.account_alias || '';
  const publishDate = payload.msg_publish_time
    ? new Date(payload.msg_publish_time).toISOString().slice(0, 10)
    : (payload.msg_publish_time_str || '').slice(0, 10).replace(/\//g, '-') || '';
  const markdown = [
    `# ${title}`,
    '',
    `- 来源: ${source}`,
    `- 作者: ${author || 'unknown'}`,
    `- 发布时间: ${payload.msg_publish_time_str || publishDate || 'unknown'}`,
    `- 原文链接: ${payload.msg_link || sourceUrl}`,
    '',
    text
  ].join('\n');

  return {
    ok: true,
    type: 'wechat',
    url: payload.msg_link || sourceUrl,
    title,
    source,
    author,
    publishDate,
    cover: payload.msg_cover || '',
    text,
    markdown,
    summaryPoints,
    extractor: raw.articleArchivist ? raw.articleArchivist.extractor : 'wechat',
    articleArchivist: raw.articleArchivist || null
  };
}

function normalizeFallback(textOutput, sourceUrl) {
  const text = String(textOutput || '').trim();
  const summaryPoints = summarizeText(text, 8);
  const title = summaryPoints[0] || 'Untitled';
  const markdown = [
    `# ${title}`,
    '',
    `- 来源: 微信公众号`,
    `- 原文链接: ${sourceUrl}`,
    '',
    text
  ].join('\n');
  return {
    ok: true,
    type: 'wechat-fallback',
    url: sourceUrl,
    title,
    source: '微信公众号',
    author: '',
    publishDate: '',
    text,
    markdown,
    summaryPoints,
    extractor: 'wechat-fallback'
  };
}

try {
  if (isWechat(url)) {
    try {
      const raw = JSON.parse(extractJson(run('node', [path.join(__dirname, 'extract_wechat.js'), url])));
      process.stdout.write(JSON.stringify(normalizeWechat(raw, url), null, 2));
      process.exit(0);
    } catch {
      const fallbackText = run('python3', [path.join(__dirname, 'extract_wechat_fallback.py'), url]);
      process.stdout.write(JSON.stringify(normalizeFallback(fallbackText, url), null, 2));
      process.exit(0);
    }
  }

  process.stdout.write(extractJson(run('node', [path.join(__dirname, 'fetch_generic_web.js'), url])));
} catch (err) {
  process.stderr.write(String(err.stderr || err.message || err));
  process.exit(2);
}
