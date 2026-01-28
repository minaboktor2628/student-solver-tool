"use client";

import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
      <p className="text-destructive text-sm font-medium">
        Something went wrong.
      </p>
      <p className="text-muted-foreground max-w-md text-xs break-words">
        {error.message}
      </p>
      <Button size="sm" variant="outline" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}
export function GlobalErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={async () => {
        await queryClient.resetQueries();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
