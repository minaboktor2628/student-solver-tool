"use client";

import { useIsFetching } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// if there is ever a query that is fetching, render a spinner
export function AnyQueryFetchingSpinner() {
  const isFetching = useIsFetching();

  return (
    <>
      {isFetching > 0 && (
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
      )}
    </>
  );
}
