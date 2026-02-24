"use client";

import * as React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertAction,
  type AlertProps,
} from "@/components/ui/alert";
import { Button, type ButtonProps } from "@/components/ui/button";
import { X } from "lucide-react";

type BannerContextValue = {
  dismiss: () => void;
  open: boolean;
};

const BannerContext = React.createContext<BannerContextValue | null>(null);

function useBannerContext() {
  const ctx = React.useContext(BannerContext);
  if (!ctx) {
    throw new Error("BannerClose must be used inside a Banner");
  }
  return ctx;
}

export interface BannerProps extends Omit<AlertProps, "title" | "variant"> {
  /**
   * Controls visibility if provided (controlled mode).
   */
  open?: boolean;
  /**
   * Initial visibility when uncontrolled.
   * @default true
   */
  defaultOpen?: boolean;
  /**
   * Called when the open state changes.
   */
  onOpenChange?(open: boolean): void;
  /**
   * Use the underlying Alert variants (default, destructive, etc).
   */
  variant?: AlertProps["variant"];
}

export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ open, defaultOpen = true, onOpenChange, children, ...props }, ref) => {
    const isControlled = open !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

    const isOpen = isControlled ? open : uncontrolledOpen;

    const dismiss = React.useCallback(() => {
      if (!isControlled) {
        setUncontrolledOpen(false);
      }
      onOpenChange?.(false);
    }, [isControlled, onOpenChange]);

    if (!isOpen) return null;

    return (
      <BannerContext.Provider value={{ dismiss, open: isOpen }}>
        <Alert ref={ref} {...props}>
          {children}
        </Alert>
      </BannerContext.Provider>
    );
  },
);
Banner.displayName = "Banner";

/**
 * Title + description are just re-exports of Alert primitives
 * so they match the rest of your shadcn stack.
 */
export const BannerTitle = AlertTitle;
export const BannerDescription = AlertDescription;

export type BannerCloseProps = Omit<ButtonProps, "variant" | "size">;

/**
 * A close button that hooks into the nearest Banner.
 * You can place this anywhere inside <Banner>.
 */
export const BannerClose = React.forwardRef<
  HTMLButtonElement,
  BannerCloseProps
>(({ className, onClick, ...props }, ref) => {
  const { dismiss } = useBannerContext();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      dismiss();
    }
  };

  return (
    <AlertAction>
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        size="icon"
        className={className}
        onClick={handleClick}
        {...props}
      >
        <X aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Dismiss banner</span>
      </Button>
    </AlertAction>
  );
});
BannerClose.displayName = "BannerClose";
