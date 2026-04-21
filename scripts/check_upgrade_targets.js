#!/usr/bin/env node
const fs = require('fs');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node check_upgrade_targets.js <article-json>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const title = data.title || '';
const text = [data.text || '', data.markdown || '', data.content || ''].join('\n');
const haystack = `${title}\n${text}`.toLowerCase();
const checks = {
  entities: 'not-updated',
  concepts: 'not-updated',
  comparisons: 'not-updated',
  syntheses: 'not-updated',
  summaries: 'not-updated',
  insights: 'not-updated'
};
const notes = [];

function hasAny(words) {
  return words.some((word) => haystack.includes(word));
}

function promote(key, note) {
  if (checks[key] !== 'candidate') {
    checks[key] = 'candidate';
    notes.push(note);
  }
}

const keywordGroups = {
  concepts: ['framework', 'paradigm', 'schema', 'workflow', 'architecture', 'harness', 'scaling law', 'agent', 'vla', 'reasoning'],
  comparisons: ['vs ', 'versus', '对比', '区别', '相比', '优于', '劣于'],
  entities: ['generalist', 'openai', 'google', 'anthropic', 'karpathy', 'tesla', 'xiaomi', 'resolve ai'],
  insights: ['意味着', '本质上', '真正的', '护城河', '不是', '正在从', '核心在于', '长期壁垒', '关键不在于', '主战场'],
  summaries: ['综述', '路线', '趋势', '全景', 'scaling', 'infrastructure', 'ecosystem', 'roadmap', 'foundation models', 'mastery'],
  synthesis: ['system', 'systems', '闭环', '基础设施', 'data engine', 'deployment', 'post-training', 'cross-embodiment'],
  topicSignals: ['generalist', 'gen-0', 'gen-1', 'embodied', 'robotics', 'harness', 'openclaw', 'agent', 'vla']
};

const topicClusters = [
  { name: 'generalist-embodied', words: ['generalist', 'gen-0', 'gen-1', 'embodied', 'robotics', 'cross-embodiment'] },
  { name: 'agent-harness', words: ['harness', 'agent', 'workflow', 'openclaw', 'execution'] },
  { name: 'foundation-model-scaling', words: ['scaling law', 'foundation models', 'data engine', 'infrastructure'] }
];

if (Array.isArray(data.entities) && data.entities.length) promote('entities', 'Found explicit entities');
if (Array.isArray(data.concepts) && data.concepts.length) promote('concepts', 'Found explicit concepts');
if (Array.isArray(data.comparisons) && data.comparisons.length) promote('comparisons', 'Found explicit comparisons');

if (hasAny(keywordGroups.entities)) promote('entities', 'Entity-like proper nouns detected');
if (hasAny(keywordGroups.concepts)) promote('concepts', 'Concept/framework keywords detected');
if (hasAny(keywordGroups.comparisons)) promote('comparisons', 'Comparison language detected');

const textLength = text.replace(/\s+/g, '').length;
const longForm = textLength >= 3500;
const mediumForm = textLength >= 1800;
const veryLongForm = textLength >= 6000;
const hasThemeSignal = hasAny(keywordGroups.summaries);
const hasInsightSignal = hasAny(keywordGroups.insights);
const hasSynthesisSignal = hasAny(keywordGroups.synthesis);
const matchedTopicClusters = topicClusters.filter((cluster) => cluster.words.filter((word) => haystack.includes(word)).length >= 2);
const hasTopicSignal = hasAny(keywordGroups.topicSignals) || matchedTopicClusters.length > 0;
const hasCrossArticleJudgment = Boolean(data.crossArticleJudgment) || (hasInsightSignal && mediumForm) || (hasTopicSignal && hasSynthesisSignal && longForm);
const inferredTopicCluster = data.topicClusterSize || (matchedTopicClusters.length ? 3 : ((hasThemeSignal || hasInsightSignal) && longForm ? 3 : 0));

if (data.topicClusterSize && data.topicClusterSize >= 3) {
  promote('summaries', 'Explicit topic cluster suggests summary upgrade');
}
if (hasThemeSignal && mediumForm) {
  promote('summaries', 'Theme-level signals detected in a medium/long article');
}
if (matchedTopicClusters.length && mediumForm) {
  promote('summaries', `Recognized topic cluster: ${matchedTopicClusters.map((x) => x.name).join(', ')}`);
}
if (hasCrossArticleJudgment || (hasTopicSignal && hasInsightSignal && mediumForm)) {
  promote('insights', 'Stable reusable judgment signal detected');
}
if ((inferredTopicCluster >= 3 && hasCrossArticleJudgment) || (longForm && hasThemeSignal && hasInsightSignal) || (hasTopicSignal && hasSynthesisSignal && longForm) || (veryLongForm && matchedTopicClusters.length)) {
  promote('syntheses', 'Enough signal for overview/synthesis');
}

console.log(JSON.stringify({
  ok: true,
  checks,
  notes,
  diagnostics: {
    textLength,
    longForm,
    mediumForm,
    veryLongForm,
    inferredTopicCluster,
    hasThemeSignal,
    hasInsightSignal,
    hasSynthesisSignal,
    hasTopicSignal,
    hasCrossArticleJudgment,
    matchedTopicClusters: matchedTopicClusters.map((x) => x.name)
  },
  mustExplainIfNoUpgrade: true,
  reminder: 'If no upgrade is made, record why, which bucket was closest, and what would trigger next time.'
}, null, 2));
