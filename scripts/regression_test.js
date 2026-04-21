#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

let urls = process.argv.slice(2);
if (!urls.length) {
  const defaultListPath = path.join(path.resolve(__dirname, '..'), 'references', 'beta-regression-urls.txt');
  urls = fs.readFileSync(defaultListPath, 'utf8').split('\n').map((x) => x.trim()).filter(Boolean);
}
if (!urls.length) {
  console.error('Usage: node regression_test.js <url1> <url2> ...');
  process.exit(1);
}

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'article-archivist-regression-'));

function run(bin, args) {
  return execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function scoreDraft(file) {
  const text = fs.readFileSync(file, 'utf8');
  let score = 100;
  const reasons = [];

  if (/待补充/i.test(text)) {
    score -= 50;
    reasons.push('contains placeholder');
  }
  if (/Play Video|Figure\s*\d+/i.test(text)) {
    score -= 20;
    reasons.push('contains UI/reference noise');
  }
  const bullets = text.split('\n').filter((x) => x.trim().startsWith('- '));
  const longBullets = bullets.filter((x) => x.length > 280).length;
  if (longBullets) {
    score -= Math.min(20, longBullets * 5);
    reasons.push('contains overly long bullets');
  }
  const unique = new Set(bullets.map((x) => x.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ').trim()));
  if (bullets.length && unique.size <= Math.floor(bullets.length / 2)) {
    score -= 20;
    reasons.push('contains duplicated bullets');
  }
  if (bullets.length < 3) {
    score -= 10;
    reasons.push('too little content');
  }

  return { score: Math.max(0, score), reasons };
}

function summarizeQuality(quality) {
  if (!quality.length) return { average: null, min: null };
  const scores = quality.map((x) => x.score);
  return {
    average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    min: Math.min(...scores)
  };
}

const results = [];
run('node', [path.join(__dirname, 'bootstrap.js'), workspace]);

for (const url of urls) {
  try {
    const result = JSON.parse(run('node', [path.join(__dirname, 'run_ingest.js'), url, '--workspace', workspace]));
    const quality = [];
    for (const draft of result.createdDrafts || []) {
      if (fs.existsSync(draft)) {
        quality.push({ path: draft, ...scoreDraft(draft) });
      }
    }
    results.push({
      url,
      ok: result.ok,
      duplicate: result.duplicate,
      upgradeChecks: result.upgradeChecks,
      createdDraftCount: (result.createdDrafts || []).length,
      quality,
      qualitySummary: summarizeQuality(quality)
    });
  } catch (err) {
    results.push({
      url,
      ok: false,
      error: String(err.stderr || err.message || err),
      createdDraftCount: 0,
      quality: [],
      qualitySummary: { average: null, min: null }
    });
  }
}

const allScores = results.flatMap((x) => x.quality.map((q) => q.score));
const overall = allScores.length
  ? { average: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length), min: Math.min(...allScores) }
  : { average: null, min: null };

console.log(JSON.stringify({ ok: true, workspace, overall, results }, null, 2));
