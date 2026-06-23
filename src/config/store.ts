import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AIConfig } from '../types/index.js';

const CONFIG_DIR = path.join(os.homedir(), '.ai-commit');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function configExists(): boolean {
  return fs.existsSync(CONFIG_FILE);
}

export function loadConfig(): AIConfig | null {
  if (!configExists()) return null;
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as AIConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: AIConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function deleteConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}
