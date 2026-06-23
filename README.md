# write-commit

[![npm version](https://img.shields.io/npm/v/write-commit.svg)](https://www.npmjs.com/package/write-commit)
[![CI](https://github.com/iamsrikanth-dev/write-commit/actions/workflows/ci.yml/badge.svg)](https://github.com/iamsrikanth-dev/write-commit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

> AI-powered Git commit message generator. Install it, use it — no configuration required.

Reads your staged diff, generates a [Conventional Commit](https://www.conventionalcommits.org/) message using AI, and commits on your approval. Works instantly out of the box via **Pollinations AI** (free, no account). Optionally upgrade to **OpenRouter** or **Ollama** for higher quality messages.

---

## Install

```bash
npm install -g write-commit
```

That's it. No API key. No account. No config file.

---

## Quick start

```bash
git add .
write-commit
```

---

## Usage

```bash
write-commit                   # full message — subject + bullets per changed file/function
write-commit --short           # single subject line only
write-commit --yes             # skip confirmation prompt
write-commit --dry-run         # preview message, do not commit
write-commit --amend           # regenerate and amend the last commit

write-commit log               # show unpushed commits with timestamps
write-commit config            # switch provider or update credentials
write-commit config --show     # print current provider settings
```

---

## Message modes

### Full (default)

Covers every changed file and function. Best for multi-file commits.

```
Suggested commit message:

  feat(NoteEditor): add per-note lock with PIN and keyboard shortcut

  - NoteEditor: add lock toggle button that gates editing behind a PIN prompt
  - useNoteLock: new hook stores lock state in zustand, persists to localStorage
  - LockModal: PIN input auto-focuses on open, clears on wrong attempt
  - Cmd+Shift+L shortcut wires to useNoteLock.toggle() via useHotkeys

Commit this change? (Y/n)
```

### Short (`--short`)

Single subject line only, under 72 characters. Best for small focused commits.

```
Suggested commit message:

  feat(NoteEditor): add Cmd+Shift+L shortcut to toggle note lock

Commit this change? (Y/n)
```

---

## Providers

`write-commit` works with three AI providers. Switch anytime with `write-commit config`.

| Provider | Setup | Quality | How to use |
|---|---|---|---|
| **Pollinations** | None — works instantly | Good | Default, no action needed |
| **OpenRouter** | Free API key | Better | `write-commit config` → choose 2 |
| **Ollama** | Install Ollama locally | Best (private) | `write-commit config` → choose 3 |

### Switching provider

```bash
write-commit config
```

```
⚙  write-commit — provider config

  1  Pollinations  (default — free, no account, no API key)
  2  OpenRouter    (free cloud models — better quality, needs API key)
  3  Ollama        (fully local — runs on your machine)

Enter 1, 2, or 3:
```

Config is saved globally at `~/.ai-commit/config.json` — works across every project on your machine, no `.env` files needed anywhere.

### OpenRouter

Get a free API key at [openrouter.ai/keys](https://openrouter.ai/keys). No credit card required.

### Ollama

Install [Ollama](https://ollama.com), pull a model, then configure:

```bash
ollama pull llama3.2
write-commit config   # choose 3, press Enter for defaults
```

---

## Flags

| Flag | Short | Description |
|---|---|---|
| `--dry-run` | `-d` | Generate message without committing |
| `--yes` | `-y` | Skip the confirmation prompt |
| `--short` | `-s` | Single subject line only |
| `--amend` | | Amend the previous commit |

---

## How OpenRouter fallback works

When using OpenRouter, if a free model is rate-limited or unavailable, `write-commit` automatically:

1. Fetches the live list of free models from OpenRouter
2. Tries the next available one
3. Only fails if every free model is exhausted

You never see a rate-limit error — it just silently moves to the next model.

---

## Commands

| Command | Description |
|---|---|
| `write-commit` | Generate message and commit staged changes |
| `write-commit log` | Show unpushed commits with timestamps |
| `write-commit config` | Switch provider or update API key / model |
| `write-commit config --show` | Print current provider and settings |
| `write-commit --version` | Print installed version |
| `write-commit --help` | Show all options |

---

## Development

```bash
git clone https://github.com/iamsrikanth-dev/write-commit.git
cd write-commit
npm install
npm run build
npm link          # makes `write-commit` available globally from your local clone
```

Run without building every time:

```bash
npm run dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

---

## License

[MIT](./LICENSE) © Srikanth
