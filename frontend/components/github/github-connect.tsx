"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { githubService } from "@/lib/services/github.service";
import { Button } from "@/components/ui/button";

export function GitHubConnect() {
  const searchParams = useSearchParams();
  const isConnectedParam = searchParams.get("github") === "connected";
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser?.();
  }, [fetchUser]);

  // Connected if boolean is true, username exists, or URL query param is present
  const isConnected = Boolean(
    user?.githubConnected || user?.githubUsername || isConnectedParam
  );

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const url = await githubService.getConnectUrl();
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setIsLoading(false);
      const message =
        err.response?.data?.message || "Failed to initiate GitHub connection";
      setError(Array.isArray(message) ? message[0] : message);
    }
  };

  if (isConnected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium">
              GitHub Connected {user?.githubUsername ? `(@${user.githubUsername})` : ""}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your account is linked. You can now submit Pull Requests for automated reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Link your GitHub account to enable the backend to fetch PR diffs and securely review your pull requests.
      </p>
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? "Redirecting to GitHub..." : "Connect GitHub Account"}
      </Button>
    </div>
  );
}