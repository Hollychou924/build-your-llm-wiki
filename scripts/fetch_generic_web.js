#!/usr/bin/env node
const https = require('https');
const http = require('http');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node fetch_generic_web.js <url>');
  process.exit(1);
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|main|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function extractMeta(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return decodeEntities(match[1].trim());
  }
  return '';
}

function extractJsonLdValue(html, keys) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const queue = Array.isArray(parsed) ? parsed.slice() : [parsed];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== 'object') continue;
        for (const key of keys) {
          if (item[key]) {
            const value = item[key];
            if (typeof value === 'string') return value.trim();
            if (typeof value === 'object' && value.name) return String(value.name).trim();
          }
        }
        for (const value of Object.values(item)) {
          if (value && typeof value === 'object') queue.push(value);
        }
      }
    } catch {}
  }
  return '';
}

function normalizeText(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line.length > 1)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chooseContentHtml(html) {
  const candidates = [];
  const patterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
    /<section[^>]*class=["'][^"']*(post-content|article-content|entry-content|content|post-body)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi,
    /<div[^>]*class=["'][^"']*(post-content|article-content|entry-content|content|post-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const snippet = match[2] || match[1] || '';
      const text = normalizeText(stripTags(snippet));
      if (text.length > 400) candidates.push({ html: snippet, text });
    }
  }

  if (!candidates.length) {
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripTags(m[1]))
      .filter((line) => line.length > 40);
    const text = normalizeText(paragraphs.join('\n\n'));
    return { html, text };
  }

  candidates.sort((a, b) => b.text.length - a.text.length);
  return candidates[0];
}

function buildMarkdown(title, source, publishDate, author, text, url) {
  const parts = [
    `# ${title}`,
    '',
    `- 来源: ${source || 'unknown'}`,
    `- 作者: ${author || 'unknown'}`,
    `- 发布时间: ${publishDate || 'unknown'}`,
    `- 原文链接: ${url}`,
    '',
    text
  ];
  return parts.join('\n');
}

const client = url.startsWith('https') ? https : http;
client.get(url, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const title = extractMeta(body, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i
    ]) || url;

    const source = extractMeta(body, [
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i
    ]) || extractJsonLdValue(body, ['publisher']) || new URL(url).hostname.replace(/^www\./, '');

    const author = extractMeta(body, [
      /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i
    ]) || extractJsonLdValue(body, ['author']) || '';

    const publishDate = extractMeta(body, [
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']publish_date["'][^>]+content=["']([^"']+)["']/i,
      /<time[^>]+datetime=["']([^"']+)["']/i
    ]) || extractJsonLdValue(body, ['datePublished', 'dateCreated']) || '';

    const content = chooseContentHtml(body);
    const text = normalizeText(content.text);
    const markdown = buildMarkdown(title, source, publishDate, author, text, url);

    console.log(JSON.stringify({
      ok: true,
      type: 'generic-web',
      url,
      title,
      source,
      author,
      publishDate,
      html: body,
      text,
      markdown
    }, null, 2));
  });
}).on('error', (err) => {
  console.error(err.message);
  process.exit(2);
});
