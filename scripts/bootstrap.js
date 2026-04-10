#!/usr/bin/env node
/**
 * article-archivist 目录结构一键初始化脚本
 * 优先使用 Obsidian，未安装则自动安装，无法安装则回退到纯文件系统
 * 用法：node bootstrap.js [目标工作目录] [--vault ObsidianVault路径]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Re-use install-obsidian.js logic
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
const stateDir = path.join(skillDir, 'state');
const stateConfigPath = path.join(stateDir, 'config.json');
const stateLogPath = path.join(stateDir, 'archive-log.jsonl');

const allDirs = [
  'raw',
  'daily',
  'memory',
  'wiki/entities',
  'wiki/concepts',
  'wiki/comparisons',
  'wiki/syntheses',
  'summaries',
  'insights',
  'templates',
];

const vaultDirs = [
  'raw',
  'daily',
  'wiki/entities',
  'wiki/concepts',
  'wiki/comparisons',
  'wiki/syntheses',
  'summaries',
  'insights',
];

const localDirs = ['memory', 'templates'];

function log(msg) {
  console.log(`[bootstrap] ${msg}`);
}

function warn(msg) {
  console.warn(`\x1b[33m[bootstrap] ${msg}\x1b[0m`);
}

function error(msg) {
  console.error(`\x1b[31m[bootstrap] ${msg}\x1b[0m`);
}

function findDefaultVault() {
  const home = os.homedir();
  const candidates = [];
  if (os.platform() === 'darwin') {
    candidates.push(
      path.join(home, 'Library/Mobile Documents/com~apple~CloudDocs/Obsidian/Obsidian'),
      path.join(home, 'iCloudDrive/Obsidian/Obsidian'),
      path.join(home, 'Documents/Obsidian Vault'),
      path.join(home, 'Obsidian Vault')
    );
  } else if (os.platform() === 'linux') {
    candidates.push(
      path.join(home, 'Documents/Obsidian Vault'),
      path.join(home, 'Obsidian Vault')
    );
  } else if (os.platform() === 'win32') {
    candidates.push(
      path.join(home, 'Documents', 'Obsidian Vault'),
      path.join(home, 'Obsidian Vault')
    );
  }
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created: ${dir}`);
  } else {
    log(`Exists:  ${dir}`);
  }
}

function writeIndex(dir) {
  const indexPath = path.join(dir, 'index.md');
  const indexTemplate = `# 文章归档索引

> 由 article-archivist 自动生成

## 实体
- （暂无）

## 概念
- （暂无）

## 对比
- （暂无）

## 综述
- （暂无）

## 摘要
- （暂无）

## 洞察
- （暂无）
`;
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, indexTemplate);
    log(`Created: ${indexPath}`);
  } else {
    log(`Exists:  ${indexPath}`);
  }
}

function createSymlink(linkPath, targetPath) {
  try {
    if (fs.existsSync(linkPath) || fs.lstatSync(linkPath, { throwIfNoEntry: false })) {
      fs.unlinkSync(linkPath);
    }
  } catch {}
  try {
    fs.symlinkSync(targetPath, linkPath, 'dir');
    log(`Symlink: ${linkPath} -> ${targetPath}`);
  } catch (err) {
    warn(`Failed symlink ${linkPath}: ${err.message}`);
  }
}

function updateState(patch) {
  try {
    ensureDir(stateDir);
    let current = {
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
    if (fs.existsSync(stateConfigPath)) {
      current = JSON.parse(fs.readFileSync(stateConfigPath, 'utf8'));
    }
    const next = { ...current, ...patch };
    fs.writeFileSync(stateConfigPath, JSON.stringify(next, null, 2) + '\n');
    const logEntry = {
      time: new Date().toISOString(),
      event: 'bootstrap',
      mode: next.lastBootstrapMode,
      workspacePath: next.lastWorkspacePath,
      vaultPath: next.lastVaultPath,
      obsidianInstalled: next.obsidianInstalled,
      cliEnabled: next.cliEnabled,
      lastFailure: next.lastFailure || null,
    };
    fs.appendFileSync(stateLogPath, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    warn(`State update skipped: ${err.message}`);
  }
}

// Step 1: Obsidian handling
let obsidianInstalled = isObsidianInstalled();
let vaultDir = vaultArg;

if (!obsidianInstalled) {
  log('Obsidian not detected. Attempting installation...');
  const ok = installObsidian();
  if (ok) {
    ensurePath();
    launchObsidian();
    obsidianInstalled = true;
  } else {
    warn('Could not install Obsidian automatically. Falling back to plain filesystem mode.');
  }
} else if (!checkCli()) {
  ensurePath();
  launchObsidian();
}

if (obsidianInstalled && !vaultDir) {
  vaultDir = findDefaultVault();
  if (vaultDir) {
    log(`Detected default Obsidian vault: ${vaultDir}`);
  }
}

if (obsidianInstalled && !vaultDir) {
  warn('Obsidian is installed, but no vault path was provided and no default vault was found.');
  warn('To use Obsidian, please rerun with: node bootstrap.js [workdir] --vault /path/to/your/vault');
}

// Step 2-3: Create directories
if (vaultDir) {
  // Vault gets the visible knowledge dirs
  vaultDirs.forEach((d) => ensureDir(path.join(vaultDir, d)));
  writeIndex(vaultDir);
  // Workspace gets local-only dirs and symlinks
  ensureDir(targetDir);
  const symlinkNames = ['raw', 'daily', 'wiki', 'summaries', 'insights'];
  symlinkNames.forEach((name) => {
    const link = path.join(targetDir, name);
    const target = path.join(vaultDir, name);
    if (fs.existsSync(target)) {
      createSymlink(link, target);
    }
  });
  localDirs.forEach((d) => ensureDir(path.join(targetDir, d)));
} else {
  allDirs.forEach((d) => ensureDir(path.join(targetDir, d)));
  writeIndex(targetDir);
}

// Step 5: CLI reminder
if (obsidianInstalled && !checkCli()) {
  warn('\n========================================');
  warn(' IMPORTANT: Please enable Obsidian CLI ');
  warn('========================================');
  warn('1. Open Obsidian');
  warn('2. Settings -> General -> Advanced');
  warn('3. Enable "Allow external apps to communicate with Obsidian"');
  warn('4. Restart Obsidian if needed');
  warn('========================================\n');
}

updateState({
  lastVaultPath: vaultDir || null,
  lastWorkspacePath: targetDir,
  lastBootstrapMode: vaultDir ? 'obsidian' : 'plain-filesystem',
  obsidianInstalled,
  cliEnabled: checkCli(),
  lastFailure: null,
});

log('\n✅ Bootstrap complete.');
if (vaultDir) {
  log(`Vault dir:  ${vaultDir}`);
  log(`Workspace:  ${targetDir}`);
} else {
  log(`Target dir: ${targetDir} (plain filesystem mode)`);
}
