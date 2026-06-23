import axios, { AxiosError } from 'axios';
import { buildCommitPrompt } from '../prompts/commitPrompt.js';
import { COMMIT_TEMPERATURE } from '../constants/index.js';

const POLLINATIONS_URL = 'https://text.pollinations.ai/';
const POLLINATIONS_MODEL = 'openai-fast';

// Pollinations free tier struggles with large payloads — keep diff short
const MAX_POLLINATIONS_DIFF = 3000;

interface PollinationsResponse {
  reasoning?: string;
  content?: string;
  tool_calls?: unknown[];
}

const COMMIT_LINE = /^(feat|fix|refactor|docs|chore|style|test|perf|build|ci)(\([^)]+\))?:\s+\S.*/;
const BULLET_LINE = /^\s*-\s+\S/;

/**
 * The model writes its final answer inside `reasoning` but leaves `content`
 * empty. Scan the reasoning for the LAST conventional commit subject line,
 * then collect any bullet lines that immediately follow it.
 */
function extractFromReasoning(reasoning: string): string {
  const lines = reasoning.split('\n');

  let subjectIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (COMMIT_LINE.test(lines[i].trim())) {
      subjectIndex = i;
      break;
    }
  }

  if (subjectIndex === -1) return '';

  const result: string[] = [lines[subjectIndex].trim()];

  // Collect blank line + bullets that immediately follow
  let i = subjectIndex + 1;
  // Allow one blank separator line
  if (i < lines.length && lines[i].trim() === '') {
    result.push('');
    i++;
  }
  while (i < lines.length && BULLET_LINE.test(lines[i])) {
    result.push(lines[i].trim());
    i++;
  }

  return result.join('\n').trim();
}

function parseResponse(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as PollinationsResponse;

    if (parsed.content && parsed.content.trim()) {
      return parsed.content.trim();
    }
    if (parsed.reasoning) {
      const extracted = extractFromReasoning(parsed.reasoning);
      if (extracted) return extracted;
    }
  } catch {
    // Plain text response — use as-is
    const extracted = extractFromReasoning(raw);
    if (extracted) return extracted;
  }

  return raw.trim();
}

export async function generateWithPollinations(
  diff: string,
  short = false,
): Promise<string> {
  // Truncate aggressively — Pollinations free tier has payload limits
  const trimmedDiff =
    diff.length > MAX_POLLINATIONS_DIFF
      ? diff.slice(0, MAX_POLLINATIONS_DIFF) + '\n... (truncated)'
      : diff;

  const { system, user } = buildCommitPrompt(trimmedDiff, short);

  try {
    const res = await axios.post<string>(
      POLLINATIONS_URL,
      {
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user },
        ],
        model: POLLINATIONS_MODEL,
        temperature: COMMIT_TEMPERATURE,
        seed: Math.floor(Math.random() * 10000),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'text',
        timeout: 45000,
      },
    );

    const raw = typeof res.data === 'string' ? res.data.trim() : JSON.stringify(res.data);
    if (!raw) throw new Error('Pollinations returned an empty response.');

    const message = parseResponse(raw);
    if (!message) throw new Error('Could not extract a commit message from the response.');

    const cleaned = message
      .replace(/^```[^\n]*\n?/, '')
      .replace(/```$/, '')
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^(here is|commit message|result)[:\s]*/i, '')
      .trim();

    return short
      ? (cleaned.split('\n').find((l) => l.trim() !== '') ?? cleaned)
      : cleaned.replace(/^\n+/, '');
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new Error('Cannot reach Pollinations AI. Check your internet connection.');
      }
      if (err.code === 'ECONNABORTED' || err.code === 'ERR_BAD_RESPONSE') {
        throw new Error('Pollinations AI timed out. Try again or switch provider: write-commit config');
      }
      throw new Error(err.message);
    }
    throw err;
  }
}
