"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { reviewService } from "@/lib/services/review.service";
import type { Review } from "@/lib/types/review";
import { Button } from "@/components/ui/button";
import { GitPullRequest, ArrowRight } from "lucide-react";

export function ReviewList() {
  const {
    data: reviews,
    isLoading,
    isError,
  } = useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: () => reviewService.getReviews(),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !reviews || reviews.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-zinc-400">
          No reviews submitted yet. Submit a Pull Request URL above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      {reviews.map((review) => {
        const reviewId = review._id || (review as any).id;
        const totalIssues = (review.chunks || []).reduce(
          (total, chunk) => total + (chunk.issues?.length || 0),
          0
        );

        return (
          <div
            key={reviewId}
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-zinc-100 font-semibold text-sm sm:text-base">
                  <GitPullRequest className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>
                    {review.repoName || "PR"} #{review.prNumber || ""}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${
                    review.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : review.status === "failed"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                  }`}
                >
                  {review.status}
                </span>
              </div>
              <p className="max-w-lg truncate text-xs text-zinc-400 font-mono">
                {review.prUrl}
              </p>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-center flex-shrink-0">
              <span className="text-xs text-zinc-400">
                {totalIssues} {totalIssues === 1 ? "issue" : "issues"}
              </span>
              <Link href={`/reviews/${reviewId}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white text-xs rounded-xl"
                >
                  <span>View Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}