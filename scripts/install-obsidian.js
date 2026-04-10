#!/usr/bin/env node
/**
 * 检测并自动安装 Obsidian
 * 支持 macOS (brew/dmg)、Linux (AppImage)、Windows (winget/提示)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

const platform = os.platform();

function exists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function log(msg) {
  console.log(`[install-obsidian] ${msg}`);
}

function warn(msg) {
  console.warn(`\x1b[33m[install-obsidian] ${msg}\x1b[0m`);
}

function error(msg) {
  console.error(`\x1b[31m[install-obsidian] ${msg}\x1b[0m`);
}

function isObsidianInstalled() {
  try {
    if (platform === 'darwin') {
      fs.accessSync('/Applications/Obsidian.app', fs.constants.F_OK);
      return true;
    }
    if (platform === 'linux') {
      // Check common AppImage locations or desktop entries
      const candidates = [
        path.join(os.homedir(), '.local/bin/obsidian'),
        path.join(os.homedir(), 'Applications/Obsidian.AppImage'),
        '/usr/bin/obsidian',
      ];
      return candidates.some((p) => fs.existsSync(p));
    }
    if (platform === 'win32') {
      const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
      return fs.existsSync(path.join(programFiles, 'Obsidian', 'Obsidian.exe'));
    }
    return false;
  } catch {
    return false;
  }
}

function installObsidianDarwin() {
  if (exists('brew')) {
    log('Installing Obsidian via Homebrew...');
    execSync('brew install --cask obsidian', { stdio: 'inherit' });
    return true;
  }
  warn('Homebrew not found. Please install Homebrew first, or manually download Obsidian from https://obsidian.md/download');
  return false;
}

function installObsidianLinux() {
  const binDir = path.join(os.homedir(), '.local/bin');
  const target = path.join(binDir, 'obsidian');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  log('Downloading Obsidian AppImage...');
  // Use GitHub latest release API to find download URL would be ideal, but here we use a known stable link pattern
  // For production robustness, point to the official download page if dynamic resolution is too heavy
  const url = 'https://github.com/obsidianmd/obsidian-releases/releases/download/v1.8.9/Obsidian-1.8.9.AppImage';
  try {
    execSync(`curl -L -o "${target}" "${url}"`, { stdio: 'inherit' });
    fs.chmodSync(target, 0o755);
    log(`Installed Obsidian AppImage to ${target}`);
    warn('To integrate with your desktop environment, you may need to create a .desktop entry manually.');
    return true;
  } catch (err) {
    error('Failed to download Obsidian AppImage. Please install manually from https://obsidian.md/download');
    return false;
  }
}

function installObsidianWin32() {
  if (exists('winget')) {
    log('Installing Obsidian via winget...');
    try {
      execSync('winget install Obsidian.Obsidian', { stdio: 'inherit' });
      return true;
    } catch {
      error('winget installation failed. Please install manually from https://obsidian.md/download');
      return false;
    }
  }
  warn('Please install Obsidian manually from https://obsidian.md/download');
  return false;
}

function installObsidian() {
  if (platform === 'darwin') return installObsidianDarwin();
  if (platform === 'linux') return installObsidianLinux();
  if (platform === 'win32') return installObsidianWin32();
  warn(`Unsupported platform: ${platform}. Please install Obsidian manually.`);
  return false;
}

function launchObsidian() {
  try {
    if (platform === 'darwin') {
      execSync('open /Applications/Obsidian.app', { stdio: 'ignore' });
    } else if (platform === 'linux') {
      const appImage = path.join(os.homedir(), '.local/bin/obsidian');
      if (fs.existsSync(appImage)) {
        spawn(appImage, [], { detached: true, stdio: 'ignore' });
      }
    } else if (platform === 'win32') {
      const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
      const exe = path.join(programFiles, 'Obsidian', 'Obsidian.exe');
      if (fs.existsSync(exe)) {
        spawn('cmd', ['/c', 'start', '', exe], { detached: true, stdio: 'ignore' });
      }
    }
    log('Launched Obsidian.');
  } catch (err) {
    warn('Could not auto-launch Obsidian. Please start it manually.');
  }
}

function checkCli() {
  try {
    execSync('obsidian --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getObsidianBinPath() {
  if (platform === 'darwin') {
    return '/Applications/Obsidian.app/Contents/MacOS';
  }
  if (platform === 'linux') {
    return path.join(os.homedir(), '.local/bin');
  }
  if (platform === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    return path.join(pf, 'Obsidian');
  }
  return null;
}

function shellRcFiles() {
  const home = os.homedir();
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) return [path.join(home, '.zshrc')];
  if (shell.includes('bash')) return [path.join(home, '.bashrc'), path.join(home, '.bash_profile')];
  return [path.join(home, '.zshrc'), path.join(home, '.bashrc'), path.join(home, '.bash_profile')];
}

function ensurePath() {
  if (platform === 'win32') {
    warn('Windows PATH auto-injection is not implemented. Please ensure Obsidian is in your system PATH manually.');
    return false;
  }
  const binPath = getObsidianBinPath();
  if (!binPath) return false;

  const exportLine = `export PATH="$PATH:${binPath}"`;
  const rcs = shellRcFiles();

  for (const rc of rcs) {
    if (fs.existsSync(rc)) {
      const content = fs.readFileSync(rc, 'utf8');
      if (content.includes(binPath)) {
        log(`Obsidian PATH already registered in ${rc}`);
        return true;
      }
      fs.appendFileSync(rc, `\n# Added by article-archivist\n${exportLine}\n`);
      log(`Added Obsidian PATH to ${rc}`);
      return true;
    }
  }

  // If no RC exists, create .zshrc (or .bashrc)
  const targetRc = rcs[0];
  fs.writeFileSync(targetRc, `# Added by article-archivist\n${exportLine}\n`);
  log(`Created ${targetRc} and added Obsidian PATH`);
  return true;
}

function run() {
  if (isObsidianInstalled()) {
    log('Obsidian is already installed.');
    if (!checkCli()) {
      ensurePath();
      launchObsidian();
      warn('\n========================================');
      warn(' IMPORTANT: Please enable Obsidian CLI ');
      warn('========================================');
      warn('1. Open Obsidian');
      warn('2. Go to Settings -> General -> Advanced');
      warn('3. Enable "Allow external apps to communicate with Obsidian"');
      warn('4. Restart Obsidian if needed');
      warn('5. Then run: source ~/.zshrc  (or ~/.bashrc)');
      warn('========================================\n');
    }
  } else {
    log('Obsidian not found. Attempting to install...');
    const ok = installObsidian();
    if (ok) {
      ensurePath();
      launchObsidian();
      warn('\n========================================');
      warn(' IMPORTANT: Please enable Obsidian CLI ');
      warn('========================================');
      warn('1. Open Obsidian');
      warn('2. Go to Settings -> General -> Advanced');
      warn('3. Enable "Allow external apps to communicate with Obsidian"');
      warn('4. Restart Obsidian if needed');
      warn('5. Then run: source ~/.zshrc  (or ~/.bashrc)');
      warn('========================================\n');
    } else {
      error('Automatic installation failed. The archivist will fall back to plain filesystem mode.');
    }
  }
}

if (require.main === module) {
  run();
}

module.exports = { isObsidianInstalled, installObsidian, launchObsidian, checkCli, ensurePath, run };
