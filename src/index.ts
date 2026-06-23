#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { runCommit } from './commands/commit.js';
import { runLog } from './commands/log.js';
import { runSetup } from './config/setup.js';
import { loadConfig, getConfigPath } from './config/store.js';
import { CommitOptions, AIConfig } from './types/index.js';
import { logger } from './utils/logger.js';

const { version } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'),
) as { version: string };

const program = new Command();

program
  .name('write-commit')
  .description('AI-powered Git commit message generator — zero setup, works instantly')
  .version(version);

// ── commit (default) ──────────────────────────────────────────────────────────
program
  .command('commit', { isDefault: true })
  .description('Generate a commit message for staged changes and commit')
  .option('-d, --dry-run', 'Generate message without committing',         false)
  .option('-y, --yes',     'Skip confirmation prompt',                    false)
  .option('--amend',       'Amend the previous commit',                   false)
  .option('-s, --short',   'Single-line subject only (no bullet body)',   false)
  .addHelpText('after', `
Message modes:
  default (full)   Subject line + bullet list covering every changed file/function.
  --short (-s)     Single subject line only, under 72 characters.

Examples:
  write-commit                    Full message, confirm before committing
  write-commit --short            One-line message only
  write-commit --short --yes      One-line, auto-confirm
  write-commit --dry-run          Preview message, do not commit
  write-commit --amend            Regenerate and amend last commit

Provider:
  Works out of the box — no setup needed.
  To use OpenRouter or Ollama: write-commit config
`)
  .action(async (options: CommitOptions) => {
    // Use saved config if exists, otherwise fall back to Pollinations (zero setup)
    const config: AIConfig = loadConfig() ?? { provider: 'pollinations' };
    await runCommit(options, config);
  });

// ── log ───────────────────────────────────────────────────────────────────────
program
  .command('log')
  .description('Show unpushed commits with timestamps')
  .action(async () => {
    await runLog();
  });

// ── config ────────────────────────────────────────────────────────────────────
program
  .command('config')
  .description('Switch provider (Pollinations / OpenRouter / Ollama) or update credentials')
  .option('--show', 'Print current config without editing')
  .addHelpText('after', `
Providers:
  pollinations   Zero setup — free, no account, no API key (default)
  openrouter     Free cloud models — requires an API key (openrouter.ai/keys)
  ollama         Fully local — requires Ollama running on your machine
`)
  .action(async (opts: { show?: boolean }) => {
    if (opts.show) {
      const config = loadConfig();
      logger.newline();
      if (!config) {
        logger.bold('Provider : pollinations (default — no config file)');
        logger.dim('Run: write-commit config   to switch provider');
      } else {
        logger.bold(`Provider : ${config.provider}`);
        if (config.provider === 'openrouter') {
          logger.bold(`Model    : ${config.model}`);
          logger.bold(`API key  : ${config.apiKey.slice(0, 8)}${'*'.repeat(20)}`);
        } else if (config.provider === 'ollama') {
          logger.bold(`URL      : ${config.baseUrl}`);
          logger.bold(`Model    : ${config.model}`);
        }
        logger.dim(`\nConfig file: ${getConfigPath()}`);
      }
      logger.newline();
      return;
    }

    await runSetup(true);
  });

program.parse(process.argv);
