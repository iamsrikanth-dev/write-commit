import axios, { AxiosError } from 'axios';
import { buildCommitPrompt } from '../prompts/commitPrompt.js';
import { COMMIT_TEMPERATURE } from '../constants/index.js';

const POLLINATIONS_URL = 'https://text.pollinations.ai/';
const POLLINATIONS_MODEL = 'openai-fast';

// Keep diff short — Pollinations free tier has payload limits
const MAX_POLLINATIONS_DIFF = 2500;

// Phrases that signal the model has entered a reasoning loop
const LOOP_SIGNALS = [
  'we need to mention',
  'we must mention',
  'also mention',
  'we should mention',
  'we need to list',
  'we must list',
  'we need to say',
];

const COMMIT_LINE =
  /^(feat|fix|refactor|docs|chore|style|test|perf|build|ci)(\([^)]+\))?:\s+\S.{2,}/;
const SUBJECT_PREFIX = /^(subject|commit message|type|result)\s*:\s*/i;
const BULLET_LINE = /^\s*[-*]\s+\S/;

interface PollinationsResponse {
  reasoning?: string;
  content?: string;
}

/**
 * Cut the reasoning at the point where repetitive loop phrases begin,
 * so we only search the useful part of the model's thinking.
 */
function cutAtLoopStart(text: string): string {
  const lines = text.split('\n');
  let loopCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (LOOP_SIGNALS.some((s) => lower.includes(s))) {
      loopCount++;
      // If we see 3+ loop lines, cut here
      if (loopCount >= 3) {
        return lines.slice(0, i).join('\n');
      }
    } else {
      loopCount = 0;
    }
  }

  return text;
}

/**
 * Find the FIRST conventional commit subject line in the text,
 * then collect any bullet lines that immediately follow.
 * Takes the first because the model writes its best answer early,
 * then second-guesses itself into loops.
 */
function extractCommitBlock(text: string): string {
  const trimmed = cutAtLoopStart(text);
  const lines = trimmed.split('\n');

  let subjectIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().replace(SUBJECT_PREFIX, '');
    if (COMMIT_LINE.test(line)) {
      subjectIndex = i;
      break;
    }
  }

  if (subjectIndex === -1) return '';

  const subject = lines[subjectIndex].trim().replace(SUBJECT_PREFIX, '');
  const result: string[] = [subject];

  let i = subjectIndex + 1;

  // Skip blank lines and label lines ("Bullets:", "Notes:", etc.) before actual bullets
  while (
    i < lines.length &&
    (lines[i].trim() === '' || /^(bullets|notes|changes)\s*:?\s*$/i.test(lines[i].trim()))
  ) {
    if (lines[i].trim() === '') result.push('');
    i++;
  }

  // Collect bullet lines (stop at blank line after bullets or loop content)
  while (i < lines.length && BULLET_LINE.test(lines[i])) {
    result.push(lines[i].trim());
    i++;
  }

  return result.join('\n').trim();
}

function parseResponse(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as PollinationsResponse;

    if (parsed.content?.trim()) return parsed.content.trim();

    if (parsed.reasoning) {
      const extracted = extractCommitBlock(parsed.reasoning);
      if (extracted) return extracted;
    }
  } catch {
    // Plain text — search it directly
    const extracted = extractCommitBlock(raw);
    if (extracted) return extracted;
  }

  return raw.trim();
}

export async function generateWithPollinations(
  diff: string,
  short = false,
): Promise<string> {
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
      if (err.code === 'ECONNABORTED') {
        throw new Error('Pollinations AI timed out. Try again or switch provider: write-commit config');
      }
      throw new Error(err.message);
    }
    throw err;
  }
}
