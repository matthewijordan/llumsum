#!/usr/bin/env node
import { Command } from 'commander';
import { readOrGenerateSummary, isStale, generateTransientSummary } from '../index.js';
import { glob } from 'glob';
import * as path from 'path';
import pLimit from 'p-limit';
import { getSourcePath } from '../fs/layout.js';
import * as fs from 'fs/promises';
import { loadConfig } from '../config.js';

const program = new Command();
const projectRoot = process.cwd();

function isWithinProject(filePath: string): boolean {
  const resolvedPath = path.resolve(filePath);
  return resolvedPath.startsWith(projectRoot);
}

program
    .command('get-summary <filePath>')
    .description('Gets a summary for a single file, generating it if needed. Does not save the summary if the file is outside the project.')
    .action(async (filePath) => {
        const absolutePath = path.resolve(projectRoot, filePath);
        let result;
        if (isWithinProject(absolutePath)) {
            result = await readOrGenerateSummary(absolutePath);
        } else {
            result = await generateTransientSummary(absolutePath);
        }
        console.log(`Status: ${result.status}`);
        if (result.hash) {
            console.log(`Hash: ${result.hash}`);
        }
        console.log(`Summary:\n${result.summary}`);
    });

program
    .command('save-summary <filePath>')
    .description('Reads or generates a single summary')
    .action(async (filePath) => {
        const absolutePath = path.resolve(projectRoot, filePath);
        const result = await readOrGenerateSummary(absolutePath);
        console.log(`Status: ${result.status}`);
        console.log(`Hash: ${result.hash}`);
        console.log(`Summary:\n${result.summary}`);
    });

program
    .command('sync')
    .description('Regenerates stale summaries and removes orphan ones')
    .option('-f, --force', 'Force regeneration of all summaries')
    .action(async (options) => {
        console.log('Starting sync...');

        const config = await loadConfig();

        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;
        let totalTotalTokens = 0;

        const allFiles = await glob('**/*', { nodir: true, ignore: config.ignorePatterns });
        const filesToSummarize: string[] = [];

        for (const file of allFiles) {
            const absolutePath = path.resolve(projectRoot, file);
            if (options.force || await isStale(absolutePath)) {
                filesToSummarize.push(absolutePath);
            }
        }

        if (filesToSummarize.length > config.syncConfirmationThreshold) {
            const answer = await new Promise<string>((resolve) => {
                process.stdout.write(`\n${filesToSummarize.length} files need summarization. This may incur LLM costs.\nDo you want to proceed? (y/N): `);
                process.stdin.once('data', (data) => {
                    resolve(data.toString().trim().toLowerCase());
                });
            });

            if (answer !== 'y') {
                console.log('Sync aborted.');
                return;
            }
        }

        const limit = pLimit(config.parallelism || 8); // Limit concurrent LLM calls
        const summaryPromises = filesToSummarize.map((filePath) =>
            limit(async () => {
                const relativePath = path.relative(projectRoot, filePath);
                console.log(`Summarizing ${relativePath}...`);
                const result = await readOrGenerateSummary(filePath, options.force);
                if (result.tokenUsage) {
                    totalPromptTokens += result.tokenUsage.promptTokens;
                    totalCompletionTokens += result.tokenUsage.completionTokens;
                    totalTotalTokens += result.tokenUsage.totalTokens;
                    console.log(`Finished summarizing ${relativePath}. Tokens: P:${result.tokenUsage.promptTokens} C:${result.tokenUsage.completionTokens} T:${result.tokenUsage.totalTokens}`);
                } else {
                    console.log(`Finished summarizing ${relativePath}. No token usage reported.`);
                }
            })
        );
        await Promise.all(summaryPromises);

        const summaryFiles = await glob('.llumsum/**/*.summary', { nodir: true });
        let cleanedCount = 0;
        for (const summaryFile of summaryFiles) {
            const absoluteSummaryPath = path.resolve(projectRoot, summaryFile);
            const sourcePath = getSourcePath(projectRoot, absoluteSummaryPath);
            try {
                await fs.access(sourcePath);
            } catch (error) {
                console.log(`Cleaning ${summaryFile}...`);
                await fs.unlink(absoluteSummaryPath);
                cleanedCount++;
            }
        }
        console.log(`Sync complete. Removed ${cleanedCount} orphan summaries.`);
        console.log(`Total Token Usage: Prompt: ${totalPromptTokens}, Completion: ${totalCompletionTokens}, Total: ${totalTotalTokens}`);
    });

program.parse(process.argv);
