# Contributing to commit-ai

Thank you for taking the time to contribute! Here's everything you need to get started.

## Local setup

```bash
git clone https://github.com/iamsrikanth-dev/commit-ai.git
cd commit-ai
npm install
npm run build
npm link          # makes `commit-ai` available globally from your local clone
```

To run without building every time:

```bash
npm run dev       # uses tsx — runs TypeScript directly
```

## Project structure

```
src/
├── index.ts              CLI entry point (Commander setup)
├── commands/
│   ├── commit.ts         Main commit flow
│   └── log.ts            Unpushed commits display
├── config/
│   ├── setup.ts          First-run and re-config wizard
│   └── store.ts          Read/write ~/.commit-ai/config.json
├── services/
│   ├── openrouter.ts     OpenRouter API + model fallback chain
│   ├── ollama.ts         Ollama local API
│   └── modelResolver.ts  Fetches live free models from OpenRouter
├── prompts/
│   └── commitPrompt.ts   System + user prompt templates (full & short mode)
├── git/
│   └── git.ts            isGitRepo / getStagedDiff / commit helpers
├── utils/
│   ├── logger.ts         Coloured terminal output
│   └── validation.ts     Input guards
├── types/
│   └── index.ts          TypeScript interfaces
└── constants/
    └── index.ts          API URLs, default models, limits
```

## Making changes

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes in `src/`
3. Run `npm run build` — must compile with zero errors
4. Run `npm run lint` — must pass
5. Test manually with a real git repo
6. Open a pull request against `main`

## Commit style

This project uses Conventional Commits. The `commit-ai` tool itself is great for this:

```bash
git add .
commit-ai
```

Or write it manually: `feat(scope): what changed`.

## Reporting bugs

Open an issue at https://github.com/iamsrikanth-dev/commit-ai/issues and include:
- Your OS and Node version (`node -v`)
- The command you ran
- The full error output
- Your provider (OpenRouter / Ollama)

## Feature requests

Open an issue with the `enhancement` label and describe the use case — not just the solution.
