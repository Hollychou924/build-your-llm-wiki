#!/usr/bin/env python3
"""
微信公众号文章抓取 fallback
用法：python3 extract_wechat_fallback.py <URL> [output.txt]
"""
import sys, subprocess, re, html, json, hashlib
from pathlib import Path

url = sys.argv[1] if len(sys.argv) > 1 else None
out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/wechat_article_fallback.txt'

if not url:
    print('Usage: python3 extract_wechat_fallback.py <URL> [output.txt]')
    sys.exit(1)

STATE_DIR = Path(__file__).resolve().parent.parent / 'state'
STATE_CONFIG = STATE_DIR / 'config.json'
STATE_LOG = STATE_DIR / 'archive-log.jsonl'


def read_state():
    base = {
        'version': 1,
        'lastVaultPath': None,
        'lastWorkspacePath': None,
        'lastBootstrapMode': None,
        'obsidianInstalled': None,
        'cliEnabled': None,
        'lastExtractor': None,
        'lastFailure': None,
        'archivedUrls': {},
    }
    try:
        if not STATE_CONFIG.exists():
            return base
        data = json.loads(STATE_CONFIG.read_text(encoding='utf-8'))
        base.update(data)
        return base
    except Exception:
        return base


def write_state(patch):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    current = read_state()
    current.update(patch)
    STATE_CONFIG.write_text(json.dumps(current, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def append_log(entry):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with STATE_LOG.open('a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')


url_hash = hashlib.sha1(url.encode('utf-8')).hexdigest()
state = read_state()
duplicate = bool(state.get('archivedUrls', {}).get(url_hash))

try:
    subprocess.run([
        'curl', '-s', '-o', '/tmp/wechat_article.html', '-L', '--compressed',
        '-A', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        '-H', 'Accept: text/html,application/xhtml+xml',
        '-H', 'Accept-Language: zh-CN,zh;q=0.9',
        url,
    ], check=True)
except subprocess.CalledProcessError as e:
    write_state({'lastExtractor': 'wechat-fallback', 'lastFailure': str(e)})
    append_log({
        'time': __import__('datetime').datetime.now().astimezone().isoformat(),
        'event': 'extract',
        'extractor': 'wechat-fallback',
        'url': url,
        'urlHash': url_hash,
        'duplicate': duplicate,
        'success': False,
        'output': out,
        'message': str(e),
    })
    raise

with open('/tmp/wechat_article.html', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('id="js_content"')
if idx < 0:
    write_state({'lastExtractor': 'wechat-fallback', 'lastFailure': '正文未找到'})
    append_log({
        'time': __import__('datetime').datetime.now().astimezone().isoformat(),
        'event': 'extract',
        'extractor': 'wechat-fallback',
        'url': url,
        'urlHash': url_hash,
        'duplicate': duplicate,
        'success': False,
        'output': out,
        'message': '正文未找到',
    })
    print('正文未找到')
    sys.exit(2)

end = c.find('</div>', idx)
section = c[idx:end+6] if end > idx else c[idx:idx+200000]

section = re.sub(r'<script[^>]*>.*?</script>', '', section, flags=re.DOTALL)
section = re.sub(r'<style[^>]*>.*?</style>', '', section, flags=re.DOTALL)
section = re.sub(r'<!--.*?-->', '', section, flags=re.DOTALL)
section = re.sub(r'<img[^>]*?data-src="([^"]+)"[^>]*?>', r'\n![图片](\1)\n', section)
section = re.sub(r'<img[^>]*?>', '\n[图片]\n', section)
section = re.sub(r'<br\s*/?>', '\n', section)
section = re.sub(r'<p[^>]*?>', '\n', section)
section = re.sub(r'<strong[^>]*?>', '**', section)
section = re.sub(r'</strong>', '**', section)
section = re.sub(r'<[^>]+>', '', section)
section = html.unescape(section)
lines = [l.strip() for l in section.split('\n') if l.strip()]

with open(out, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

archived = dict(state.get('archivedUrls', {}))
archived[url_hash] = {
    'url': url,
    'time': __import__('datetime').datetime.now().astimezone().isoformat(),
    'extractor': 'wechat-fallback',
    'success': True,
    'output': out,
}
write_state({
    'lastExtractor': 'wechat-fallback',
    'lastFailure': None,
    'archivedUrls': archived,
})
append_log({
    'time': __import__('datetime').datetime.now().astimezone().isoformat(),
    'event': 'extract',
    'extractor': 'wechat-fallback',
    'url': url,
    'urlHash': url_hash,
    'duplicate': duplicate,
    'success': True,
    'output': out,
})

if duplicate:
    print('Duplicate URL detected in state log:', url)
print('Saved to', out)
