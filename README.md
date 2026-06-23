# commit-ai

[![npm version](https://img.shields.io/npm/v/commit-ai.svg)](https://www.npmjs.com/package/commit-ai)
[![CI](https://github.com/iamsrikanth-dev/ai-commit/actions/workflows/ci.yml/badge.svg)](https://github.com/iamsrikanth-dev/ai-commit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

> AI-powered Git commit message generator. Reads your staged diff, generates a [Conventional Commit](https://www.conventionalcommits.org/) message, and commits — in seconds.

Supports **OpenRouter** (free cloud models) and **Ollama** (fully local, no API key). Config is stored globally — set up once, works in every project.

---

## Features

- **Two providers** — OpenRouter (cloud) or Ollama (local)
- **One-time setup** — saved to `~/.ai-commit/config.json`, no `.env` per project
- **Two message modes** — full (subject + bullet list per changed file) or short (one line)
- **Auto fallback** — if one OpenRouter free model is rate-limited, tries the next automatically
- **`--dry-run`** — preview the message without committing
- **`--yes`** — skip the confirmation prompt for scripting
- **`--amend`** — regenerate and amend the last commit
- **`commit-ai log`** — show unpushed commits with timestamps
- **`commit-ai config`** — switch provider or update your API key

---

## Install

```bash
npm install -g commit-ai
```

On first run, a setup wizard asks for your provider and saves the config globally.

---

## Quick start

```bash
# Stage your changes
git add .

# Generate message, confirm, commit
commit-ai
```

That's it.

---

## Setup

### Option 1 — OpenRouter (free cloud models)

Get a free API key at [openrouter.ai/keys](https://openrouter.ai/keys). No credit card required.

```
Choose your AI provider:

  1  OpenRouter  (cloud — free models available)
  2  Ollama      (local — runs on your machine)

Enter 1 or 2: 1

OpenRouter API key: sk-or-...
Model (press Enter for default: meta-llama/llama-3.3-70b-instruct:free):

✅ Config saved to /Users/you/.ai-commit/config.json
```

### Option 2 — Ollama (fully local)

Install [Ollama](https://ollama.com) and pull a model first:

```bash
ollama pull llama3.2
```

Then run `commit-ai` and choose option 2.

---

## Usage

```bash
commit-ai                  # full message (subject + bullets), confirm before commit
commit-ai --short          # single subject line only
commit-ai --yes            # skip confirmation
commit-ai --dry-run        # preview message, do not commit
commit-ai --amend          # amend the previous commit

commit-ai log              # show unpushed commits with timestamps
commit-ai config           # change provider, API key, or model
commit-ai config --show    # print current settings
```

---

## Message modes

### Full (default)

Best for multi-file commits. Covers every changed file and function.

```
Suggested commit message:

  feat(NoteEditor): add per-note lock with PIN and keyboard shortcut

  - NoteEditor: add lock toggle button that gates editing behind a PIN prompt
  - useNoteLock: new hook stores lock state in zustand, persists to localStorage
  - LockModal: PIN input auto-focuses on open, clears on wrong attempt
  - Cmd+Shift+L shortcut wires to useNoteLock.toggle() via useHotkeys
```

### Short (`--short`)

Best for small, focused commits. One line, under 72 characters.

```
Suggested commit message:

  feat(NoteEditor): add Cmd+Shift+L shortcut to toggle note lock
```

---

## Configuration

Config is stored at `~/.ai-commit/config.json` — one file for your whole machine.

To update it at any time:

```bash
commit-ai config           # re-run the setup wizard
commit-ai config --show    # see current settings
```

---

## How the OpenRouter fallback works

Free-tier models have rate limits. `commit-ai` handles this automatically:

1. Tries your configured model first
2. If rate-limited or unavailable — fetches the live list of free models from OpenRouter and tries them in order
3. Only fails if every available free model is exhausted

You never see a dead error just because one model is busy.

---

## Development

```bash
git clone https://github.com/iamsrikanth-dev/ai-commit.git
cd ai-commit
npm install
npm run build
npm link          # makes `commit-ai` globally available from your local clone
```

Run without building:

```bash
npm run dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

---

## License

[MIT](./LICENSE) © Srikanth
