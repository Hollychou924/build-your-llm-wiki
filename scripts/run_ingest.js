#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const url = process.argv[2];
const workspaceArgIndex = process.argv.indexOf('--workspace');
const workspace = workspaceArgIndex >= 0 && process.argv[workspaceArgIndex + 1]
  ? path.resolve(process.argv[workspaceArgIndex + 1])
  : process.cwd();

if (!url) {
  console.error('Usage: node run_ingest.js <url> [--workspace /path/to/workspace]');
  process.exit(1);
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'article-archivist-'));
const fetchedPath = path.join(tmpDir, 'fetched.json');
const archivedPath = path.join(tmpDir, 'archived.json');
const upgradePath = path.join(tmpDir, 'upgrade.json');

function run(bin, args) {
  return execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

try {
  const fetched = JSON.parse(run('node', [path.join(__dirname, 'fetch_article.js'), url]));
  fetched.url = fetched.url || url;
  fetched.workspace = workspace;
  fs.writeFileSync(fetchedPath, JSON.stringify(fetched, null, 2));

  const archived = JSON.parse(run('node', [path.join(__dirname, 'archive_article.js'), fetchedPath]));
  const merged = { ...fetched, ...archived, workspace };
  fs.writeFileSync(archivedPath, JSON.stringify(merged, null, 2));

  const upgradedChecks = JSON.parse(run('node', [path.join(__dirname, 'check_upgrade_targets.js'), archivedPath]));
  fs.writeFileSync(upgradePath, JSON.stringify(upgradedChecks, null, 2));

  const drafts = JSON.parse(run('node', [path.join(__dirname, 'upgrade_knowledge.js'), archivedPath, upgradePath]));
  const logsInput = {
    ...merged,
    upgradeHint: drafts.created.length ? `已生成 ${drafts.created.length} 个升级草稿` : '暂未生成升级草稿'
  };
  fs.writeFileSync(archivedPath, JSON.stringify(logsInput, null, 2));

  const logs = JSON.parse(run('node', [path.join(__dirname, 'write_memory_log.js'), archivedPath]));

  if (drafts.created.length) {
    try {
      run('node', [path.join(__dirname, 'update_index.js'), workspace]);
    } catch {}
  }

  console.log(JSON.stringify({
    ok: true,
    duplicate: Boolean(archived.duplicate),
    url,
    workspace,
    rawPath: merged.rawPath,
    assetDir: merged.assetDir,
    lintOk: merged.lintOk,
    memoryPath: logs.memoryPath,
    dailyPath: logs.zhDailyPath || logs.dailyPath,
    totalLogPath: logs.totalLogPath,
    upgradeChecks: upgradedChecks.checks,
    notes: upgradedChecks.notes,
    createdDrafts: drafts.created
  }, null, 2));
} catch (err) {
  process.stderr.write(String(err.stderr || err.message || err));
  process.exit(2);
}
