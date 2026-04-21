#!/usr/bin/env node
/**
 * article-archivist 一键初始化脚本
 * 目标：初始化可直接开始喂文章的最小知识系统骨架
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const { isObsidianInstalled, installObsidian, launchObsidian, checkCli, ensurePath } = require('./install-obsidian');

const args = process.argv.slice(2);
let vaultArg = null;
let targetDirArg = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--vault' && i + 1 < args.length) {
    vaultArg = path.resolve(args[i + 1]);
    i++;
  } else if (!targetDirArg && !args[i].startsWith('--')) {
    targetDirArg = path.resolve(args[i]);
  }
}

const targetDir = targetDirArg || process.cwd();
const skillDir = path.resolve(__dirname, '..');
const assetsDir = path.join(skillDir, 'assets');
const stateDir = path.join(skillDir, 'state');
const stateConfigPath = path.join(stateDir, 'config.json');
const stateLogPath = path.join(stateDir, 'archive-log.jsonl');

function getWorkspaceStateDir(workspacePath) {
  return path.join(workspacePath, '.article-archivist', 'state');
}

const workspaceDirs = [
  'raw',
  'daily',
  'memory',
  'wiki/entities',
  'wiki/concepts',
  'wiki/comparisons',
  'wiki/syntheses',
  'summaries',
  'insights',
  '日志/日记',
  '日志/总日志',
  '洞察',
  '工作流',
  '规范&标准'
];

const vaultDirs = [
  'raw',
  'daily',
  'wiki/entities',
  'wiki/concepts',
  'wiki/comparisons',
  'wiki/syntheses',
  'summaries',
  'insights'
];

function log(msg) {
  console.log(`[bootstrap] ${msg}`);
}

function warn(msg) {
  console.warn(`[bootstrap] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created: ${dir}`);
  }
}

function writeFileIfMissing(filePath, content) {
  if (!fs.existsSync(filePath)) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
    log(`Created: ${filePath}`);
  }
}

function readAsset(name) {
  return fs.readFileSync(path.join(assetsDir, name), 'utf8');
}

function findDefaultVault() {
  const home = os.homedir();
  const candidates = [
    path.join(home, 'Library/Mobile Documents/com~apple~CloudDocs/Obsidian/Obsidian'),
    path.join(home, 'Documents/Obsidian Vault'),
    path.join(home, 'Obsidian Vault')
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function createSymlink(linkPath, targetPath) {
  try {
    if (fs.existsSync(linkPath)) fs.rmSync(linkPath, { recursive: true, force: true });
  } catch {}
  try {
    fs.symlinkSync(targetPath, linkPath, 'dir');
    log(`Symlink: ${linkPath} -> ${targetPath}`);
  } catch (err) {
    warn(`Failed symlink ${linkPath}: ${err.message}`);
  }
}

function updateState(patch) {
  ensureDir(stateDir);
  let current = {
    version: 2,
    lastVaultPath: null,
    lastWorkspacePath: null,
    lastBootstrapMode: null,
    obsidianInstalled: null,
    cliEnabled: null,
    archivedUrls: {}
  };
  if (fs.existsSync(stateConfigPath)) {
    try { current = JSON.parse(fs.readFileSync(stateConfigPath, 'utf8')); } catch {}
  }
  const next = { ...current, ...patch };
  fs.writeFileSync(stateConfigPath, JSON.stringify(next, null, 2) + '\n');
  fs.appendFileSync(stateLogPath, JSON.stringify({ time: new Date().toISOString(), event: 'bootstrap', ...patch }) + '\n');
}

let obsidianInstalled = isObsidianInstalled();
let vaultDir = vaultArg;

if (!obsidianInstalled) {
  log('Obsidian not detected. Attempting install...');
  const ok = installObsidian();
  if (ok) {
    ensurePath();
    launchObsidian();
    obsidianInstalled = true;
  } else {
    warn('Obsidian install failed. Falling back to plain filesystem mode.');
  }
} else if (!checkCli()) {
  ensurePath();
  launchObsidian();
}

if (obsidianInstalled && !vaultDir) {
  vaultDir = findDefaultVault();
  if (vaultDir) log(`Detected default vault: ${vaultDir}`);
}

ensureDir(targetDir);

if (vaultDir) {
  vaultDirs.forEach((d) => ensureDir(path.join(vaultDir, d)));
  ['raw', 'daily', 'wiki', 'summaries', 'insights'].forEach((name) => {
    createSymlink(path.join(targetDir, name), path.join(vaultDir, name));
  });
}

workspaceDirs.forEach((d) => ensureDir(path.join(targetDir, d)));

writeFileIfMissing(path.join(targetDir, 'index.md'), readAsset('default-index.md'));
writeFileIfMissing(path.join(targetDir, '工作流', '文章归档标准工作流.md'), readAsset('default-workflow.md'));
writeFileIfMissing(path.join(targetDir, '规范&标准', '文章归档执行清单.md'), readAsset('default-checklist.md'));
writeFileIfMissing(path.join(targetDir, '洞察', '洞察索引.md'), '# 洞察索引\n\n- （暂无）\n');
writeFileIfMissing(path.join(targetDir, '记忆.md'), '# 记忆\n\n> 长期稳定的协作真相与方法论。\n');

const workspaceStateDir = getWorkspaceStateDir(targetDir);
ensureDir(workspaceStateDir);
writeFileIfMissing(path.join(workspaceStateDir, 'config.json'), JSON.stringify({
  version: 1,
  workspacePath: targetDir,
  createdAt: new Date().toISOString(),
  lastArchiveAt: null,
  lastArchivedUrl: null
}, null, 2) + '\n');
writeFileIfMissing(path.join(workspaceStateDir, 'archive-log.jsonl'), '');

const today = new Date().toISOString().slice(0, 10);
writeFileIfMissing(path.join(targetDir, 'daily', `${today}.md`), readAsset('default-daily.md').replace(/\{\{date\}\}/g, today));
writeFileIfMissing(path.join(targetDir, 'memory', `${today}.md`), readAsset('default-memory.md').replace(/\{\{date\}\}/g, today));
writeFileIfMissing(path.join(targetDir, '日志', '日记', `${today}.md`), `# ${today} 日记\n\n- （暂无）\n`);
writeFileIfMissing(path.join(targetDir, '日志', '总日志', '总日志.md'), '# 总日志\n\n- （暂无）\n');

updateState({
  lastVaultPath: vaultDir || null,
  lastWorkspacePath: targetDir,
  lastWorkspaceStatePath: workspaceStateDir,
  lastBootstrapMode: vaultDir ? 'obsidian' : 'plain-filesystem',
  obsidianInstalled,
  cliEnabled: checkCli()
});

log('Bootstrap complete.');
log(`Workspace: ${targetDir}`);
if (vaultDir) log(`Vault: ${vaultDir}`);
