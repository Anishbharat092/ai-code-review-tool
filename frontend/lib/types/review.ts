export type ReviewStatus = "pending" | "processing" | "completed" | "failed";
export type IssueSeverity = "critical" | "warning" | "suggestion";

export interface ReviewIssue {
  severity: IssueSeverity;
  line: number;
  message: string;
}

export interface ReviewChunk {
  fileName: string;
  status: "pending" | "evaluated" | "failed";
  issues: ReviewIssue[];
}

export interface SecretFound {
  fileName: string;
  line: number;
  type: string;
}

export interface Review {
  _id: string;
  userId: string;
  repoName: string;
  prNumber: number;
  prUrl: string;
  status: ReviewStatus;
  chunks: ReviewChunk[];
  secretsFound: SecretFound[];
  overallSummary: string | null;
  createdAt: string;
  completedAt?: string;
}

export interface SubmitPrPayload {
  prUrl: string;
}

export interface SubmitPrResponse {
  reviewId: string;
}
