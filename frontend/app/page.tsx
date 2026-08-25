"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useReducedMotion } from "framer-motion";
import { Scene3D } from "@/components/landing/scene-3d";
import { useAuthStore } from "@/stores/auth-store";
import {
  ArrowRight,
  ShieldAlert,
  Zap,
  Lock,
  Sparkles,
  Check,
  LogOut,
  ChevronDown,
  GitPullRequest,
} from "lucide-react";

// Reusable scroll reveal with reduced-motion support
function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.65,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  
  const [prUrl, setPrUrl] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkAuth();
  }, [checkAuth]);

  // Global Page Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scrollProgressRef = useRef<number>(0);

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      scrollProgressRef.current = latest;
    });
  }, [scrollYProgress]);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl.trim()) return;

    const encodedPr = encodeURIComponent(prUrl.trim());
    if (user) {
      router.push(`/dashboard?pr=${encodedPr}`);
    } else {
      router.push(`/login?redirect=/dashboard?pr=${encodedPr}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-emerald-500 selection:text-black font-sans overflow-x-hidden">
      {/* 3D WebGL Canvas Layer */}
      <Scene3D scrollY={scrollProgressRef} />

      {/* Micro Top Scroll-Progress Indicator */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-300 z-[60] shadow-[0_0_10px_#10b981] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Dynamic Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-zinc-950/75 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
            <span className="font-bold tracking-tight text-sm sm:text-base text-zinc-100">
              AI Code Reviewer
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 min-h-[36px]">
            {isMounted ? (
              user ? (
                <>
                  <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block">
                    {user.email}
                  </span>
                  <Link
                    href="/dashboard"
                    className="text-xs font-semibold bg-emerald-400 text-zinc-950 px-4 py-2 rounded-full hover:bg-emerald-300 transition-colors shadow-sm"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => logout()}
                    aria-label="Sign out of your account"
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 rounded-full transition-all shadow-md shadow-emerald-500/20"
                  >
                    Get Started
                  </Link>
                </>
              )
            ) : (
              <div className="w-24 h-8 bg-white/5 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </header>

      {/* Main Narrative Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pt-28 pb-24 space-y-28">
        
        {/* Chapter 1: Hero */}
        <ScrollReveal className="relative min-h-[75vh] flex flex-col justify-center items-center text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-400 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI-Powered Automated PR Reviews</span>
          </div>

          <div className="flex flex-col gap-3 max-w-5xl">
            <span className="text-sm sm:text-base font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Automated AI Code Reviews
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent leading-[1.08]">
              Catch logic & security bugs <br />
              <span className="text-emerald-400 block mt-2 sm:inline sm:mt-0">
                Before they hit production
              </span>
            </h1>
          </div>

          <p className="max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
            Connect your repository or paste a GitHub PR link. Get instant, line-by-line feedback on security risks and logic flaws before you merge.
          </p>

          <form
            onSubmit={handleHeroSubmit}
            className="w-full max-w-xl flex flex-col sm:flex-row items-center gap-2 bg-zinc-950/85 border border-white/20 p-2 rounded-2xl shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center gap-2.5 px-3 flex-1 w-full text-zinc-400">
              <GitPullRequest className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <input
                type="url"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/123"
                aria-label="GitHub Pull Request URL"
                required
                className="bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500 w-full font-mono"
              />
            </div>
            <button
              type="submit"
              aria-label="Submit Pull Request for AI review"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-400 text-zinc-950 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-emerald-300 transition-all flex-shrink-0 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <span>Review PR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap justify-center items-center gap-6 pt-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Free to test
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Public & Private repos
            </span>
          </div>

          <div className="pt-6 flex flex-col items-center gap-1.5 opacity-60 font-mono text-[11px] tracking-widest text-zinc-400 uppercase animate-bounce">
            <span>Scroll to inspect engine</span>
            <ChevronDown className="w-4 h-4 text-emerald-400" />
          </div>
        </ScrollReveal>

        {/* Section: Inspection Engine Steps */}
        <div className="space-y-24">
          
          {/* Step 1: Chunking Engine */}
          <ScrollReveal className="space-y-6 max-w-4xl mx-auto px-4">
            <div className="text-center space-y-1.5 max-w-2xl mx-auto">
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
                Step 01 // Distributed Chunking
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                AST Line Anchor Verification
              </h2>
            </div>

            <div className="bg-zinc-950/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl">
              <div className="bg-white/[0.03] border-b border-white/10 px-6 py-3.5 flex items-center justify-between font-mono text-xs text-zinc-400">
                <span className="text-emerald-400 font-semibold">worker://diff-chunker/job-queue.ts</span>
                <span className="text-emerald-400 font-medium">STATUS: CHUNKING</span>
              </div>
              <div className="p-6 font-mono text-xs sm:text-sm space-y-3 text-zinc-300 overflow-x-auto">
                <div className="text-zinc-500">// Extracting valid line ranges from PR diff...</div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-300 space-y-1.5 whitespace-nowrap sm:whitespace-normal">
                  <div>+ [Chunk 0] src/auth/guards/jwt.guard.ts (Valid Lines: 12–48)</div>
                  <div>+ [Chunk 1] src/reviews/reviews.service.ts (Valid Lines: 84–130)</div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Step 2: AST Pattern Scanner */}
          <ScrollReveal className="space-y-6 max-w-4xl mx-auto px-4">
            <div className="text-center space-y-1.5 max-w-2xl mx-auto">
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
                Step 02 // Neural AST Analysis
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Abstract Syntax Tree Inspection
              </h2>
            </div>

            <div className="bg-zinc-950/90 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl">
              <div className="bg-white/[0.03] border-b border-white/10 px-6 py-3.5 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-zinc-300 font-medium">ast://parser/jwt-access.guard.ts</span>
                </div>
                <span className="text-amber-400 font-mono text-[11px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
                  CWE-347 // Insecure Signature
                </span>
              </div>

              <div className="p-6 grid sm:grid-cols-2 gap-5 font-mono text-xs">
                {/* Source Token Stream */}
                <div className="bg-black/60 border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[160px] overflow-x-auto">
                  <div>
                    <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-3 font-semibold">
                      Source Token Stream
                    </div>
                    <div className="space-y-1 font-mono text-[12px] leading-relaxed whitespace-nowrap sm:whitespace-normal">
                      <div className="text-zinc-400">
                        <span className="text-zinc-600 inline-block w-6 select-none">32</span> const token = req.headers.auth;
                      </div>
                      <div className="text-zinc-400 h-4">
                        <span className="text-zinc-600 inline-block w-6 select-none">33</span>
                      </div>
                      <div className="bg-amber-500/15 border-l-2 border-amber-400 -mx-4 px-4 text-amber-200 py-1 my-0.5">
                        <span className="text-amber-500/60 inline-block w-6 select-none font-bold">34</span> const decoded = <span className="underline decoration-amber-400 font-bold bg-amber-400/10 px-1 rounded-sm">jwt.decode</span>(token);
                      </div>
                      <div className="text-zinc-400">
                        <span className="text-zinc-600 inline-block w-6 select-none">35</span> return decoded.user;
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evaluated Node Tree */}
                <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[160px] overflow-x-auto">
                  <div>
                    <div className="text-emerald-400/90 text-[11px] uppercase tracking-wider flex items-center justify-between mb-3 font-semibold">
                      <span>Evaluated Node</span>
                      <span className="text-zinc-500 text-[10px] font-normal lowercase">anchor: line 34</span>
                    </div>
                    <div className="space-y-2 pt-1 text-[12px] font-mono whitespace-nowrap sm:whitespace-normal">
                      <div className="text-zinc-600">
                        └── <span className="text-zinc-200 font-medium">VariableDeclaration</span>
                      </div>
                      <div className="text-zinc-600 pl-4">
                        └── <span className="text-emerald-400 font-medium">CallExpression</span> <span className="text-zinc-400 font-normal text-xs">(jwt.decode)</span>
                      </div>
                      <div className="text-zinc-600 pl-8">
                        ├── <span className="text-zinc-400">Callee:</span> <span className="text-zinc-300">MemberExpression</span>
                      </div>
                      <div className="text-zinc-600 pl-8">
                        └── <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md text-[11px] uppercase tracking-wide">SignatureCheck: MISSING</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Step 3: Precision Patch Output */}
          <ScrollReveal className="space-y-6 max-w-4xl mx-auto px-4">
            <div className="text-center space-y-1.5 max-w-2xl mx-auto">
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
                Step 03 // Precision Patch Output
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Line-Accurate Code Replacement
              </h2>
            </div>

            <div className="bg-zinc-950/90 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl">
              <div className="bg-white/[0.03] border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-300 font-medium">
                  src/auth/jwt-access.guard.ts : Line 34
                </span>
                <span className="text-[11px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono font-medium">
                  SUGGESTED PATCH
                </span>
              </div>

              <div className="p-6 font-mono text-[12px] sm:text-xs space-y-2.5 bg-black/40 overflow-x-auto">
                <div className="text-rose-400/80 bg-rose-500/10 -mx-6 px-6 py-1.5 select-none whitespace-nowrap sm:whitespace-normal">
                  <span className="inline-block w-4 mr-2 font-bold">-</span>const decoded = jwt.decode(token);
                </div>
                <div className="text-emerald-400 font-semibold bg-emerald-500/10 -mx-6 px-6 py-1.5 select-none border-l-2 border-emerald-400 whitespace-nowrap sm:whitespace-normal">
                  <span className="inline-block w-4 mr-2 font-bold">+</span>const verified = jwt.verify(token, process.env.JWT_SECRET!);
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>

        {/* Chapter 4: Architecture & Security Standards */}
        <ScrollReveal className="space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
              Infrastructure
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Battle-Tested Architecture
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Security standards, distributed queuing, and token encryption baked into the core.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="group relative bg-zinc-950/70 border border-white/10 p-8 rounded-3xl backdrop-blur-xl space-y-4 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)]">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                  CWE Top 25
                </span>
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">OWASP Top 10 Aligned</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Flags injections, broken auth checks, IDOR vulnerabilities, and tainted user inputs before production.
              </p>
            </div>

            <div className="group relative bg-zinc-950/70 border border-white/10 p-8 rounded-3xl backdrop-blur-xl space-y-4 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)]">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                  BullMQ + Redis
                </span>
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">Distributed Job Queue</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Parallel background workers process large PR file trees concurrently with zero gateway timeouts.
              </p>
            </div>

            <div className="group relative bg-zinc-950/70 border border-white/10 p-8 rounded-3xl backdrop-blur-xl space-y-4 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)]">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                  AES-256 Encrypted
                </span>
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">AES-256-GCM Vault</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                GitHub tokens are encrypted at rest with unique initialization vectors prior to database storage.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Chapter 5: Benchmark Numbers */}
        <ScrollReveal className="relative overflow-hidden bg-zinc-950/80 border border-white/10 rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="space-y-2 px-4">
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight uppercase">
                Diff
              </div>
              <div className="text-sm sm:text-base font-semibold text-zinc-100">
                Aware Chunking
              </div>
              <div className="text-xs text-zinc-400 font-mono tracking-wide">
                Token-window optimized
              </div>
            </div>

            <div className="space-y-2 px-4 pt-8 md:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight uppercase">
                Hunk
              </div>
              <div className="text-sm sm:text-base font-semibold text-zinc-100">
                Line Validation
              </div>
              <div className="text-xs text-zinc-400 font-mono tracking-wide">
                Prunes invalid anchors
              </div>
            </div>

            <div className="space-y-2 px-4 pt-8 md:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight uppercase">
                AES
              </div>
              <div className="text-sm sm:text-base font-semibold text-zinc-100">
                256-Bit Encrypted
              </div>
              <div className="text-xs text-zinc-400 font-mono tracking-wide">
                Tokens secured at rest
              </div>
            </div>

            <div className="space-y-2 px-4 pt-8 md:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight uppercase">
                Git
              </div>
              <div className="text-sm sm:text-base font-semibold text-zinc-100">
                Multi-File Diffs
              </div>
              <div className="text-xs text-zinc-400 font-mono tracking-wide">
                Any text-based format
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Chapter 6: Final Call to Action */}
        <ScrollReveal className="relative text-center space-y-8 py-20 border-t border-white/10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

          <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              Ready to ship cleaner code?
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Connect your GitHub account and run your first AST-validated neural review in under 30 seconds.
            </p>
          </div>

          <div className="relative z-10 pt-2 flex justify-center">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-3 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold px-10 py-4 rounded-xl transition-all duration-300 text-base shadow-[0_0_40px_rgba(52,211,153,0.3)] hover:shadow-[0_0_60px_rgba(52,211,153,0.5)] hover:-translate-y-1"
            >
              <GitPullRequest className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Launch Dashboard</span>
            </Link>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}