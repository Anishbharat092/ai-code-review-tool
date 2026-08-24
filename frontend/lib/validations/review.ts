import { z } from "zod";

const GITHUB_PR_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/;

export const prSubmissionSchema = z.object({
  prUrl: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .regex(GITHUB_PR_REGEX, {
      message:
        "Must be a valid GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)",
    }),
});

export type PrSubmissionFormValues = z.infer<typeof prSubmissionSchema>;
