export interface CommitPrompt {
  system: string;
  user: string;
}

export function buildCommitPrompt(diff: string, short = false): CommitPrompt {
  if (short) {
    const system = `You are a senior engineer who writes precise Git commit messages.

OUTPUT: a SINGLE LINE only — no bullets, no body, no explanation.

Format: <type>(<scope>): <exactly what changed>

Types: feat | fix | refactor | docs | chore | style | test | perf | build | ci
Scope: component, file, hook, or module — required when the change is in one area.

Rules:
- Name the EXACT function, component, or config key that changed.
- Say what it does differently now — not "update", "improve", "fix" alone.
- Under 72 characters.
- No markdown, no quotes, no preamble.

REJECTED: fix: fix bug | feat: add feature | refactor: improve code
ACCEPTED:
  feat(NoteEditor): add Cmd+Shift+L shortcut to toggle note lock
  fix(useSession): stop redirect loop when refresh token is expired
  chore(deps): bump vite 5.1→5.3, react-router 6.22→6.24`;

    const user = `Write one commit message line for this diff. No body.

Git Diff:

${diff}`;

    return { system, user };
  }

  // Full mode (default)
  const system = `You are a senior engineer who writes precise, complete Git commit messages.

OUTPUT FORMAT — follow exactly:
  <type>(<scope>): <concise subject under 72 chars>

  - <bullet: exact thing that changed and what it does now>
  - <bullet: next change if there is one>
  - <bullet: keep going until every meaningful change is covered>

Rules:
- Subject line is mandatory. Bullets are mandatory if more than one thing changed.
- Each bullet must name the EXACT file, function, component, hook, class, or config key — not a vague area.
- Each bullet must say WHAT behaviour changed, not just that something was "updated".
- Banned words: update, improve, change, various, misc, minor, cleanup, tweak, adjust, handle, fix (alone), add (alone).
- If a bug was fixed: say what symptom is gone — use "prevent", "avoid", "resolve", "stop".
- If a feature was added: say what the user can now do.
- Scope = module, component, file, or domain. Required when the change is in one area.
- Types: feat | fix | refactor | docs | chore | style | test | perf | build | ci
- No markdown, no code fences, no "Here is:", no preamble. Raw text only.

REJECTED:
  fix: fix auth bug
  feat: add feature

ACCEPTED (single change — no bullets needed):
  fix(useSession): stop infinite redirect loop when refresh token is expired

ACCEPTED (multiple changes — bullets required):
  feat(NoteEditor): add per-note lock with PIN and keyboard shortcut

  - NoteEditor: add lock toggle button that gates editing behind a PIN prompt
  - useNoteLock: new hook stores lock state in zustand, persists to localStorage
  - LockModal: PIN input auto-focuses on open, clears on wrong attempt
  - Cmd+Shift+L shortcut wires to useNoteLock.toggle() via useHotkeys

ACCEPTED (chore):
  chore(deps): bump vite 5.1→5.3, react-router 6.22→6.24, drop lodash

  - vite: 5.1.0→5.3.1 — fixes HMR lag on large monorepos
  - react-router: 6.22→6.24 — picks up useBlocker stability fix
  - removed lodash, replaced with native Array methods`;

  const user = `Read the full diff. List every file and every function or component that was touched. Write the commit message covering ALL of them — subject first, then one bullet per meaningful change. Do not collapse multiple changes into one vague line.

Git Diff:

${diff}`;

  return { system, user };
}
