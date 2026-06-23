import axios from 'axios';
import { OpenRouterModelsResponse } from '../types/index.js';
import {
  OPENROUTER_MODELS_URL,
  PREFERRED_MODELS,
  MAX_DYNAMIC_FALLBACKS,
} from '../constants/index.js';

/**
 * Fetch all free models from OpenRouter and return their IDs,
 * sorted by context length descending (bigger context = better for diffs).
 * Returns [] silently on any network failure — callers should handle gracefully.
 */
async function fetchFreeModelIds(): Promise<string[]> {
  try {
    const res = await axios.get<OpenRouterModelsResponse>(OPENROUTER_MODELS_URL, {
      timeout: 8000,
    });

    return res.data.data
      .filter(
        (m) =>
          m.id.endsWith(':free') &&
          parseFloat(m.pricing.prompt) === 0 &&
          parseFloat(m.pricing.completion) === 0,
      )
      .sort((a, b) => b.context_length - a.context_length)
      .map((m) => m.id);
  } catch {
    return [];
  }
}

/**
 * Build the full model chain:
 *   1. Preferred/hardcoded models first (best quality when available)
 *   2. Dynamically fetched free models as fallbacks (deduped)
 *
 * This way the chain is never stale — OpenRouter decides what's free today.
 */
export async function buildModelChain(preferredModel: string): Promise<string[]> {
  const preferred = [
    preferredModel,
    ...PREFERRED_MODELS.filter((m) => m !== preferredModel),
  ];

  const dynamic = await fetchFreeModelIds();

  // Append dynamic models that aren't already in the preferred list
  const extra = dynamic
    .filter((id) => !preferred.includes(id))
    .slice(0, MAX_DYNAMIC_FALLBACKS);

  return [...preferred, ...extra];
}
