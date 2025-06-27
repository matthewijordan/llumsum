import * as fs from 'fs/promises';
import * as path from 'path';
import { getFileHash } from './fs/hash.js';
import { getSummaryPath } from './fs/layout.js';
import { readSummary, writeSummary } from './fs/readWrite.js';
import { generateSummaryWithLLM } from './summarizer/index.js';
import { SummaryResult } from './types/summary.js';

const projectRoot = process.cwd();

function ensureWithinProject(filePath: string): void {
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error(`File is outside of the project root: ${filePath}`);
  }
}

export async function readOrGenerateSummary(filePath: string, force: boolean = false): Promise<SummaryResult> {
    ensureWithinProject(filePath);
    const summaryPath = getSummaryPath(projectRoot, filePath);
    const summaryFile = await readSummary(summaryPath);
    const fileHash = await getFileHash(filePath);

    if (!force && summaryFile && summaryFile.hash === fileHash) {
        return {
            filePath,
            hash: fileHash,
            summary: summaryFile.summary,
            status: 'fresh',
        };
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { summary: newSummary, tokenUsage } = await generateSummaryWithLLM(filePath, fileContent);

    await writeSummary(summaryPath, { hash: fileHash, summary: newSummary });

    return {
        filePath,
        hash: fileHash,
        summary: newSummary,
        status: summaryFile ? 'stale' : 'new',
        tokenUsage,
    };
}

export async function generateSummary(filePath: string): Promise<SummaryResult> {
    ensureWithinProject(filePath);
    const summaryPath = getSummaryPath(projectRoot, filePath);
    const fileHash = await getFileHash(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { summary: newSummary, tokenUsage } = await generateSummaryWithLLM(filePath, fileContent);

    await writeSummary(summaryPath, { hash: fileHash, summary: newSummary });

    return {
        filePath,
        hash: fileHash,
        summary: newSummary,
        status: 'new',
        tokenUsage,
    };
}

export async function readSummaryFile(filePath: string): Promise<SummaryResult | null> {
    ensureWithinProject(filePath);
    const summaryPath = getSummaryPath(projectRoot, filePath);
    const summaryFile = await readSummary(summaryPath);

    if (!summaryFile) {
        return null;
    }

    const fileHash = await getFileHash(filePath);

    return {
        filePath,
        hash: summaryFile.hash,
        summary: summaryFile.summary,
        status: summaryFile.hash === fileHash ? 'fresh' : 'stale',
    };
}

export async function isStale(filePath: string): Promise<boolean> {
    ensureWithinProject(filePath);
    const summaryPath = getSummaryPath(projectRoot, filePath);
    const summaryFile = await readSummary(summaryPath);

    if (!summaryFile) {
        return true;
    }

    const fileHash = await getFileHash(filePath);
    return summaryFile.hash !== fileHash;
}

export async function generateTransientSummary(filePath: string): Promise<SummaryResult> {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const { summary: newSummary, tokenUsage } = await generateSummaryWithLLM(filePath, fileContent);

  return {
    filePath,
    hash: undefined, // No hash for transient summaries
    summary: newSummary,
    status: 'new',
    tokenUsage,
  };
}
