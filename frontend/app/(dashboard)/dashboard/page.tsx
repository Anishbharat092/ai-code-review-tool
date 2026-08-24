"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Scene3D } from "@/components/landing/scene-3d";
import { Button } from "@/components/ui/button";
import { PrSubmitForm } from "@/components/reviews/pr-submit-form";
import { GitHubConnect } from "@/components/github/github-connect";
import { ReviewList } from "@/components/reviews/review-list";
import { LogOut, LayoutDashboard, Sparkles, GitPullRequest } from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const logout = useAuthStore((state) => state.logout);
  const scrollProgressRef = useRef<number>(0);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("accessToken", token);
      fetchUser?.();
      router.replace("/dashboard");
    }
  }, [searchParams, fetchUser, router]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        scrollProgressRef.current = window.scrollY / totalScroll;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-white selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden">
      <Scene3D scrollY={scrollProgressRef} />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_12px_#6366f1] animate-pulse" />
            <span className="font-bold tracking-tight text-base text-zinc-100">
              AI Code Reviewer
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline-block">
              {user?.email || "Authenticated"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-xs"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 pt-28 pb-20 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="h-6 w-6 text-indigo-400" />
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Dashboard
              </h1>
            </div>
            <p className="text-sm text-zinc-300">
              Welcome back{user?.name ? `, ${user.name}` : ""}. Submit PRs for line-accurate AST review.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/15 bg-zinc-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Submit New PR
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Provide a GitHub Pull Request URL for automated line-accurate review.
              </p>
            </div>
            <PrSubmitForm />
          </div>

          <div className="rounded-3xl border border-white/15 bg-zinc-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-cyan-400" />
                GitHub Integration
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Connect your GitHub account to review public and private repositories.
              </p>
            </div>
            <GitHubConnect />
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-zinc-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Recent Reviews
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              All Pull Requests analyzed by AI Code Reviewer.
            </p>
          </div>
          <ReviewList />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030712] flex items-center justify-center text-zinc-400 font-mono text-sm">
          Loading dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}