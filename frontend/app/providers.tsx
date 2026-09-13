"use client";

// HackShelf — client providers (Phase 13): TanStack Query + Auth state.

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Sane defaults for a catalog site: stale data is shown while
            // refetching, and errors are retried once (except 4xx).
            staleTime: 60 * 1000,
            retry: (failureCount, error) =>
              failureCount < 1 &&
              !(error instanceof Error && "status" in error),
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}