import { logger } from './logger.js';

export function validateDiff(diff: string): void {
  if (!diff || diff.trim() === '') {
    logger.error('No staged changes found.');
    logger.newline();
    logger.dim('Stage your changes first:');
    logger.dim('  git add .');
    logger.newline();
    process.exit(1);
  }
}
