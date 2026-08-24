import { DiffParser } from './diff-parser.util';
import { describe, it, expect } from '@jest/globals';

describe('DiffParser', () => {
  const sampleDiff = `diff --git a/src/index.ts b/src/index.ts
index 83db48f..bf269f4 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,5 +1,6 @@
 import express from 'express';
+import cors from 'cors';
 
 const app = express();
+app.use(cors());
 app.listen(3000);
diff --git a/README.md b/README.md
index 1111111..2222222 100644
--- a/README.md
+++ b/README.md
@@ -10,3 +10,4 @@
 # Project
+Added instructions here
`;

  it('should parse a multi-file diff into distinct chunks', () => {
    const chunks = DiffParser.parse(sampleDiff);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].fileName).toBe('src/index.ts');
    expect(chunks[1].fileName).toBe('README.md');
  });

  it('should accurately calculate added line numbers for index.ts', () => {
    const chunks = DiffParser.parse(sampleDiff);
    const indexChunk = chunks[0];

    // In the hunk @@ -1,5 +1,6 @@:
    // line 1 is context ("import express...")
    // line 2 is added ("+import cors...")
    // line 3 is context ("")
    // line 4 is context ("const app...")
    // line 5 is added ("+app.use(cors());")
    expect(indexChunk.validLineNumbers).toEqual([2, 5]);
  });

  it('should accurately calculate added line numbers for README.md', () => {
    const chunks = DiffParser.parse(sampleDiff);
    const readmeChunk = chunks[1];

    // In the hunk @@ -10,3 +10,4 @@:
    // line 10 is context ("# Project")
    // line 11 is added ("+Added instructions here")
    expect(readmeChunk.validLineNumbers).toEqual([11]);
  });

  it('should return an empty array for empty diff string', () => {
    const chunks = DiffParser.parse('');
    expect(chunks).toEqual([]);
  });
});
