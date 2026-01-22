"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type SpinnerSize = "sm" | "md" | "lg" | number;

export type LoadingSpinnerProps = React.ComponentProps<"div"> & {
  /** Visual size (or a number in px). */
  size?: SpinnerSize;
  /** Show a centered overlay; pass "fullscreen" to cover the whole viewport. */
  overlay?: boolean | "fullscreen";
  /** Optional text shown next to the spinner (and read by screen readers). */
  label?: string;
  /** Delay (ms) before showing to avoid flicker on very fast loads. */
  delay?: number;
  /** Replace the icon if you want (must accept className). */
  icon?: React.ComponentType<{ className?: string }>;
};

export const LoadingSpinner = React.forwardRef<
  HTMLDivElement,
  LoadingSpinnerProps
>(
  (
    {
      size = "md",
      overlay = false,
      label = "Loading...",
      delay = 0,
      icon: Icon = Loader2,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(delay === 0);

    React.useEffect(() => {
      if (delay === 0) return;
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }, [delay]);

    const sizeClass =
      typeof size === "number"
        ? null
        : size === "sm"
          ? "size-4"
          : size === "lg"
            ? "size-10"
            : "size-6";

    const iconStyle =
      typeof size === "number" ? { width: size, height: size } : undefined;

    const overlayClasses =
      overlay === "fullscreen"
        ? "fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm"
        : overlay
          ? "absolute inset-0 z-30 grid place-items-center bg-background/50"
          : "inline-flex items-center";

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-busy={visible ? "true" : "false"}
        data-state={visible ? "visible" : "hidden"}
        className={cn(overlayClasses, !overlay && "gap-2", className)}
        {...rest}
      >
        {visible && (
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                "animate-spin motion-reduce:animate-none",
                sizeClass,
              )}
              style={iconStyle}
            />
            <span className="text-muted-foreground text-sm">
              {children ?? label}
            </span>
          </div>
        )}
      </div>
    );
  },
);

LoadingSpinner.displayName = "LoadingSpinner";
