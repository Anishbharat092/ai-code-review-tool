import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import { IssueSeverity, ReviewIssue } from '../schemas/review.schema';

export interface ChunkAnalysisResult {
  issues: ReviewIssue[];
  summary?: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI;
  private readonly fallbackModels = [
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.0-flash',
  ];

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not defined in environment variables',
      );
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async reviewChunk(
    fileName: string,
    diffContent: string,
    validLineNumbers: number[],
  ): Promise<ChunkAnalysisResult> {
    const prompt = `
You are an expert code reviewer. Analyze the following unified diff chunk for "${fileName}".

Focus on:
1. Bugs, logical errors, and edge-case failures.
2. Security risks and unsafe input handling.
3. Performance bottlenecks and resource leaks.
4. Clean code and architectural style improvements.

STRICT LINE NUMBER RULES:
- Only report issues for lines that were ADDED or MODIFIED in this patch.
- Valid allowed new-file line numbers for this chunk are: [${validLineNumbers.join(', ')}].
- If an issue is general or references a line not in this list, assign it to the closest valid added line number from the list.
- Do NOT hallucinate line numbers.

Diff to review:
\`\`\`diff
${diffContent}
\`\`\`
`;

    const config = {
      systemInstruction:
        'You are a senior staff engineer performing a strict, production-grade code review. Return actionable, precise, line-accurate feedback in JSON format.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description:
              'Brief summary of the changes and overall quality in this chunk',
          },
          issues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: {
                  type: Type.STRING,
                  enum: ['critical', 'warning', 'suggestion'],
                  description: 'Severity level of the issue',
                },
                line: {
                  type: Type.INTEGER,
                  description: 'Exact added line number where the issue occurs',
                },
                message: {
                  type: Type.STRING,
                  description:
                    'Clear, actionable description of the issue and suggested fix',
                },
              },
              required: ['severity', 'line', 'message'],
            },
          },
        },
        required: ['issues'],
      },
    };

    let lastError: Error | null = null;

    for (const model of this.fallbackModels) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model,
            contents: prompt,
            config,
          });

          const rawText = response.text;
          if (!rawText) {
            return { issues: [] };
          }

          const parsed = JSON.parse(rawText) as {
            summary?: string;
            issues?: Array<{ severity: string; line: number; message: string }>;
          };

          const sanitizedIssues: ReviewIssue[] = (parsed.issues || [])
            .filter((issue) => validLineNumbers.includes(issue.line))
            .map((issue) => ({
              severity: this.normalizeSeverity(issue.severity),
              line: issue.line,
              message: issue.message,
            }));

          return {
            summary: parsed.summary,
            issues: sanitizedIssues,
          };
        } catch (err: any) {
          lastError = err;
          const isTransient =
            err?.status === 503 ||
            err?.message?.includes('503') ||
            err?.message?.includes('UNAVAILABLE') ||
            err?.status === 429;

          if (isTransient && attempt < 3) {
            const delayMs = attempt * 1500 + Math.floor(Math.random() * 500);
            this.logger.warn(
              `Attempt ${attempt} on model ${model} failed for ${fileName} (503/429). Retrying in ${delayMs}ms...`,
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          this.logger.warn(
            `Model ${model} failed for ${fileName}: ${err.message}. Trying next fallback model...`,
          );
          break;
        }
      }
    }

    this.logger.error(
      `All Gemini fallback attempts failed for ${fileName}: ${lastError?.message}`,
    );
    throw new InternalServerErrorException(
      `Failed to analyze diff chunk with Gemini: ${lastError?.message}`,
    );
  }

  private normalizeSeverity(severity: string): IssueSeverity {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return IssueSeverity.CRITICAL;
      case 'warning':
        return IssueSeverity.WARNING;
      default:
        return IssueSeverity.SUGGESTION;
    }
  }
}
