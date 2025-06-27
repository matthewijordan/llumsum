import * as fs from 'fs/promises';
import * as path from 'path';

export interface LlumsumConfig {
  syncConfirmationThreshold: number;
  ignorePatterns: string[];
  llmModel?: string;
  llmApiBase?: string;
  llmApiKey?: string;
  parallelism?: number;
}

export interface PersonalConfig {
  llmApiKey?: string;
}

const DEFAULT_CONFIG: LlumsumConfig = {
  syncConfirmationThreshold: 50,
  ignorePatterns: [
    'node_modules/**',
    '.git/**',
    '.llumsum/**',
    'dist/**',
    'temp/**',
    'package-lock.json',
  ],
  llmModel: 'google/gemini-2.5-flash',
  llmApiBase: 'https://openrouter.ai/api/v1',
  parallelism: 8,
};

const CONFIG_FILE_PATH = path.join(process.cwd(), '.llumsum', 'project.config.json');
const PERSONAL_CONFIG_FILE_PATH = path.join(process.cwd(), '.llumsum', 'personal.config.json');

export async function loadConfig(): Promise<LlumsumConfig> {
  try {
    const configContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    const userConfig: Partial<LlumsumConfig> = JSON.parse(configContent);
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If config file doesn't exist, create it with defaults
      await fs.mkdir(path.dirname(CONFIG_FILE_PATH), { recursive: true });
      await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

export async function loadPersonalConfig(): Promise<PersonalConfig> {
  try {
    const personalConfigContent = await fs.readFile(PERSONAL_CONFIG_FILE_PATH, 'utf-8');
    return JSON.parse(personalConfigContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {}; // Return empty object if file not found
    }
    throw error;
  }
}
