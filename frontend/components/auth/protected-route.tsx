"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRouteContent({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = searchParams.get("token");
      if (token) {
        localStorage.setItem("accessToken", token);
        useAuthStore.setState({ accessToken: token, isAuthenticated: true });
        await fetchUser?.();
      } else {
        await checkAuth();
      }
      setIsMounting(false);
    };
    initializeAuth();
  }, [searchParams, checkAuth, fetchUser]);

  useEffect(() => {
    if (!isMounting && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isMounting, isLoading, isAuthenticated, router]);

  if (isMounting || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ProtectedRouteContent>{children}</ProtectedRouteContent>
    </Suspense>
  );
}