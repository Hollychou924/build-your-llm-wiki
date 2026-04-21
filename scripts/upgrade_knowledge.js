#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const articlePath = process.argv[2];
const checksPath = process.argv[3];
if (!articlePath || !checksPath) {
  console.error('Usage: node upgrade_knowledge.js <article-json> <checks-json>');
  process.exit(1);
}

const article = JSON.parse(fs.readFileSync(articlePath, 'utf8'));
const checks = JSON.parse(fs.readFileSync(checksPath, 'utf8'));
const workspace = article.workspace || process.cwd();
const title = article.title || 'Untitled';
const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
const assetsDir = path.join(path.resolve(__dirname, '..'), 'assets');
const created = [];
const source = article.source || 'unknown';
const url = article.url || '';
const rawPath = article.rawPath || '';
const rawText = [article.text || '', article.markdown || '', article.content || ''].join('\n');

function normalizeForCompare(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const titleNorm = normalizeForCompare(title);

function cleanText(value) {
  return String(value || '')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function cleanSentence(value) {
  return cleanText(value)
    .replace(/\b\d+\b(?=\s+[A-Z][a-z])/g, ' ')
    .replace(/\s*\(.*?\d{4}.*?\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function isNoiseLine(line) {
  const lower = line.toLowerCase();
  const norm = normalizeForCompare(line);
  if (!line || line.length < 40) return true;
  if (norm === titleNorm || norm.includes(titleNorm) || titleNorm.includes(norm)) return true;
  if (/^#/.test(line)) return true;
  if (/^figure\s*\d+/i.test(line)) return true;
  if (/^play video/i.test(line)) return true;
  if (/^blog\s*\/\s*research/i.test(line)) return true;
  if (/^\d+x\s+speed/i.test(line)) return true;
  if (/^\d+\s+[A-Z][^.!?]*\(.*\d{4}\)/.test(line)) return true;
  if (/times in a row without intervention/i.test(lower) && line.length < 90) return true;
  if (/\b(radford|brown|kaplan|brohan|du|hausman|wang|driess)\b/i.test(line) && /\d{4}/.test(line)) return true;
  if (/^generalist ai team$/i.test(line)) return true;
  if (/^april \d{1,2}, \d{4}$/i.test(line)) return true;
  return false;
}

function splitIntoParagraphs(text) {
  return text
    .split(/\n+/)
    .map(cleanSentence)
    .filter((line) => !isNoiseLine(line));
}

function splitIntoSentences(paragraphs) {
  const out = [];
  for (const paragraph of paragraphs) {
    const parts = paragraph
      .split(/(?<=[.!?])\s+(?=[A-Z\u4e00-\u9fa5])/)
      .map(cleanSentence)
      .filter(Boolean);
    if (parts.length) out.push(...parts);
    else out.push(paragraph);
  }
  return dedupe(out).filter((line) => !isNoiseLine(line));
}

function dedupe(lines) {
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    const norm = normalizeForCompare(line);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(line);
  }
  return out;
}

const paragraphs = dedupe(splitIntoParagraphs(rawText));
const sentences = dedupe(splitIntoSentences(paragraphs));

function compressSentence(line, maxLen = 220) {
  let text = cleanSentence(line)
    .replace(/\b(we believe|today, we announce|today, we introduce|at generalist we are)\b/gi, '')
    .replace(/\b(previously, |notably, |importantly, |instead, )/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (text.length <= maxLen) return text;
  const cuts = ['. ', '; ', ': ', ', and ', ', but ', ', which '];
  for (const cut of cuts) {
    const idx = text.indexOf(cut);
    if (idx > 80 && idx < maxLen) {
      return text.slice(0, idx + (cut === '. ' ? 1 : 0)).trim();
    }
  }
  return text.slice(0, maxLen).replace(/[ ,;:]+$/, '') + '...';
}

function scoreSentence(line, include = [], avoid = [], minLen = 60) {
  const lower = line.toLowerCase();
  if (line.length < minLen) return -999;
  if (avoid.some((word) => lower.includes(word))) return -999;

  let score = 0;
  for (const word of include) {
    if (lower.includes(word)) score += 3;
  }
  if (/\b(99%|3x|1 hour|half a million|commercial viability|mastery|system|deployment|real-world)\b/i.test(line)) score += 3;
  if (/\b(reliability|speed|improvisation|pretraining|scaling|foundation model|data engine|physical agi)\b/i.test(lower)) score += 2;
  if (line.length >= 90 && line.length <= 260) score += 2;
  if (line.length > 300) score -= 2;
  return score;
}

function selectSentences(options) {
  const {
    include = [],
    avoid = [],
    minLen = 60,
    limit = 2,
    pool = sentences,
    fallback = []
  } = options;

  const ranked = pool
    .map((line) => ({ line: compressSentence(line), score: scoreSentence(line, include, avoid, minLen) }))
    .filter((item) => item.score > -999)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.line);

  return dedupe([...ranked, ...fallback.map((x) => compressSentence(x))]).slice(0, limit);
}

function firstGoodSentence() {
  return compressSentence(sentences[0] || paragraphs[0] || '待补充');
}

function bulletize(lines, fallback = '待补充') {
  const picked = dedupe(lines.filter(Boolean)).slice(0, 4);
  if (!picked.length) return `- ${fallback}`;
  return picked.map((line) => `- ${line}`).join('\n');
}

function inferEntityWhat() {
  return bulletize(selectSentences({
    include: ['is', 'represents', 'latest milestone', 'model', 'system', 'company'],
    limit: 2,
    fallback: [firstGoodSentence()]
  }));
}

function inferEntityWhy() {
  return bulletize(selectSentences({
    include: ['commercial viability', 'mastery', 'step change', 'significant threshold', 'data engine'],
    limit: 2,
    fallback: [firstGoodSentence()]
  }));
}

function inferEntityJudgment() {
  return bulletize(selectSentences({
    include: ['system', 'commercial viability', 'real-world deployment', 'physical intelligence'],
    limit: 2,
    fallback: [firstGoodSentence()]
  }));
}

function inferConceptDefinition() {
  return bulletize(selectSentences({
    include: ['we define', 'refers to', 'the combination of', 'should be', 'means'],
    limit: 2,
    fallback: [firstGoodSentence()]
  }));
}

function inferConceptImportance() {
  return bulletize(selectSentences({
    include: ['critical', 'important', 'essential', 'commercial viability', 'real-world deployment'],
    limit: 2,
    fallback: [firstGoodSentence()]
  }));
}

function inferConceptPoints() {
  return bulletize(selectSentences({
    include: ['reliability', 'speed', 'improvisation', 'system', 'scaling', 'data engine'],
    limit: 3,
    fallback: [firstGoodSentence()]
  }));
}

function inferComparisonObjects() {
  return bulletize(selectSentences({
    include: ['versus', 'vs ', '相比', '不同', '模式', 'route', 'strategy'],
    limit: 2,
    fallback: [firstGoodSentence()]
  }), '本文提供了一个值得后续继续展开的对比切口。');
}

function inferComparisonDifferences() {
  return bulletize(selectSentences({
    include: ['difference', 'advantage', 'trade-off', 'safety', 'deployment', 'system', 'integration'],
    limit: 3,
    fallback: [firstGoodSentence()]
  }), '主要差异仍需更多同主题材料互证。');
}

function inferComparisonJudgment() {
  return bulletize(selectSentences({
    include: ['核心在于', '真正的', '关键不在于', 'trade-off', 'commercial viability', 'system-level'],
    limit: 2,
    fallback: ['当前更适合把它当成对比线索页，而不是最终定论页。']
  }));
}

function inferSummary() {
  return bulletize(selectSentences({
    include: ['mastery', 'commercial viability', '1 hour of robot data', '99%', '3x faster', 'half a million'],
    avoid: ['figure', 'play video'],
    limit: 3,
    fallback: [firstGoodSentence()]
  }));
}

function inferStageJudgment() {
  return bulletize(selectSentences({
    include: ['scaling laws', 'pretraining era', 'continued scaling', 'economically useful', 'step change', 'significant shift'],
    limit: 3,
    fallback: [firstGoodSentence()]
  }));
}

function inferNextStep() {
  return bulletize([
    '继续补同主题文章，验证这是不是稳定趋势，而不是单篇叙事。',
    '优先补能解释系统能力、数据闭环、部署基础设施和后训练环节的材料。'
  ]);
}

function inferSynthesisConclusion() {
  return bulletize(selectSentences({
    include: ['first general-purpose ai model', 'mastery of simple physical tasks', 'commercial viability', 'system-level', 'set of model weights'],
    limit: 3,
    fallback: [firstGoodSentence()]
  }));
}

function inferSynthesisMeaning() {
  return bulletize(selectSentences({
    include: ['continued scaling', 'broader physical intelligence', 'data engine', 'without any robot data', 'real-world deployment'],
    limit: 3,
    fallback: ['这批材料共同指向一个更系统化的主题判断，值得继续收口。']
  }));
}

function inferKeySignals() {
  return bulletize(selectSentences({
    include: ['99%', '3x faster', '1 hour of robot data', 'half a million hours', 'system-level', 'reliability', 'speed', 'improvisation'],
    limit: 4,
    fallback: [firstGoodSentence()]
  }));
}

function inferInsight() {
  return bulletize(selectSentences({
    include: ['commercial viability', 'mastery', 'physical world', 'system-level', 'physical agi'],
    limit: 2,
    fallback: [firstGoodSentence()]
  }));
}

function inferWhy() {
  return bulletize(selectSentences({
    include: ['scaling laws', 'pretraining', 'data engine', 'half a million hours', 'real-time', '1 hour of robot data'],
    limit: 3,
    fallback: [firstGoodSentence()]
  }));
}

function inferMeaning() {
  return bulletize(selectSentences({
    include: ['commercial viability', 'real-world deployment', 'broader physical intelligence', 'tasks, systems, and environments'],
    limit: 2,
    fallback: [firstGoodSentence()]
  }));
}

function shouldRefreshExisting(file) {
  if (!fs.existsSync(file)) return true;
  const existing = fs.readFileSync(file, 'utf8');
  const lines = existing.split('\n').map((x) => x.trim()).filter(Boolean);
  const bulletLines = lines.filter((x) => x.startsWith('- '));
  const normalizedBullets = bulletLines.map((x) => normalizeForCompare(x));
  const uniqueBullets = new Set(normalizedBullets);
  const duplicatedBullets = bulletLines.length > 0 && uniqueBullets.size <= Math.max(1, Math.floor(bulletLines.length / 2));
  const noisyPatterns = [
    /play video/i,
    /^-?\s*figure\s*\d+/im,
    /^-?\s*\d+\s+[A-Z].*\(.*\d{4}\)/im,
    /times in a row without intervention/i,
    /待补充/
  ];
  const hasNoise = noisyPatterns.some((pattern) => pattern.test(existing));
  const titleEchoCount = normalizedBullets.filter((x) => x && (x === titleNorm || titleNorm.includes(x) || x.includes(titleNorm))).length;
  const tooManyTitleEchoes = titleEchoCount >= 2;
  return hasNoise || duplicatedBullets || tooManyTitleEchoes;
}

function writeDraft(relDir, content) {
  const dir = path.join(workspace, relDir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${safeTitle}.md`);
  if (shouldRefreshExisting(file)) {
    fs.writeFileSync(file, content);
    created.push(file);
  }
}

function renderSimpleTemplate(name) {
  return fs.readFileSync(path.join(assetsDir, name), 'utf8')
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{source\}\}/g, source)
    .replace(/\{\{url\}\}/g, url)
    .replace(/\{\{rawPath\}\}/g, rawPath);
}

if (checks.checks.entities === 'candidate') {
  const content = renderSimpleTemplate('entity-template.md')
    .replace('## 是什么\n- 待补充', `## 是什么\n${inferEntityWhat()}`)
    .replace('## 为什么值得记录\n- 待补充', `## 为什么值得记录\n${inferEntityWhy()}`)
    .replace('## 当前判断\n- 待补充', `## 当前判断\n${inferEntityJudgment()}`);
  writeDraft(path.join('wiki', 'entities'), content);
}

if (checks.checks.concepts === 'candidate') {
  const content = renderSimpleTemplate('concept-template.md')
    .replace('## 定义\n- 待补充', `## 定义\n${inferConceptDefinition()}`)
    .replace('## 为什么重要\n- 待补充', `## 为什么重要\n${inferConceptImportance()}`)
    .replace('## 核心要点\n- 待补充', `## 核心要点\n${inferConceptPoints()}`);
  writeDraft(path.join('wiki', 'concepts'), content);
}

if (checks.checks.comparisons === 'candidate') {
  const content = [
    `# ${title}`,
    '',
    `## 对比对象`,
    inferComparisonObjects(),
    '',
    `## 对比表`,
    `| 维度 | 提到的路线 / 方案 A | 提到的路线 / 方案 B |`,
    `| --- | --- | --- |`,
    `| 核心差别 | 文章里已经出现了值得继续跟踪的分化信号 | 当前仍需后续材料补全另一侧样本 |`,
    `| 优势 | ${firstGoodSentence().slice(0, 36)} | 更适合作为后续对照补样对象 |`,
    `| 局限 | 单篇材料还不足以给最终结论 | 需要补更多互证材料 |`,
    '',
    `## 当前判断`,
    inferComparisonJudgment(),
    '',
    `## 关键差异`,
    inferComparisonDifferences(),
    '',
    `## 来源`,
    `- ${source}`,
    `- ${url}`,
    `- ${rawPath}`,
    ''
  ].join('\n');
  writeDraft(path.join('wiki', 'comparisons'), content);
}

if (checks.checks.summaries === 'candidate') {
  const content = fs.readFileSync(path.join(assetsDir, 'summary-template.md'), 'utf8')
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{rawPath\}\}/g, rawPath)
    .replace('## 主题摘要\n- 待补充', `## 主题摘要\n${inferSummary()}`)
    .replace('## 当前阶段判断\n- 待补充', `## 当前阶段判断\n${inferStageJudgment()}`)
    .replace('## 下一步值得补什么\n- 待补充', `## 下一步值得补什么\n${inferNextStep()}`);
  writeDraft('summaries', content);
}

if (checks.checks.syntheses === 'candidate') {
  const content = fs.readFileSync(path.join(assetsDir, 'synthesis-template.md'), 'utf8')
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{source\}\}/g, source)
    .replace(/\{\{url\}\}/g, url)
    .replace(/\{\{rawPath\}\}/g, rawPath)
    .replace('## 核心结论\n- 待补充', `## 核心结论\n${inferSynthesisConclusion()}`)
    .replace('## 这组材料共同说明了什么\n- 待补充', `## 这组材料共同说明了什么\n${inferSynthesisMeaning()}`)
    .replace('## 关键线索\n- 待补充', `## 关键线索\n${inferKeySignals()}`);
  writeDraft(path.join('wiki', 'syntheses'), content);
}

if (checks.checks.insights === 'candidate') {
  const content = fs.readFileSync(path.join(assetsDir, 'insight-template.md'), 'utf8')
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{source\}\}/g, source)
    .replace(/\{\{url\}\}/g, url)
    .replace(/\{\{rawPath\}\}/g, rawPath)
    .replace('## 洞察\n- 待补充', `## 洞察\n${inferInsight()}`)
    .replace('## 为什么这成立\n- 待补充', `## 为什么这成立\n${inferWhy()}`)
    .replace('## 这意味着什么\n- 待补充', `## 这意味着什么\n${inferMeaning()}`);
  writeDraft('insights', content);
}

console.log(JSON.stringify({ ok: true, created }, null, 2));
