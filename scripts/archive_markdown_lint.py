#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

TARGET_PATTERNS = [
    ("quoted-break", re.compile(r'''AI["'“‘「]\n.{1,12}\n["'”’」]''')),
    ("punct-break", re.compile(r"[\u4e00-\u9fffA-Za-z0-9]\n[，。！？：；]")),
    ("mid-sentence-break", re.compile(r"[\u4e00-\u9fffA-Za-z0-9]\n[\u4e00-\u9fffA-Za-z0-9]")),
]

IGNORE_LINE_PREFIXES = ("#", "- ", "* ", "+ ", ">", "![", "```", "|", "##")
NUMBERED_LIST_RE = re.compile(r"^\d+[.)]\s")


def scan_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    findings = 0
    for idx, line in enumerate(text.splitlines(), 1):
        if line.lstrip().startswith(IGNORE_LINE_PREFIXES) or NUMBERED_LIST_RE.match(line.lstrip()):
            continue
        for _, pattern in TARGET_PATTERNS:
            if pattern.search(line):
                findings += 1
                print(f"{path}:{idx}: suspicious line break")
    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("target")
    args = parser.parse_args()
    base = Path(args.target)
    if not base.exists():
        print(f"missing target: {base}")
        return 1
    findings = 0
    if base.is_file():
        findings = scan_file(base)
    else:
        for p in sorted(base.rglob("*.md")):
            findings += scan_file(p)
    if findings == 0:
        print("No suspicious line-break issues found.")
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
