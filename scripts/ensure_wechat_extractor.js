#!/usr/bin/env node
const { execSync } = require('child_process');

function hasBin(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore', shell: '/bin/bash' });
    return true;
  } catch {
    return false;
  }
}

function run(command) {
  execSync(command, { stdio: 'inherit', shell: '/bin/bash' });
}

try {
  if (!hasBin('skillhub')) {
    console.log('[wechat-installer] skillhub not found, installing CLI only...');
    run('curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash -s -- --cli-only');
  } else {
    console.log('[wechat-installer] skillhub already installed');
  }

  console.log('[wechat-installer] installing wechat-article-extractor-skill via skillhub...');
  run('skillhub install wechat-article-extractor-skill');
  console.log('[wechat-installer] done');
} catch (err) {
  console.error('[wechat-installer] failed:', err.message || err);
  process.exit(1);
}
