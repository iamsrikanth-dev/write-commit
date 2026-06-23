import axios, { AxiosError } from 'axios';
import { buildCommitPrompt } from '../prompts/commitPrompt.js';

const POLLINATIONS_BASE = 'https://text.pollinations.ai';

/**
 * Pollinations GET API returns plain text — no auth, no reasoning leak.
 * We embed system + user prompt into a single GET request.
 */
export async function generateWithPollinations(
  diff: string,
  short = false,
): Promise<string> {
  const { system, user } = buildCommitPrompt(diff, short);

  // Combine into one prompt the GET endpoint can handle
  const combined = `${system}\n\n${user}\n\nWrite the commit message now:`;
  const encoded = encodeURIComponent(combined);
  const url = `${POLLINATIONS_BASE}/${encoded}`;

  try {
    const res = await axios.get<string>(url, {
      responseType: 'text',
      timeout: 40000,
      // Use a consistent seed so same diff gives same result
      params: { seed: 42, model: 'openai' },
    });

    const raw = typeof res.data === 'string' ? res.data.trim() : String(res.data).trim();
    if (!raw) throw new Error('Pollinations returned an empty response.');

    // Strip any markdown fences or preamble the model may add
    const cleaned = raw
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
