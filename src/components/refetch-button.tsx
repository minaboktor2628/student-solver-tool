"use client";
import { RefreshCwIcon } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button";

export function RefetchButton({
  refetch,
  isRefetching,
  ...props
}: {
  refetch: () => void;
  isRefetching: boolean;
} & ButtonProps) {
  return (
    <Button
      onClick={refetch}
      disabled={isRefetching}
      variant="outline"
      size="sm"
      {...props}
    >
      <RefreshCwIcon className={isRefetching ? "animate-spin" : ""} /> Re-fetch
    </Button>
  );
}
