export interface DiffChunkPayload {
  fileName: string;
  diff: string;
  validLineNumbers: number[];
}

export class DiffParser {
  private static readonly MAX_CHUNK_LINES = 300;

  /**
   * Parses a raw unified diff into manageable chunks per file or per hunk group.
   */
  static parse(rawDiff: string): DiffChunkPayload[] {
    if (!rawDiff || !rawDiff.trim()) {
      return [];
    }

    // 1. Normalize line endings
    const normalizedDiff = rawDiff.replace(/\r\n/g, '\n').trim();

    const fileDiffs = this.splitByFile(normalizedDiff);
    const chunks: DiffChunkPayload[] = [];

    for (const fileDiff of fileDiffs) {
      if (!fileDiff.includes('@@')) {
        continue; // Skip deleted files, mode changes, or binary files without hunks
      }

      const fileName = this.extractFileName(fileDiff);
      const lines = fileDiff.split('\n');

      if (lines.length <= this.MAX_CHUNK_LINES) {
        const validLineNumbers = this.extractValidLineNumbers(fileDiff);
        chunks.push({
          fileName,
          diff: fileDiff,
          validLineNumbers:
            validLineNumbers.length > 0 ? validLineNumbers : [1],
        });
      } else {
        const hunkChunks = this.splitByHunks(fileName, fileDiff);
        chunks.push(...hunkChunks);
      }
    }

    // Fallback: If splitByFile failed to match 'diff --git' but hunks exist
    if (chunks.length === 0 && normalizedDiff.includes('@@')) {
      const validLineNumbers = this.extractValidLineNumbers(normalizedDiff);
      chunks.push({
        fileName: 'patch.diff',
        diff: normalizedDiff,
        validLineNumbers: validLineNumbers.length > 0 ? validLineNumbers : [1],
      });
    }

    return chunks;
  }

  /**
   * Splits a multi-file unified diff into individual file diff blocks.
   */
  private static splitByFile(rawDiff: string): string[] {
    const rawFiles = rawDiff.split(/(?=^diff --git )/m);
    return rawFiles.filter((f) => f.trim().length > 0);
  }

  /**
   * Extracts target file path handling quotes, spaces, and renamed files.
   */
  private static extractFileName(fileDiff: string): string {
    // Check for +++ b/path line first
    const plusLineMatch = fileDiff.match(/^\+\+\+\s+(?:b\/)?(.+)$/m);
    if (plusLineMatch && plusLineMatch[1] && plusLineMatch[1] !== '/dev/null') {
      return plusLineMatch[1].replace(/^"|"$/g, '').trim();
    }

    // Fallback to diff --git header
    const headerMatch = fileDiff.match(
      /^diff --git\s+(?:a\/|")(.*?)(?:")?\s+(?:b\/|")(.*?)(?:")?$/m,
    );
    if (headerMatch && headerMatch[2]) {
      return headerMatch[2].trim();
    }

    return 'unknown_file';
  }

  /**
   * Splits a large file diff into smaller chunks grouped by hunks.
   */
  private static splitByHunks(
    fileName: string,
    fileDiff: string,
  ): DiffChunkPayload[] {
    const lines = fileDiff.split('\n');
    const headerLines: string[] = [];
    const hunks: string[] = [];
    let currentHunk: string[] = [];
    let readingHunks = false;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        readingHunks = true;
        if (currentHunk.length > 0) {
          hunks.push(currentHunk.join('\n'));
          currentHunk = [];
        }
      }

      if (!readingHunks) {
        headerLines.push(line);
      } else {
        currentHunk.push(line);
      }
    }

    if (currentHunk.length > 0) {
      hunks.push(currentHunk.join('\n'));
    }

    const header = headerLines.join('\n');
    const chunks: DiffChunkPayload[] = [];
    let tempHunkGroup: string[] = [];
    let currentLineCount = 0;

    for (const hunk of hunks) {
      const hunkLineCount = hunk.split('\n').length;

      if (
        currentLineCount + hunkLineCount > this.MAX_CHUNK_LINES &&
        tempHunkGroup.length > 0
      ) {
        const fullChunkDiff = `${header}\n${tempHunkGroup.join('\n')}`;
        const validLineNumbers = this.extractValidLineNumbers(fullChunkDiff);
        chunks.push({
          fileName,
          diff: fullChunkDiff,
          validLineNumbers:
            validLineNumbers.length > 0 ? validLineNumbers : [1],
        });
        tempHunkGroup = [];
        currentLineCount = 0;
      }

      tempHunkGroup.push(hunk);
      currentLineCount += hunkLineCount;
    }

    if (tempHunkGroup.length > 0) {
      const fullChunkDiff = `${header}\n${tempHunkGroup.join('\n')}`;
      const validLineNumbers = this.extractValidLineNumbers(fullChunkDiff);
      chunks.push({
        fileName,
        diff: fullChunkDiff,
        validLineNumbers: validLineNumbers.length > 0 ? validLineNumbers : [1],
      });
    }

    return chunks;
  }

  /**
   * Calculates the exact line numbers in the new file corresponding to added/modified lines.
   */
  static extractValidLineNumbers(diffChunk: string): number[] {
    const validLines: number[] = [];
    const lines = diffChunk.split('\n');
    let currentNewLine = 0;
    let inHunk = false;

    for (const line of lines) {
      // Matches @@ -a,b +c,d @@ with optional function descriptions at the end
      const hunkHeaderMatch = line.match(
        /^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/,
      );
      if (hunkHeaderMatch) {
        currentNewLine = parseInt(hunkHeaderMatch[1], 10);
        inHunk = true;
        continue;
      }

      if (!inHunk) {
        continue;
      }

      if (line.startsWith('+') && !line.startsWith('+++')) {
        validLines.push(currentNewLine);
        currentNewLine++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // Deletions do not advance the new file line counter
      } else if (line.startsWith(' ') || line === '') {
        // Context line
        currentNewLine++;
      }
    }

    return validLines;
  }
}
