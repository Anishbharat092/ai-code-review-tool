"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { useAuthStore } from "@/stores/auth-store";
import { Scene3D } from "@/components/landing/scene-3d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitPullRequest, CheckCircle2, Cpu } from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const login = useAuthStore((state) => state.login);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const [serverError, setServerError] = useState<string | null>(null);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const scrollProgressRef = useRef<number>(0);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("accessToken", token);
      fetchUser?.();
      router.push("/dashboard");
    }
  }, [searchParams, fetchUser, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError(null);
      await login(data);
      router.push(redirectUrl);
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid email or password";
      setServerError(Array.isArray(message) ? message[0] : message);
    }
  };

  const handleGitHubLogin = () => {
    setIsGitHubLoading(true);
    setServerError(null);

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL;

    if (!clientId || !redirectUri) {
      setIsGitHubLoading(false);
      setServerError("GitHub OAuth is not configured for this environment.");
      return;
    }

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "read:user,user:email,repo");
    authUrl.searchParams.set("state", "login_flow");

    window.location.href = authUrl.toString();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-[#030712] text-white selection:bg-indigo-500 selection:text-white font-sans overflow-hidden">
      <Scene3D scrollY={scrollProgressRef} />

     <div className="relative z-10 hidden lg:flex flex-1 flex-col justify-between p-12 lg:p-16 border-r border-white/10 backdrop-blur-[2px]">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="h-3.5 w-3.5 rounded-full bg-indigo-500 shadow-[0_0_12px_#6366f1] animate-pulse" />
          <span className="font-bold tracking-tight text-lg text-zinc-100">
            AI Code Reviewer
          </span>
        </Link>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-medium text-indigo-300 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Encrypted Review Environment</span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Automated diff analysis for every pull request.
          </h2>

          <div className="space-y-3 pt-2 text-sm text-zinc-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Token-window validated diff chunking</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Security & logic defect detection</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>AES-256 encrypted GitHub OAuth tokens</span>
            </div>
          </div>
        </div>

        <div className="font-mono text-xs text-zinc-500">
          SYSTEM://STABLE // 256-BIT_ENCRYPTED
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950/80 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-400">
              Sign in to run automated line-anchored reviews.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGitHubLogin}
            disabled={isGitHubLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all shadow-sm group disabled:opacity-50"
          >
            <GitPullRequest className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span>
              {isGitHubLoading ? "Redirecting to GitHub..." : "Continue with GitHub"}
            </span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-zinc-950 px-3 text-xs text-zinc-500 font-mono uppercase">
              or credentials
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400">
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-zinc-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="developer@company.com"
                className="rounded-xl border-white/15 bg-black/60 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-zinc-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="rounded-xl border-white/15 bg-black/60 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              {isSubmitting ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-xs text-zinc-400 pt-2">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#030712] flex items-center justify-center text-zinc-400 font-mono text-sm">Loading security workspace...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}