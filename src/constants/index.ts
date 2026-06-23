// OpenRouter
export const OPENROUTER_API_URL    = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

export const PREFERRED_MODELS: string[] = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
];

export const DEFAULT_MODEL         = PREFERRED_MODELS[0];
export const MAX_DYNAMIC_FALLBACKS = 3;

// Ollama
export const OPENROUTER_DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL          = 'llama3.2';

// Shared
export const MAX_DIFF_LENGTH           = 8000;
export const MAX_COMMIT_MESSAGE_TOKENS = 512;
export const COMMIT_TEMPERATURE        = 0.1;
