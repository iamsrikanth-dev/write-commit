import { isGitRepo, getUnpushedCommits } from '../git/git.js';
import { logger } from '../utils/logger.js';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

export async function runLog(): Promise<void> {
  const isRepo = await isGitRepo();
  if (!isRepo) {
    logger.error('Not a git repository.');
    process.exit(1);
  }

  const commits = await getUnpushedCommits();

  if (commits.length === 0) {
    logger.info('No unpushed commits — you are up to date.');
    return;
  }

  logger.newline();
  console.log(
    `${COLORS.bold}${COLORS.cyan}Unpushed commits (${commits.length})${COLORS.reset}`,
  );
  logger.newline();

  for (const c of commits) {
    console.log(
      `  ${COLORS.yellow}${c.hash}${COLORS.reset}  ${COLORS.bold}${c.message}${COLORS.reset}  ${COLORS.dim}${c.date}${COLORS.reset}`,
    );
  }

  logger.newline();
}
