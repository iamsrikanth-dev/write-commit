import * as readline from 'readline';
import { CommitOptions, AIConfig } from '../types/index.js';
import { isGitRepo, hasStagedChanges, getStagedDiff, commit } from '../git/git.js';
import { generateCommitMessage } from '../services/openrouter.js';
import { generateWithOllama } from '../services/ollama.js';
import { generateWithPollinations } from '../services/pollinations.js';
import { logger } from '../utils/logger.js';
import { validateDiff } from '../utils/validation.js';
import { MAX_DIFF_LENGTH } from '../constants/index.js';

function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim().toLowerCase() !== 'n'); });
  });
}

async function generate(diff: string, config: AIConfig, short: boolean): Promise<string> {
  if (config.provider === 'pollinations') {
    return generateWithPollinations(diff, short);
  }
  if (config.provider === 'ollama') {
    return generateWithOllama(diff, config.baseUrl, config.model, short);
  }
  return generateCommitMessage(diff, config.apiKey, config.model, short);
}

export async function runCommit(options: CommitOptions, config: AIConfig): Promise<void> {
  // Validate git state
  const isRepo = await isGitRepo();
  if (!isRepo) {
    logger.error('Not a git repository.');
    logger.newline();
    logger.dim('Initialize one with:');
    logger.dim('  git init');
    process.exit(1);
  }

  const staged = await hasStagedChanges();
  if (!staged) {
    logger.error('No staged changes found.');
    logger.newline();
    logger.dim('Stage your changes first:');
    logger.dim('  git add .');
    logger.newline();
    process.exit(1);
  }

  // Get diff
  logger.info('Analyzing staged changes...');
  const rawDiff = await getStagedDiff();
  validateDiff(rawDiff);

  const diff =
    rawDiff.length > MAX_DIFF_LENGTH
      ? rawDiff.slice(0, MAX_DIFF_LENGTH) + '\n... (diff truncated)'
      : rawDiff;

  // Generate
  logger.info('Generating commit message...');

  let message: string;
  try {
    message = await generate(diff, config, options.short);
  } catch (err) {
    logger.error(err instanceof Error ? err.message : 'Failed to generate commit message.');
    process.exit(1);
  }

  // Display
  logger.highlight('Suggested commit message:', message);

  if (options.dryRun) {
    logger.dim('--dry-run: no commit was made.');
    return;
  }

  // Confirm
  const confirmed =
    options.yes || (await askConfirmation('Commit this change? (Y/n) '));

  if (!confirmed) {
    logger.warning('Commit cancelled.');
    return;
  }

  // Commit
  try {
    await commit(message, options.amend);
    logger.success('Commit created successfully');
  } catch (err) {
    logger.error(`Git commit failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
