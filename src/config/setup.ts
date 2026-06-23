import * as readline from 'readline';
import { AIConfig } from '../types/index.js';
import { saveConfig, getConfigPath } from './store.js';
import { DEFAULT_MODEL, OPENROUTER_DEFAULT_OLLAMA_URL, DEFAULT_OLLAMA_MODEL } from '../constants/index.js';

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
};

function print(msg: string): void { process.stdout.write(msg + '\n'); }
function br(): void { process.stdout.write('\n'); }

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function pickProvider(): Promise<'openrouter' | 'ollama'> {
  print(`${C.bold}Choose your AI provider:${C.reset}`);
  br();
  print(`  ${C.cyan}${C.bold}1${C.reset}  OpenRouter  ${C.dim}(cloud — free models available)${C.reset}`);
  print(`  ${C.cyan}${C.bold}2${C.reset}  Ollama      ${C.dim}(local — runs on your machine)${C.reset}`);
  br();

  while (true) {
    const answer = await ask('Enter 1 or 2: ');
    if (answer === '1') return 'openrouter';
    if (answer === '2') return 'ollama';
    print('Please enter 1 or 2.');
  }
}

async function setupOpenRouter(): Promise<AIConfig> {
  br();
  print(`${C.dim}Get a free API key at: https://openrouter.ai/keys${C.reset}`);
  br();

  let apiKey = '';
  while (!apiKey) {
    apiKey = await ask(`${C.bold}OpenRouter API key:${C.reset} `);
    if (!apiKey) print('API key cannot be empty.');
  }

  const modelInput = await ask(
    `${C.bold}Model${C.reset} ${C.dim}(press Enter for default: ${DEFAULT_MODEL})${C.reset}: `,
  );

  return {
    provider: 'openrouter',
    apiKey,
    model: modelInput || DEFAULT_MODEL,
  };
}

async function setupOllama(): Promise<AIConfig> {
  br();
  print(`${C.dim}Make sure Ollama is running: https://ollama.com${C.reset}`);
  br();

  const urlInput = await ask(
    `${C.bold}Ollama base URL${C.reset} ${C.dim}(press Enter for default: ${OPENROUTER_DEFAULT_OLLAMA_URL})${C.reset}: `,
  );

  const modelInput = await ask(
    `${C.bold}Model name${C.reset} ${C.dim}(press Enter for default: ${DEFAULT_OLLAMA_MODEL})${C.reset}: `,
  );

  return {
    provider: 'ollama',
    baseUrl: urlInput || OPENROUTER_DEFAULT_OLLAMA_URL,
    model: modelInput || DEFAULT_OLLAMA_MODEL,
  };
}

export async function runSetup(isReconfig = false): Promise<AIConfig> {
  br();
  if (isReconfig) {
    print(`${C.cyan}${C.bold}⚙  ai-commit — update config${C.reset}`);
    print(`${C.dim}Config is saved globally — changes apply to every project.${C.reset}`);
  } else {
    print(`${C.cyan}${C.bold}👋 Welcome to ai-commit!${C.reset}`);
    print(`${C.dim}One-time setup — saved globally at ~/.ai-commit/config.json.${C.reset}`);
    print(`${C.dim}Works in every project without any .env files.${C.reset}`);
    br();
    print(`${C.bold}How it generates commit messages:${C.reset}`);
    print(`  ${C.cyan}default${C.reset}  Subject line + bullet list covering every changed file/function.`);
    print(`           Best for multi-file commits. Run: ${C.bold}ai-commit${C.reset}`);
    print(`  ${C.cyan}--short${C.reset}  Single subject line only, under 72 characters.`);
    print(`           Best for small focused commits. Run: ${C.bold}ai-commit --short${C.reset}`);
    br();
    print(`${C.dim}You can always change your provider later with: ai-commit config${C.reset}`);
  }
  br();

  const provider = await pickProvider();
  const config   = provider === 'openrouter' ? await setupOpenRouter() : await setupOllama();

  saveConfig(config);

  br();
  print(`${C.green}${C.bold}✅ Config saved to ${getConfigPath()}${C.reset}`);
  br();

  return config;
}
