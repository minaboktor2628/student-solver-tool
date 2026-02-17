"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isMobile = useIsMobile();
  const position = isMobile ? "top-center" : "bottom-right";

  return (
    <Sonner
      richColors
      closeButton
      position={position}
      theme={theme as ToasterProps["theme"]}
      toastOptions={{ duration: 5000 }}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success)",
          "--success-border": "var(--success)",
          "--success-text": "var(--foreground)",

          "--error-bg": "var(--destructive)",
          "--error-border": "var(--destructive)",
          "--error-text": "var(--primary-foreground)",

          "--warning-bg": "var(--warning)",
          "--warning-border": "var(--warning)",
          "--warning-text": "var(--foreground)",

          "--info-bg": "var(--popover)",
          "--info-text": "var(--popover-foreground)",
          "--info-border": "var(--border)",

          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
