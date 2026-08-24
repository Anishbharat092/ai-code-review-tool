"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { reviewService } from "@/lib/services/review.service";
import type { Review, IssueSeverity } from "@/lib/types/review";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReviewScanner3D } from "@/components/reviews/review-scanner-3d";
import { AlertTriangle, ExternalLink, ArrowLeft } from "lucide-react";

function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const styles: Record<IssueSeverity, string> = {
    critical: "bg-destructive/15 text-destructive border-destructive/30",
    warning:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    suggestion:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
        styles[severity] || "bg-muted text-muted-foreground"
      }`}
    >
      {severity}
    </span>
  );
}

export default function ReviewDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const {
    data: review,
    isLoading,
    isError,
    error,
  } = useQuery<Review>({
    queryKey: ["review", id],
    queryFn: () => reviewService.getReviewById(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") {
        return false;
      }
      return 3000;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading review data...</p>
      </div>
    );
  }

  if (isError || !review) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to Load Review
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {(error as any)?.response?.data?.message ||
              "Review record not found"}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isWorking =
    review.status === "pending" || review.status === "processing";
  const allIssues = (review.chunks || []).flatMap((chunk) =>
    (chunk.issues || []).map((issue) => ({
      ...issue,
      fileName: chunk.fileName,
    }))
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {review.repoName || "Repository"} #{review.prNumber || ""}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                review.status === "completed"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : review.status === "failed"
                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
              }`}
            >
              {review.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <a
              href={review.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-primary inline-flex items-center gap-1.5"
            >
              <span>{review.prUrl}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </p>
        </div>
        <Link href="/dashboard">
          <Button 
            variant="outline" 
            className="border-white/20 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-800 hover:text-white shadow-md backdrop-blur-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
      </div>

      {/* 3D Holographic Scanner Component */}
      <ReviewScanner3D isWorking={isWorking} />

      {/* Summary Card */}
      {review.overallSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">
              {review.overallSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Local Secrets Detected */}
      {review.secretsFound && review.secretsFound.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Secrets Detected Locally
            </CardTitle>
            <CardDescription>
              Flagged before processing to prevent credential exposure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {review.secretsFound.map((secret, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-md border border-destructive/20 bg-background p-3 text-sm"
              >
                <div>
                  <span className="font-mono font-medium">
                    {secret.fileName}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    Line {secret.line}
                  </span>
                </div>
                <span className="rounded bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
                  {secret.type}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Issues Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Issues Found ({allIssues.length})
        </h2>

        {allIssues.length === 0 && review.status === "completed" ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No issues detected in this Pull Request.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {allIssues.map((issue, idx) => (
              <Card key={idx}>
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={issue.severity} />
                      <span className="font-mono text-sm font-semibold">
                        {issue.fileName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Line {issue.line}
                      </span>
                    </div>
                    <p className="text-sm text-foreground pt-1">
                      {issue.message}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}