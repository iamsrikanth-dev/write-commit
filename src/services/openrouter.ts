import axios, { AxiosError } from 'axios';
import { OpenRouterRequest, OpenRouterResponse } from '../types/index.js';
import {
  OPENROUTER_API_URL,
  MAX_COMMIT_MESSAGE_TOKENS,
  COMMIT_TEMPERATURE,
} from '../constants/index.js';
import { buildCommitPrompt } from '../prompts/commitPrompt.js';
import { buildModelChain } from './modelResolver.js';
import { logger } from '../utils/logger.js';

/**
 * Send a single request to one model.
 * Throws on any error — caller decides whether to retry.
 */
async function callModel(
  diff: string,
  apiKey: string,
  model: string,
  short: boolean,
): Promise<string> {
  const { system, user } = buildCommitPrompt(diff, short);

  const requestBody: OpenRouterRequest = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ],
    max_tokens: MAX_COMMIT_MESSAGE_TOKENS,
    temperature: COMMIT_TEMPERATURE,
  };

  const response = await axios.post<OpenRouterResponse>(
    OPENROUTER_API_URL,
    requestBody,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  );

  const raw = response.data.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('AI returned an empty response.');

  const cleaned = raw
    .replace(/^```[^\n]*\n?/, '')
    .replace(/```$/, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^(here is|commit message|result)[:\s]*/i, '')
    .trim();

  // Drop any leading blank lines the model may prepend
  return cleaned.replace(/^\n+/, '');
}

/**
 * Returns true for errors that are worth retrying with a different model.
 */
function isRetryable(status: number | undefined, detail: string): boolean {
  const msg = detail.toLowerCase();
  return (
    status === 429 ||
    (status !== undefined && status >= 500) ||
    msg.includes('no endpoints') ||
    msg.includes('unavailable') ||
    msg.includes('provider returned error') ||
    msg.includes('use this slug instead') ||
    msg.includes('not available for free') ||
    msg.includes('context length')
  );
}

/**
 * Try each model in the chain (preferred → dynamic free fallbacks).
 * Silently skips any model that is rate-limited or unavailable.
 * Hard-fails only on auth errors or when every model is exhausted.
 */
export async function generateCommitMessage(
  diff: string,
  apiKey: string,
  preferredModel: string,
  short = false,
): Promise<string> {
  const chain = await buildModelChain(preferredModel);

  let lastError: Error = new Error('All models failed.');

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];

    try {
      const message = await callModel(diff, apiKey, model, short);

      if (i > 0) {
        logger.dim(`  (used fallback model: ${model})`);
      }

      return message;
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const detail =
          (err.response?.data as { error?: { message?: string } })?.error
            ?.message ?? err.message;

        // Auth failure — retrying won't help
        if (status === 401) {
          throw new Error(
            'Invalid OpenRouter API key. Check your OPENROUTER_API_KEY.',
          );
        }

        if (isRetryable(status, detail)) {
          const isLast = i === chain.length - 1;
          if (!isLast) {
            const reason =
              status === 429 ? 'rate limited' : 'unavailable on free tier';
            logger.dim(`  ${model} ${reason} — trying next model...`);
          }
          lastError = new Error(detail);
          continue;
        }

        lastError = new Error(detail);
        continue;
      }

      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(
    `${lastError.message}\n\nAll free models are currently unavailable.\nVisit https://openrouter.ai/models?q=free to check available models.`,
  );
}
