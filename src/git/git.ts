import simpleGit, { SimpleGit } from 'simple-git';

function getGit(): SimpleGit {
  return simpleGit(process.cwd());
}

export async function isGitRepo(): Promise<boolean> {
  try {
    const git = getGit();
    await git.revparse(['--git-dir']);
    return true;
  } catch {
    return false;
  }
}

export async function hasStagedChanges(): Promise<boolean> {
  const git = getGit();
  const status = await git.status();
  return status.staged.length > 0;
}

export async function getStagedDiff(): Promise<string> {
  const git = getGit();
  const diff = await git.diff(['--cached']);
  return diff;
}

export interface UnpushedCommit {
  hash: string;
  message: string;
  date: string;
}

/**
 * Returns commits that exist locally but have not been pushed to the remote
 * tracking branch. Falls back to the last 10 commits on detached / no-remote repos.
 */
export async function getUnpushedCommits(): Promise<UnpushedCommit[]> {
  const git = getGit();

  // Separator unlikely to appear in a commit message
  const SEP = '||';
  const FORMAT = `%h${SEP}%s${SEP}%cr`;

  let logArgs: string[];

  try {
    // Check whether an upstream tracking branch exists
    await git.raw(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
    // If it does, show only commits ahead of it
    logArgs = ['log', `--format=${FORMAT}`, '@{u}..HEAD'];
  } catch {
    // No upstream — show last 10 commits as a fallback
    logArgs = ['log', `--format=${FORMAT}`, '-10'];
  }

  const raw = await git.raw(logArgs);

  if (!raw.trim()) return [];

  return raw
    .trim()
    .split('\n')
    .map((line) => {
      const [hash, message, date] = line.split(SEP);
      return {
        hash: (hash ?? '').trim(),
        message: (message ?? '').trim(),
        date: (date ?? '').trim(),
      };
    })
    .filter((c) => c.hash !== '');
}

export async function commit(message: string, amend = false): Promise<void> {
  const git = getGit();
  const args = ['commit', '-m', message];
  if (amend) {
    args.push('--amend');
  }
  await git.raw(args);
}
