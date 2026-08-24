"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-[#030712] text-white">
        {children}
      </div>
    </ProtectedRoute>
  );
}