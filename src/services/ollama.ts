import axios, { AxiosError } from 'axios';
import { OllamaRequest, OllamaResponse } from '../types/index.js';
import { buildCommitPrompt } from '../prompts/commitPrompt.js';
import { COMMIT_TEMPERATURE } from '../constants/index.js';

export async function generateWithOllama(
  diff: string,
  baseUrl: string,
  model: string,
  short = false,
): Promise<string> {
  const { system, user } = buildCommitPrompt(diff, short);

  const body: OllamaRequest = {
    model,
    stream: false,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ],
    options: { temperature: COMMIT_TEMPERATURE },
  };

  try {
    const res = await axios.post<OllamaResponse>(
      `${baseUrl.replace(/\/$/, '')}/api/chat`,
      body,
      { timeout: 60000 },
    );

    const raw = res.data.message?.content?.trim();
    if (!raw) throw new Error('Ollama returned an empty response.');

    const cleaned = raw
      .replace(/^```[^\n]*\n?/, '')
      .replace(/```$/, '')
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^(here is|commit message|result)[:\s]*/i, '')
      .trim();

  return cleaned.replace(/^\n+/, '');
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to Ollama at ${baseUrl}.\nMake sure Ollama is running: https://ollama.com`,
        );
      }
      if (err.response?.status === 404) {
        throw new Error(
          `Model "${model}" not found in Ollama.\nPull it first: ollama pull ${model}`,
        );
      }
      throw new Error(err.message);
    }
    throw err;
  }
}
