import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { SYSTEM_PROMPT } from './prompt.js';
import { loadConfig, loadPersonalConfig } from '../config.js';

let model: ChatOpenAI;

export async function initializeLLM() {
  const config = await loadConfig();
  const personalConfig = await loadPersonalConfig();

  const llmApiKey = personalConfig.llmApiKey || config.llmApiKey || process.env.LLMSUM_OPENAI_API_KEY;
  const llmModel = config.llmModel || process.env.LLMSUM_LLM_MODEL;
  const llmApiBase = config.llmApiBase || process.env.LLMSUM_OPENAI_API_BASE;

  if (!llmApiKey) {
    throw new Error('LLM API key is not set. Please provide it in personal_config.json, config.json, or as LLMSUM_OPENAI_API_KEY environment variable.');
  }

  if (!llmModel) {
    throw new Error('LLM model is not set. Please provide it in config.json or as LLMSUM_LLM_MODEL environment variable.');
  }

  if (!llmApiBase) {
    throw new Error('LLM API base URL is not set. Please provide it in config.json or as LLMSUM_OPENAI_API_BASE environment variable.');
  }

  model = new ChatOpenAI({
    apiKey: llmApiKey,
    modelName: llmModel,
    configuration: {
      baseURL: llmApiBase,
    },
  });
}

export async function generateSummaryWithLLM(filePath: string, fileContent: string): Promise<{ summary: string; tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number; }; }> {
  if (!model) {
    await initializeLLM();
  }
  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(`File: ${filePath}\n\nContent:\n${fileContent}`),
  ];

  const response = await model.invoke(messages);
  const tokenUsage = response.response_metadata?.tokenUsage ? {
    promptTokens: response.response_metadata.tokenUsage.promptTokens,
    completionTokens: response.response_metadata.tokenUsage.completionTokens,
    totalTokens: response.response_metadata.tokenUsage.totalTokens,
  } : undefined;

  return { summary: response.content.toString(), tokenUsage };
}