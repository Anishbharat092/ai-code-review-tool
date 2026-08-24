"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
      setIsMounting(false);
    };
    initializeAuth();
  }, [checkAuth]);

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