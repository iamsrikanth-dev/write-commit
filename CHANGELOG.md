# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-23

### Added
- First public release
- One-time global setup wizard — choose OpenRouter (cloud) or Ollama (local)
- Config stored at `~/.ai-commit/config.json` — no `.env` files needed per project
- Full commit message mode (default): subject line + per-file bullet list
- Short commit message mode (`--short` / `-s`): single subject line only
- Automatic model fallback chain for OpenRouter free tier rate limits
- `ai-commit log` — show unpushed commits with timestamps
- `ai-commit config` — re-run setup wizard
- `ai-commit config --show` — print current provider and model
- `--dry-run` flag — preview message without committing
- `--yes` / `-y` flag — skip confirmation prompt
- `--amend` flag — amend the previous commit
