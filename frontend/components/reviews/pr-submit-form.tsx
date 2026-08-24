"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { prSubmissionSchema, type PrSubmissionFormValues } from "@/lib/validations/review";
import { reviewService } from "@/lib/services/review.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PrSubmitForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PrSubmissionFormValues>({
    resolver: zodResolver(prSubmissionSchema),
    defaultValues: { prUrl: "" },
  });

  const onSubmit = async (data: PrSubmissionFormValues) => {
    try {
      setServerError(null);
      const res = await reviewService.submitPr(data);
      router.push(`/reviews/${res.reviewId}`);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to submit PR for review";
      setServerError(Array.isArray(message) ? message[0] : message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="prUrl">GitHub Pull Request URL</Label>
        <Input
          id="prUrl"
          placeholder="https://github.com/facebook/react/pull/12345"
          {...register("prUrl")}
        />
        {errors.prUrl && (
          <p className="text-xs text-destructive">{errors.prUrl.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting PR..." : "Start Review"}
      </Button>
    </form>
  );
}