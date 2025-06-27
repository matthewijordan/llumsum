import * as fs from 'fs/promises';
import * as path from 'path';
import { getFileHash } from './hash.js';
import { getSummaryPath } from './layout.js';

export interface SummaryFile {
  hash: string;
  summary: string;
}

export async function readSummary(summaryPath: string): Promise<SummaryFile | null> {
  try {
    const content = await fs.readFile(summaryPath, 'utf-8');
    const [hashLine, ...summaryLines] = content.split('\n');
    const hash = hashLine.replace('hash: ', '');
    return {
      hash,
      summary: summaryLines.join('\n').trim(),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeSummary(summaryPath: string, summary: SummaryFile): Promise<void> {
  const content = `hash: ${summary.hash}\n\n${summary.summary}`;
  await fs.mkdir(path.dirname(summaryPath), { recursive: true });
  await fs.writeFile(summaryPath, content, 'utf-8');
}
