export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface OpenRouterChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
  index: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

// Ollama

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream: false;
  options?: {
    temperature?: number;
  };
}

export interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

// Global config

export type AIProvider = 'pollinations' | 'openrouter' | 'ollama';

export interface OpenRouterConfig {
  provider: 'openrouter';
  apiKey: string;
  model: string;
}

export interface OllamaConfig {
  provider: 'ollama';
  baseUrl: string;
  model: string;
}

export interface PollinationsConfig {
  provider: 'pollinations';
}

export type AIConfig = PollinationsConfig | OpenRouterConfig | OllamaConfig;

// CLI

export interface CommitOptions {
  dryRun: boolean;
  yes: boolean;
  amend: boolean;
  short: boolean;
}

export interface GitStatus {
  isRepo: boolean;
  hasStagedChanges: boolean;
}
