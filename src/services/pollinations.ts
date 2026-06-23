import axios, { AxiosError } from 'axios';
import { buildCommitPrompt } from '../prompts/commitPrompt.js';
import { COMMIT_TEMPERATURE } from '../constants/index.js';

const POLLINATIONS_URL = 'https://text.pollinations.ai/';
const POLLINATIONS_MODEL = 'openai-fast';

interface PollinationsResponse {
  role?: string;
  reasoning?: string;
  content?: string;
  tool_calls?: unknown[];
}

/**
 * The Pollinations model is a reasoning model — it outputs its thinking in
 * `reasoning` and leaves `content` empty. We extract the commit message
 * from the end of the reasoning, where the model writes its final answer.
 */
function extractFromReasoning(reasoning: string): string {
  // Conventional commit pattern: type(scope): subject
  const conventionalPattern = /^(feat|fix|refactor|docs|chore|style|test|perf|build|ci)(\([^)]+\))?:\s+.+/m;

  // Split into lines and find the last block starting with a conventional commit line
  const lines = reasoning.split('\n');
  let lastMatchIndex = -1;

  for (let i = lines.length - 1; i >= 0; i--) {
    if (conventionalPattern.test(lines[i].trim())) {
      lastMatchIndex = i;
      break;
    }
  }

  if (lastMatchIndex === -1) return '';

  // Collect the commit subject + any bullet lines that follow
  const commitLines: string[] = [];
  for (let i = lastMatchIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    // Stop if we hit another reasoning block (long prose sentence)
    if (i > lastMatchIndex && line.length > 0 && !line.startsWith('-') && !conventionalPattern.test(line)) {
      break;
    }
    commitLines.push(lines[i]);
  }

  return commitLines.join('\n').trim();
}

function parseResponse(raw: string): string {
  // Try to parse as JSON (reasoning model response)
  try {
    const parsed = JSON.parse(raw) as PollinationsResponse;

    // Content field has the answer (non-reasoning models)
    if (parsed.content && parsed.content.trim()) {
      return parsed.content.trim();
    }

    // Reasoning model: extract commit message from the reasoning text
    if (parsed.reasoning && parsed.reasoning.trim()) {
      const extracted = extractFromReasoning(parsed.reasoning);
      if (extracted) return extracted;
    }
  } catch {
    // Not JSON — plain text response, use as-is
  }

  return raw.trim();
}

export async function generateWithPollinations(
  diff: string,
  short = false,
): Promise<string> {
  const { system, user } = buildCommitPrompt(diff, short);

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
        timeout: 40000,
      },
    );

    const raw = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    if (!raw.trim()) throw new Error('Pollinations returned an empty response.');

    const message = parseResponse(raw);
    if (!message) throw new Error('Could not extract commit message from response.');

    // Strip markdown fences or preamble
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
        throw new Error('Pollinations AI timed out. Try again.');
      }
      throw new Error(err.message);
    }
    throw err;
  }
}
