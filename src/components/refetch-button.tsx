"use client";
import { RefreshCwIcon } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button";

type Refetchable = {
  refetch: () => void;
  isRefetching: boolean;
};

export function RefetchButton({
  query,
  children,
  ...props
}: {
  query: Refetchable;
} & ButtonProps) {
  const { refetch, isRefetching } = query;

  return (
    <Button
      onClick={() => refetch()}
      disabled={isRefetching}
      variant="outline"
      {...props}
    >
      <RefreshCwIcon className={isRefetching ? "animate-spin" : ""} />{" "}
      {children ?? "Re-fetch"}
    </Button>
  );
}
