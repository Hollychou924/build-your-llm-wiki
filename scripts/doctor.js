#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const skillDir = path.resolve(__dirname, '..');
const statePath = path.join(skillDir, 'state', 'config.json');

function getWorkspaceStateDir(workspacePath) {
  return path.join(workspacePath, '.article-archivist', 'state');
}

function hasBin(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore', shell: '/bin/bash' });
    return true;
  } catch {
    return false;
  }
}

function print(label, value, hint = '') {
  const suffix = hint ? ` - ${hint}` : '';
  console.log(`${label}: ${value}${suffix}`);
}

function readState() {
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch {}
  return null;
}

const state = readState();
const workspace = state?.lastWorkspacePath || '(not initialized)';
const vault = state?.lastVaultPath || '(plain filesystem or not initialized)';
const workspaceStateDir = state?.lastWorkspacePath ? getWorkspaceStateDir(state.lastWorkspacePath) : null;

console.log('# article-archivist doctor');
print('node', hasBin('node') ? 'ok' : 'missing');
print('python3', hasBin('python3') ? 'ok' : 'missing', 'fallback and lint may need this');
print('obsidian', hasBin('obsidian') ? 'ok' : 'not found', 'optional');
print('skillhub', hasBin('skillhub') ? 'ok' : 'missing', 'used to install wechat-article-extractor-skill');
print('workspace', workspace);
print('vault', vault);
print('state', state ? 'ok' : 'missing', 'skill-level state, run bootstrap first');
print('workspace-state', workspaceStateDir && fs.existsSync(workspaceStateDir) ? 'ok' : 'missing', 'workspace-scoped dedupe and archive log');

const requiredDirs = ['raw', 'daily', 'memory'];
for (const dir of requiredDirs) {
  const p = state?.lastWorkspacePath ? path.join(state.lastWorkspacePath, dir) : null;
  const ok = p && fs.existsSync(p);
  print(`dir:${dir}`, ok ? 'ok' : 'missing');
}

if (workspaceStateDir && fs.existsSync(workspaceStateDir)) {
  const archiveLogPath = path.join(workspaceStateDir, 'archive-log.jsonl');
  print('workspace-log', fs.existsSync(archiveLogPath) ? 'ok' : 'missing');
}

if (!state) {
  console.log('\nNext step: node scripts/bootstrap.js [workspace-dir] [--vault /path/to/obsidian/vault]');
} else {
  console.log('\nNext step: start feeding article URLs into the skill workflow.');
}

if (!hasBin('skillhub')) {
  console.log('Wechat extractor setup: node scripts/ensure_wechat_extractor.js');
}
