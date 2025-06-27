import * as path from 'path';

const LLUMSUM_DIR = '.llumsum';

export function getSummaryPath(projectRoot: string, sourcePath: string): string {
  const relativeSource = path.relative(projectRoot, sourcePath);
  return path.join(projectRoot, LLUMSUM_DIR, relativeSource) + '.summary';
}

export function getSourcePath(projectRoot: string, summaryPath: string): string {
    const relativeSummary = path.relative(path.join(projectRoot, LLUMSUM_DIR), summaryPath);
    return path.join(projectRoot, relativeSummary.replace(/\.summary$/, ''));
}
