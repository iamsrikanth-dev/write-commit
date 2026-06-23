#!/usr/bin/env node

import { Command } from 'commander';
import { runCommit } from './commands/commit.js';
import { runLog } from './commands/log.js';
import { runSetup } from './config/setup.js';
import { loadConfig, getConfigPath } from './config/store.js';
import { CommitOptions } from './types/index.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('ai-commit')
  .description('AI-powered Git commit message generator (OpenRouter or Ollama)')
  .version('1.0.0');

// ── commit (default) ──────────────────────────────────────────────────────────
program
  .command('commit', { isDefault: true })
  .description('Generate a commit message for staged changes and commit')
  .option('-d, --dry-run',  'Generate message without committing',                                false)
  .option('-y, --yes',      'Skip confirmation prompt',                                           false)
  .option('--amend',        'Amend the previous commit',                                          false)
  .option('-s, --short',    'Single-line subject only (no bullet body)',                          false)
  .addHelpText('after', `
Message modes:
  default (full)   Subject line + bullet list covering every changed file/function.
                   Best for multi-file commits — gives reviewers full context.

  --short (-s)     Single subject line only, under 72 characters.
                   Best for tiny, focused commits.

Examples:
  ai-commit                    Full message, confirm before committing
  ai-commit --short            One-line message only
  ai-commit --short --yes      One-line, auto-confirm
  ai-commit --dry-run          Preview full message, do not commit
  ai-commit --amend            Regenerate message and amend last commit
`)
  .action(async (options: CommitOptions) => {
    let config = loadConfig();

    // First-time: run setup wizard
    if (!config) {
      config = await runSetup(false);
    }

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
  .description('View or update your AI provider settings')
  .option('--show', 'Print current config without editing')
  .action(async (opts: { show?: boolean }) => {
    if (opts.show) {
      const config = loadConfig();
      if (!config) {
        logger.error('No config found. Run: ai-commit config');
        process.exit(1);
      }
      logger.newline();
      logger.bold(`Provider : ${config.provider}`);
      if (config.provider === 'openrouter') {
        logger.bold(`Model    : ${config.model}`);
        logger.bold(`API key  : ${config.apiKey.slice(0, 8)}${'*'.repeat(20)}`);
      } else {
        logger.bold(`URL      : ${config.baseUrl}`);
        logger.bold(`Model    : ${config.model}`);
      }
      logger.dim(`\nConfig file: ${getConfigPath()}`);
      logger.newline();
      return;
    }

    await runSetup(true);
  });

program.parse(process.argv);
