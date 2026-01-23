import type React from "react";
import { LoadingSpinner } from "./loading-spinner";
import { Suspense } from "react";

export function GlobalSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
