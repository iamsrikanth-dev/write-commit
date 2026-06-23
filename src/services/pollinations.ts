import axios, { AxiosError } from 'axios';
import { buildCommitPrompt } from '../prompts/commitPrompt.js';
import { COMMIT_TEMPERATURE } from '../constants/index.js';

const POLLINATIONS_URL = 'https://text.pollinations.ai/';
const POLLINATIONS_MODEL = 'openai';

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
        timeout: 30000,
      },
    );

    const raw = typeof res.data === 'string' ? res.data.trim() : String(res.data).trim();
    if (!raw) throw new Error('Pollinations returned an empty response.');

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
