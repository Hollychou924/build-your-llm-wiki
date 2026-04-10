# article-archivist

An Obsidian-first OpenClaw skill for turning articles into a durable personal knowledge base.

It packages the workflow behind my own article archiving system into a reusable skill that other OpenClaw users can install and run from zero to one.

## What it does

- Archives shared articles, WeChat posts, blog posts, and reference pages
- Uses a decision tree instead of a mechanical checklist to decide what to update
- Creates and maintains:
  - `raw/` for source-preserving article archives
  - `daily/` for day-level logs
  - `memory/` for local durable notes
  - `wiki/entities/`, `wiki/concepts/`, `wiki/comparisons/`, `wiki/syntheses/`
  - `summaries/` and `insights/`
  - `index.md` when knowledge-layer files change
- Prefers Obsidian by default, but falls back to plain filesystem mode when needed
- Bundles WeChat extraction so users do not need to install a second skill

## Why this exists

Most article-saving flows stop at “save the link” or “write a summary”. That is too weak.

This skill is opinionated around a stronger workflow:

1. Save the article in a durable raw form
2. Leave a trace in the daily log
3. Decide whether it deserves entities, concepts, comparisons, syntheses, summaries, or insights
4. Keep the index navigable

The goal is not just collecting links. The goal is building a searchable, compounding knowledge base.

## Key design decisions

- **Obsidian-first**: best default experience for a personal knowledge base
- **Plain filesystem fallback**: the workflow still works without GUI or Obsidian
- **WeChat-first extraction path**: embedded extractor first, local curl+python fallback second
- **Decision tree over checklist**: not every article should touch every directory
- **Local `memory/`**: `memory/` and `templates/` stay in the workspace, not inside the Obsidian vault
- **Self-contained packaging**: the repo vendors the WeChat extractor dependency so the generated `.skill` is installable as a single artifact

## Repository layout

```text
article-archivist/
├── SKILL.md
├── README.md
├── assets/
│   └── raw-template.md
├── references/
│   ├── setup.md
│   ├── workflow-tree.md
│   ├── extraction-methods.md
│   ├── naming-conventions.md
│   ├── gotchas.md
│   └── guardrails.md
├── scripts/
│   ├── bootstrap.js
│   ├── install-obsidian.js
│   ├── extract_wechat.js
│   └── extract_wechat_fallback.py
├── state/
│   ├── README.md
│   ├── config.json
│   └── archive-log.example.jsonl
└── vendor/
    └── wechat-article-extractor-skill/
```

## Installation

You can install from the packaged `.skill` artifact or use the source directly.

### Option A: use the packaged skill

Place `article-archivist.skill` into your OpenClaw skills directory and install it using your normal OpenClaw workflow.

### Option B: use the source directly

Clone this repository into your local skills folder, then reference it from OpenClaw.

## Quick start

Run bootstrap first:

```bash
node /path/to/article-archivist/scripts/bootstrap.js [workspace-dir] [--vault /path/to/obsidian/vault]
```

Bootstrap behavior:

- Detects whether Obsidian is installed
- Attempts to install Obsidian if it is missing
- Adds Obsidian CLI to shell `PATH` on macOS/Linux
- Launches Obsidian
- Detects the default vault when possible
- Creates vault directories and workspace symlinks
- Falls back to plain filesystem mode if Obsidian setup is not available

Then archive articles using the workflow defined in `SKILL.md` and `references/workflow-tree.md`.

## How WeChat extraction works

For WeChat articles:

1. `scripts/extract_wechat.js` is the primary path
2. `scripts/extract_wechat_fallback.py` is the fallback path
3. The workflow should never prefer generic `web_fetch` first for WeChat posts

This matters because many WeChat article bodies live in hidden DOM containers that generic extractors often miss.

## State and memory

The skill keeps a small internal runtime state under `state/`.

It is intentionally separate from the user knowledge base.

Current state support includes:

- last bootstrap mode
- last vault/workspace path
- last extractor used
- last failure reason
- seen URL hashes for future dedupe strategy
- append-only event log for bootstrap and extraction

## Public publishing note

This repository is intended to be public. Because of that:

- runtime state should stay sanitized
- machine-local logs should not be committed as real history
- local shell or private editor config should not be published unless intentional

## Recommended reading

- `SKILL.md`
- `references/setup.md`
- `references/workflow-tree.md`
- `references/gotchas.md`
- `references/guardrails.md`

## Status

This is already a usable, installable skill.

It is especially strong on:

- workflow completeness
- Obsidian-first onboarding
- self-contained packaging
- WeChat handling
- guardrails and gotchas

The next quality step is wiring final archive completion states back into skill state, plus adding explicit duplicate URL policies.

## License

Add the license you want before broad distribution. If you want, MIT is the easiest default.
