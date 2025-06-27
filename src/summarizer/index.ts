import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { SYSTEM_PROMPT } from './prompt.js';
import * as dotenv from 'dotenv';

dotenv.config();

const LLMSUM_OPENAI_API_KEY = process.env.LLMSUM_OPENAI_API_KEY;
const LLMSUM_LLM_MODEL = process.env.LLMSUM_LLM_MODEL;
const LLMSUM_OPENAI_API_BASE = process.env.LLMSUM_OPENAI_API_BASE;

if (!LLMSUM_OPENAI_API_KEY) {
  throw new Error('LLMSUM_OPENAI_API_KEY environment variable is not set.');
}

if (!LLMSUM_LLM_MODEL) {
  throw new Error('LLMSUM_LLM_MODEL environment variable is not set.');
}

if (!LLMSUM_OPENAI_API_BASE) {
  throw new Error('LLMSUM_OPENAI_API_BASE environment variable is not set.');
}

const model = new ChatOpenAI({
  apiKey: LLMSUM_OPENAI_API_KEY,
  modelName: LLMSUM_LLM_MODEL,
  configuration: {
    baseURL: LLMSUM_OPENAI_API_BASE,
  },
});

export async function generateSummaryWithLLM(filePath: string, fileContent: string): Promise<{ summary: string; tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number; }; }> {
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