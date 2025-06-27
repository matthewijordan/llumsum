export interface Summary {
  filePath: string;
  hash?: string;
  summary: string;
}

export interface SummaryResult extends Summary {
  status: 'fresh' | 'stale' | 'new';
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number; };
}
