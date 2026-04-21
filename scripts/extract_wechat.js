#!/usr/bin/env node
/**
 * 提取微信公众号文章
 * 用法：node extract_wechat.js <URL> [output.json]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const url = process.argv[2];
const out = process.argv[3] || '/tmp/wechat_extract_result.json';

if (!url) {
  console.error('Usage: node extract_wechat.js <URL> [output.json]');
  process.exit(1);
}

const vendorDir = path.join(__dirname, '..', 'vendor', 'wechat-article-extractor-skill');
const embeddedExtractPath = path.join(vendorDir, 'scripts/extract.js');
const homeSkillExtractPath = path.join(process.env.HOME || '', '.openclaw', 'skills', 'wechat-article-extractor-skill', 'scripts', 'extract.js');
const stateDir = path.join(__dirname, '..', 'state');
const stateConfigPath = path.join(stateDir, 'config.json');
const stateLogPath = path.join(stateDir, 'archive-log.jsonl');

function hasBin(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore', shell: '/bin/bash' });
    return true;
  } catch {
    return false;
  }
}

function resolveExtractPath() {
  if (fs.existsSync(homeSkillExtractPath)) return { path: homeSkillExtractPath, source: 'skillhub-installed' };
  if (fs.existsSync(embeddedExtractPath)) return { path: embeddedExtractPath, source: 'embedded-vendor' };
  return null;
}

function urlHash(input) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

function readState() {
  const base = {
    version: 1,
    lastVaultPath: null,
    lastWorkspacePath: null,
    lastBootstrapMode: null,
    obsidianInstalled: null,
    cliEnabled: null,
    lastExtractor: null,
    lastFailure: null,
    archivedUrls: {},
  };
  try {
    if (!fs.existsSync(stateConfigPath)) return base;
    return { ...base, ...JSON.parse(fs.readFileSync(stateConfigPath, 'utf8')) };
  } catch {
    return base;
  }
}

function writeState(patch) {
  fs.mkdirSync(stateDir, { recursive: true });
  const current = readState();
  const next = { ...current, ...patch };
  fs.writeFileSync(stateConfigPath, JSON.stringify(next, null, 2) + '\n');
}

function appendLog(entry) {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.appendFileSync(stateLogPath, JSON.stringify({ time: new Date().toISOString(), ...entry }) + '\n');
}

(async () => {
  const resolved = resolveExtractPath();
  if (!resolved) {
    const message = hasBin('skillhub')
      ? 'wechat extractor not found. Run: skillhub install wechat-article-extractor-skill'
      : 'wechat extractor not found. Run: node scripts/ensure_wechat_extractor.js';
    console.error(message);
    process.exit(2);
  }

  const { extract } = require(resolved.path);
  const hash = urlHash(url);
  const state = readState();
  const duplicate = Boolean(state.archivedUrls && state.archivedUrls[hash]);

  try {
    const result = await extract(url);
    const wrapped = {
      ...result,
      articleArchivist: {
        duplicate,
        urlHash: hash,
        extractor: resolved.source,
        firstSeenAt: duplicate ? state.archivedUrls[hash].time : new Date().toISOString(),
      },
    };
    fs.writeFileSync(out, JSON.stringify(wrapped, null, 2));

    const success = Boolean(result && result.done);
    const archivedUrls = { ...(state.archivedUrls || {}) };
    archivedUrls[hash] = {
      url,
      time: new Date().toISOString(),
      extractor: resolved.source,
      success,
      output: out,
    };

    writeState({
      lastExtractor: resolved.source,
      lastFailure: success ? null : (result && (result.msg || result.code)) || 'unknown failure',
      archivedUrls,
    });

    appendLog({
      event: 'extract',
      extractor: resolved.source,
      url,
      urlHash: hash,
      duplicate,
      success,
      output: out,
      code: result && result.code,
      message: result && result.msg,
    });

    process.stdout.write(JSON.stringify(wrapped, null, 2));
  } catch (err) {
    writeState({
      lastExtractor: resolved.source,
      lastFailure: err.message || String(err),
    });
    appendLog({
      event: 'extract',
      extractor: resolved.source,
      url,
      urlHash: hash,
      duplicate,
      success: false,
      output: out,
      message: err.message || String(err),
    });
    console.error('Extraction failed:', err.message || err);
    process.exit(3);
  }
})();
